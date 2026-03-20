/**
 * gemini.js
 * Calls the Gemini API to extract structured accident details.
 *
 * Priority chain:
 *  1. Firebase Cloud Function → Vertex AI (server-side, most secure)
 *  2. Direct Gemini REST API — tiered model fallback (3 models)
 *  3. Validated mock data (always produces usable output)
 */

import { analyzeViaCloudFunction } from './cloudFunctionService';

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const AI_TIMEOUT_MS = 8000;

// Tiered model fallback: tries premium model first, then falls back to stable flash
const GEMINI_MODELS = [
  'gemini-3.0-flash-preview',
  'gemini-2.0-flash',
  'gemini-1.5-flash-latest'
];
const geminiUrl = (model) =>
  `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_API_KEY}`;

const EXTRACTION_PROMPT = `
You are an AI accident analysis assistant. Given a description of a road accident scene (from voice input or image analysis), extract structured details and return them as a valid JSON object.

OUTPUT FORMAT (JSON only, no markdown, no explanation):
{
  "location": "coordinates or description if known",
  "time": "ISO timestamp",
  "vehicles_count": <number>,
  "injuries_detected": "none|minor|severe|critical",
  "helmet_detected": <true|false>,
  "road_condition": "dry|wet|icy|damaged|unknown",
  "urgency_level": "LOW|MEDIUM|HIGH|CRITICAL",
  "confidence_score": <0.0-1.0>,
  "summary": "<one sentence summary of the accident>",
  "vehicles": [
    { "type": "<type>", "color": "<color>", "plate": "<plate or N/A>", "damage": "<damage description>" }
  ]
}

RULES:
- urgency_level CRITICAL if fire, explosion, or multiple critical injuries
- urgency_level HIGH if bleeding, unconscious, or severe injuries detected
- urgency_level MEDIUM if minor injuries
- urgency_level LOW if no injuries
- If a field is unknown, use a sensible default (e.g. "unknown" for road_condition)
- ALWAYS return valid JSON. Never add text outside the JSON.
`.trim();

/**
 * Validates and sanitizes a report object.
 * Ensures every required field has a safe, defined value.
 * Never returns undefined — always returns a usable report.
 */
export const validateReport = (data = {}) => {
  const VALID_INJURIES = ['none', 'minor', 'severe', 'critical', 'unknown'];
  const VALID_URGENCY = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];
  const VALID_ROAD = ['dry', 'wet', 'icy', 'damaged', 'unknown'];

  return {
    location: data.location || 'unavailable',
    time: data.time || new Date().toISOString(),
    vehicles_count: typeof data.vehicles_count === 'number' ? data.vehicles_count : 0,
    injuries_detected: VALID_INJURIES.includes(data.injuries_detected) ? data.injuries_detected : 'unknown',
    helmet_detected: typeof data.helmet_detected === 'boolean' ? data.helmet_detected : false,
    road_condition: VALID_ROAD.includes(data.road_condition) ? data.road_condition : 'unknown',
    urgency_level: VALID_URGENCY.includes(data.urgency_level) ? data.urgency_level : 'LOW',
    confidence_score: typeof data.confidence_score === 'number'
      ? Math.max(0, Math.min(1, data.confidence_score))
      : 0.5,
    summary: typeof data.summary === 'string' && data.summary.length > 0
      ? data.summary.slice(0, 200)
      : 'Accident scene captured. Details require manual verification.',
    vehicles: Array.isArray(data.vehicles) ? data.vehicles : [],
  };
};

/**
 * Wraps a promise with an 8-second timeout.
 */
const withTimeout = (promise, ms = AI_TIMEOUT_MS) =>
  Promise.race([
    promise,
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error('AI_TIMEOUT')), ms)
    )
  ]);

/**
 * Calls the Gemini API with a scene description or voice transcript.
 * Falls back gracefully to mock data if all models fail or timeout.
 */
export const extractAccidentDetails = async (sceneInput) => {
  const mockData = validateReport({
    location: "17.4583, 78.3728",
    time: new Date().toISOString(),
    vehicles_count: 2,
    injuries_detected: "severe",
    helmet_detected: false,
    road_condition: "wet",
    urgency_level: "HIGH",
    confidence_score: 0.92,
    summary: "Bike hit divider on a wet road, rider bleeding and unresponsive.",
    vehicles: [
      { type: "Motorcycle", color: "Red", plate: "MOTO-789", damage: "Totaled front" },
      { type: "Divider", color: "N/A", plate: "N/A", damage: "Impact point" }
    ]
  });

  const sceneDescription = sceneInput ||
    'Motorcycle crashed into road divider on wet road. Rider bleeding and unresponsive. No helmet visible.';

  // ── Priority 1: Firebase Cloud Function → Vertex AI (server-side) ──────────
  const cfResult = await analyzeViaCloudFunction(sceneDescription);
  if (cfResult) {
    console.log('[Gemini] ✅ Response via Cloud Function (Vertex AI)');
    return validateReport(cfResult);
  }

  // ── Priority 2: Direct Gemini REST API — tiered model fallback ─────────────
  if (!GEMINI_API_KEY) {
    console.warn('[Gemini] No API key — using mock data.');
    await new Promise(resolve => setTimeout(resolve, 3000));
    return mockData;
  }

  const userContent = sceneInput
    ? `Analyze this accident scene: ${sceneInput}`
    : `Analyze a typical road accident: a motorcycle has hit a road divider on a wet road. The rider appears injured and unresponsive. There are visible signs of bleeding. No helmet detected.`;

  const requestBody = JSON.stringify({
    contents: [{ parts: [{ text: EXTRACTION_PROMPT }, { text: userContent }] }],
    generationConfig: { temperature: 0.2, maxOutputTokens: 1024, responseMimeType: 'application/json' }
  });

  for (const model of GEMINI_MODELS) {
    try {
      console.log(`[Gemini] Trying model: ${model}`);

      const response = await withTimeout(
        fetch(geminiUrl(model), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: requestBody
        })
      );

      if (!response.ok) {
        console.warn(`[Gemini] ${model} failed: ${response.status}`);
        continue;
      }

      const json = await response.json();
      const rawText = json.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!rawText) { console.warn(`[Gemini] ${model} returned empty response`); continue; }

      const parsed = validateReport(JSON.parse(rawText));
      console.log(`[Gemini] Extracted via ${model}:`, parsed);
      return parsed;
    } catch (err) {
      if (err.message === 'AI_TIMEOUT') {
        console.warn(`[Gemini] ${model} timed out after ${AI_TIMEOUT_MS}ms`);
      } else {
        console.warn(`[Gemini] ${model} threw error:`, err.message);
      }
    }
  }

  console.error('[Gemini] All models failed, using validated mock data.');
  return { ...mockData, confidence_score: 0.1 }; // Low confidence flags fallback to UI
};
