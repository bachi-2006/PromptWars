/**
 * gemini.edge.test.js
 * Edge-case and integration tests for the RoadSense AI Gemini service.
 * Run with: npx vitest run tests/gemini.edge.test.js
 */

import { describe, test, expect, vi, beforeEach } from 'vitest';
import { extractAccidentDetails, validateReport } from '../src/services/gemini';

// ---------------------------------------------------------------------------
// UNIT: validateReport() — Schema Enforcement
// ---------------------------------------------------------------------------
describe('validateReport() — Schema Enforcement', () => {
  test('fills all missing fields with safe defaults', () => {
    const result = validateReport({});
    expect(result.location).toBe('unavailable');
    expect(result.time).toBeDefined();
    expect(result.vehicles_count).toBe(0);
    expect(result.injuries_detected).toBe('unknown');
    expect(result.helmet_detected).toBe(false);
    expect(result.road_condition).toBe('unknown');
    expect(result.urgency_level).toBe('LOW');
    expect(result.confidence_score).toBe(0.5);
    expect(result.summary).toBeTruthy();
    expect(Array.isArray(result.vehicles)).toBe(true);
  });

  test('rejects invalid urgency_level and defaults to LOW', () => {
    const result = validateReport({ urgency_level: 'EXTREME' });
    expect(result.urgency_level).toBe('LOW');
  });

  test('clamps confidence_score to 0.0–1.0 range', () => {
    expect(validateReport({ confidence_score: 1.5 }).confidence_score).toBe(1);
    expect(validateReport({ confidence_score: -0.5 }).confidence_score).toBe(0);
    expect(validateReport({ confidence_score: 0.7 }).confidence_score).toBe(0.7);
  });

  test('truncates summary to 200 characters', () => {
    const longSummary = 'A'.repeat(300);
    const result = validateReport({ summary: longSummary });
    expect(result.summary.length).toBeLessThanOrEqual(200);
  });

  test('rejects invalid injuries_detected and defaults to unknown', () => {
    const result = validateReport({ injuries_detected: 'extreme' });
    expect(result.injuries_detected).toBe('unknown');
  });

  test('preserves valid data without modification', () => {
    const input = {
      location: '17.4583, 78.3728',
      vehicles_count: 3,
      injuries_detected: 'critical',
      urgency_level: 'CRITICAL',
      confidence_score: 0.95,
      summary: 'Multi-vehicle crash on highway.',
      helmet_detected: true,
      road_condition: 'wet',
      vehicles: [{ type: 'Car', color: 'Blue', plate: 'AP01AB1234', damage: 'Front' }]
    };
    const result = validateReport(input);
    expect(result.urgency_level).toBe('CRITICAL');
    expect(result.confidence_score).toBe(0.95);
    expect(result.vehicles).toHaveLength(1);
  });
});

// ---------------------------------------------------------------------------
// EDGE: extractAccidentDetails() — Input Variations
// ---------------------------------------------------------------------------
describe('extractAccidentDetails() — Edge Cases', () => {
  beforeEach(() => {
    // Reset fetch to avoid flaky network calls in unit tests
    vi.stubGlobal('fetch', vi.fn());
  });

  test('empty string input still returns a valid report', async () => {
    const result = await extractAccidentDetails('');
    expect(result).toBeDefined();
    expect(result.urgency_level).toMatch(/^(LOW|MEDIUM|HIGH|CRITICAL)$/);
    expect(result.summary).toBeTruthy();
  });

  test('null/undefined input (no scene) still returns valid report', async () => {
    const result = await extractAccidentDetails(null);
    expect(result).toBeDefined();
    expect(result.confidence_score).toBeGreaterThanOrEqual(0);
    expect(result.confidence_score).toBeLessThanOrEqual(1);
  });

  test('all models return 429 → falls back to validated mock data', async () => {
    fetch.mockResolvedValue({ ok: false, status: 429, statusText: 'Too Many Requests' });
    const result = await extractAccidentDetails('Test scene');
    expect(result).toBeDefined();
    expect(result.urgency_level).toBeTruthy();
    expect(result.confidence_score).toBe(0.1); // Fallback flags low confidence
  });

  test('API returns malformed JSON → catches parse error, returns mock', async () => {
    fetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        candidates: [{ content: { parts: [{ text: 'NOT JSON AT ALL' }] } }]
      })
    });
    const result = await extractAccidentDetails('Blurred photo');
    expect(result).toBeDefined();
    expect(result.summary).toBeTruthy();
  });

  test('API returns empty candidates → skips model, uses mock', async () => {
    fetch.mockResolvedValue({
      ok: true,
      json: async () => ({ candidates: [] })
    });
    const result = await extractAccidentDetails('Partial input');
    expect(result).toBeDefined();
  });
});

// ---------------------------------------------------------------------------
// RELIABILITY: Offline / Failure Modes
// ---------------------------------------------------------------------------
describe('Reliability — Network Failures', () => {
  test('network error (fetch throws) → still returns usable report', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('Network Error')));
    const result = await extractAccidentDetails('voice only');
    expect(result).toBeDefined();
    expect(result.urgency_level).toBeTruthy();
  });
});
