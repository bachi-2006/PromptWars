/**
 * cloudFunctionService.js
 * Calls the Firebase Cloud Function (analyzeAccidentScene) server-side.
 * Falls back to client-side Gemini if the Cloud Function is unavailable.
 */

// The deployed Cloud Function URL — set via env or falls back gracefully
const CF_BASE_URL = import.meta.env.VITE_CLOUD_FUNCTION_URL ||
  'https://asia-south1-prompt--wars.cloudfunctions.net';

/**
 * Calls the server-side analyzeAccidentScene Cloud Function (Vertex AI).
 * @param {string} sceneDescription
 * @returns {Promise<Object>} validated report data or null on failure
 */
export const analyzeViaCloudFunction = async (sceneDescription) => {
  try {
    console.log('[CloudFn] Calling analyzeAccidentScene via Cloud Function...');

    const response = await fetch(`${CF_BASE_URL}/analyzeAccidentScene`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sceneDescription }),
    });

    if (!response.ok) {
      console.warn(`[CloudFn] Cloud Function returned ${response.status}`);
      return null;
    }

    const json = await response.json();
    if (json.success && json.data) {
      console.log('[CloudFn] ✅ Vertex AI analysis received via Cloud Function');
      return json.data;
    }

    return null;
  } catch (err) {
    console.warn('[CloudFn] Could not reach Cloud Function:', err.message);
    return null;
  }
};

/**
 * Fetches a shared report summary via the getReportSummary Cloud Function.
 * @param {string} reportId
 */
export const fetchReportSummary = async (reportId) => {
  try {
    const response = await fetch(`${CF_BASE_URL}/getReportSummary?id=${reportId}`);
    if (!response.ok) return null;
    return await response.json();
  } catch {
    return null;
  }
};
