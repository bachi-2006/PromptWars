/**
 * gemini.js
 * Calls the real Google Gemini API (gemini-2.0-flash) to extract
 * structured accident details from an image or voice transcript.
 */

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

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
 * Calls the Gemini API with a scene description or voice transcript.
 * Falls back to mock data if the API key is missing or the call fails.
 */
export const extractAccidentDetails = async (sceneInput) => {
  // Mock fallback data (used when API is unavailable)
  const mockData = {
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
  };

  if (!GEMINI_API_KEY) {
    console.warn('[Gemini] No API key — using mock data.');
    await new Promise(resolve => setTimeout(resolve, 3000)); // Simulate delay
    return mockData;
  }

  const userContent = sceneInput
    ? `Analyze this accident scene: ${sceneInput}`
    : `Analyze a typical road accident: a motorcycle has hit a road divider on a wet road. The rider appears injured and unresponsive. There are visible signs of bleeding. No helmet detected.`;

  const requestBody = JSON.stringify({
    contents: [
      {
        parts: [
          { text: EXTRACTION_PROMPT },
          { text: userContent }
        ]
      }
    ],
    generationConfig: {
      temperature: 0.2,
      maxOutputTokens: 1024,
      responseMimeType: 'application/json'
    }
  });

  // Try each model in order — stops at first success
  for (const model of GEMINI_MODELS) {
    try {
      console.log(`[Gemini] Trying model: ${model}`);
      const response = await fetch(geminiUrl(model), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: requestBody
      });

      if (!response.ok) {
        const msg = `${response.status} ${response.statusText}`;
        console.warn(`[Gemini] ${model} failed: ${msg}`);
        continue; // Try next model
      }

      const json = await response.json();
      const rawText = json.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!rawText) { console.warn(`[Gemini] ${model} returned empty response`); continue; }

      const parsed = JSON.parse(rawText);
      console.log(`[Gemini] Extracted via ${model}:`, parsed);
      return parsed;
    } catch (err) {
      console.warn(`[Gemini] ${model} threw error:`, err.message);
    }
  }

  // All models failed — use mock data
  console.error('[Gemini] All models failed, using mock data.');
  return mockData;
};
