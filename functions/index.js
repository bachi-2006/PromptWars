/**
 * Firebase Cloud Functions — RoadSense AI
 *
 * Services used:
 *  - Firebase Cloud Functions (serverless execution)
 *  - Vertex AI Gemini API (server-side, key never exposed to browser)
 *  - Firebase Cloud Messaging (emergency broadcast to responders)
 *  - Firebase Admin SDK (Firestore write from server)
 */

const { onRequest } = require('firebase-functions/v2/https');
const { onDocumentCreated } = require('firebase-functions/v2/firestore');
const { initializeApp } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const { getMessaging } = require('firebase-admin/messaging');
const { VertexAI } = require('@google-cloud/vertexai');

// Initialize Firebase Admin
initializeApp();
const db = getFirestore();

// ─── Vertex AI client ─────────────────────────────────────────────────────────
const vertexAI = new VertexAI({
  project: process.env.GCLOUD_PROJECT || 'prompt--wars',
  location: 'us-central1',
});

const generativeModel = vertexAI.getGenerativeModel({
  model: 'gemini-1.5-flash',
  generationConfig: { temperature: 0.2, maxOutputTokens: 1024 },
});

const EXTRACTION_PROMPT = `
You are an AI accident analysis assistant. Given a description of a road accident scene, extract structured details and return ONLY valid JSON (no markdown, no explanation):
{
  "location": "coordinates or description",
  "time": "ISO timestamp",
  "vehicles_count": <number>,
  "injuries_detected": "none|minor|severe|critical",
  "helmet_detected": <true|false>,
  "road_condition": "dry|wet|icy|damaged|unknown",
  "urgency_level": "LOW|MEDIUM|HIGH|CRITICAL",
  "confidence_score": <0.0-1.0>,
  "summary": "<one sentence, max 200 chars>",
  "vehicles": [{ "type": "", "color": "", "plate": "", "damage": "" }]
}
If unknown, use sensible defaults. ALWAYS return valid JSON.
`.trim();

// ─── 1. CLOUD FUNCTION: analyzeAccidentScene ─────────────────────────────────
// Server-side Gemini call via Vertex AI — API key is never exposed to browser.
// Called by the frontend as: POST https://<region>-prompt--wars.cloudfunctions.net/analyzeAccidentScene
exports.analyzeAccidentScene = onRequest(
  { cors: true, region: 'asia-south1', memory: '256MiB', timeoutSeconds: 30 },
  async (req, res) => {
    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method Not Allowed' });
    }

    const { sceneDescription } = req.body;

    if (!sceneDescription) {
      return res.status(400).json({ error: 'sceneDescription is required' });
    }

    console.log('[CF] analyzeAccidentScene called, scene:', sceneDescription.slice(0, 80));

    try {
      const prompt = `${EXTRACTION_PROMPT}\n\nScene: ${sceneDescription}`;
      const result = await generativeModel.generateContent(prompt);
      const rawText = result.response.candidates[0].content.parts[0].text;

      // Strip any markdown code fences if Gemini adds them
      const cleanJson = rawText.replace(/```json?\n?/g, '').replace(/```/g, '').trim();
      const parsed = JSON.parse(cleanJson);

      console.log('[CF] Vertex AI analysis complete. Urgency:', parsed.urgency_level);
      return res.status(200).json({ success: true, data: parsed });
    } catch (err) {
      console.error('[CF] Vertex AI error:', err.message);
      return res.status(500).json({ success: false, error: err.message });
    }
  }
);

// ─── 2. CLOUD FUNCTION: broadcastEmergencyAlert ──────────────────────────────
// Firestore trigger: fires whenever a new report is created in /reports/{id}
// Sends FCM push notification if urgency is HIGH or CRITICAL
exports.broadcastEmergencyAlert = onDocumentCreated(
  { document: 'reports/{reportId}', region: 'asia-south1' },
  async (event) => {
    const report = event.data.data();
    const reportId = event.params.reportId;

    if (!report) {
      console.log('[FCM] No report data, skipping.');
      return;
    }

    const urgency = report.urgency_level || 'LOW';
    console.log(`[FCM] New report ${reportId} | Urgency: ${urgency}`);

    // Only broadcast for HIGH or CRITICAL urgency
    if (!['HIGH', 'CRITICAL'].includes(urgency)) {
      console.log('[FCM] Urgency below threshold — no broadcast.');
      return;
    }

    const messaging = getMessaging();
    const location = report.location || 'Unknown location';
    const summary = report.summary?.slice(0, 100) || 'Accident scene reported.';

    const message = {
      topic: 'emergency-alerts',
      notification: {
        title: `🚨 ${urgency} URGENCY ACCIDENT ALERT`,
        body: `${summary} — ${location}`,
      },
      data: {
        reportId,
        urgency_level: urgency,
        location,
        timestamp: new Date().toISOString(),
      },
      android: {
        priority: 'high',
        notification: { channelId: 'emergency', sound: 'default' },
      },
      apns: {
        payload: { aps: { sound: 'default', badge: 1 } },
      },
    };

    try {
      const response = await messaging.send(message);
      console.log(`[FCM] Emergency alert sent. Message ID: ${response}`);

      // Log the broadcast in Firestore for audit trail
      await db.collection('fcm_broadcasts').add({
        reportId,
        urgency_level: urgency,
        message_id: response,
        sent_at: new Date().toISOString(),
        topic: 'emergency-alerts',
      });
    } catch (err) {
      console.error('[FCM] Failed to send alert:', err.message);
    }
  }
);

// ─── 3. CLOUD FUNCTION: getReportSummary ─────────────────────────────────────
// Simple GET endpoint to retrieve a report by ID (for sharing with responders)
exports.getReportSummary = onRequest(
  { cors: true, region: 'asia-south1' },
  async (req, res) => {
    const reportId = req.query.id;
    if (!reportId) return res.status(400).json({ error: 'Report ID required' });

    try {
      const doc = await db.collection('reports').doc(reportId).get();
      if (!doc.exists) return res.status(404).json({ error: 'Report not found' });

      const data = doc.data();
      // Return only public-safe fields
      return res.status(200).json({
        urgency_level: data.urgency_level,
        summary: data.summary,
        location: data.location,
        time: data.time,
        confidence_score: data.confidence_score,
      });
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }
);
