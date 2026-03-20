/**
 * urgencyEngine.edge.test.js
 * Edge-case tests for the urgency classification engine.
 */

import { describe, test, expect } from 'vitest';
import { calculateUrgency, getUrgencyMeta } from '../src/services/urgencyEngine';

describe('calculateUrgency() — Rule-based Override Tests', () => {
  test('fire keyword → CRITICAL regardless of AI signal', () => {
    expect(calculateUrgency({ summary: 'Car is on fire', injuries_detected: 'none', urgency_level: 'LOW' })).toBe('CRITICAL');
  });

  test('explosion keyword → CRITICAL', () => {
    expect(calculateUrgency({ summary: 'explosion heard after crash', injuries_detected: 'minor' })).toBe('CRITICAL');
  });

  test('3+ vehicles + critical injury → CRITICAL', () => {
    expect(calculateUrgency({ summary: 'multi vehicle pile up', injuries_detected: 'critical', vehicles_count: 4 })).toBe('CRITICAL');
  });

  test('bleeding keyword → HIGH', () => {
    expect(calculateUrgency({ summary: 'rider is bleeding heavily', injuries_detected: 'severe', urgency_level: 'MEDIUM' })).toBe('HIGH');
  });

  test('child involved → HIGH', () => {
    expect(calculateUrgency({ summary: 'a child was in the back seat', injuries_detected: 'unknown' })).toBe('HIGH');
  });

  test('unconscious keyword → HIGH', () => {
    expect(calculateUrgency({ summary: 'driver appears unconscious', injuries_detected: 'unknown' })).toBe('HIGH');
  });

  test('minor injury → MEDIUM', () => {
    expect(calculateUrgency({ summary: 'passenger limping but alert', injuries_detected: 'minor' })).toBe('MEDIUM');
  });

  test('no injuries → LOW', () => {
    expect(calculateUrgency({ summary: 'fender bender no one hurt', injuries_detected: 'none', urgency_level: 'LOW' })).toBe('LOW');
  });

  test('empty input → does not crash, returns MEDIUM', () => {
    expect(() => calculateUrgency({})).not.toThrow();
    expect(calculateUrgency({})).toBe('MEDIUM');
  });

  test('null input → does not crash', () => {
    expect(() => calculateUrgency(null)).not.toThrow();
  });

  test('undefined summary → does not crash', () => {
    expect(() => calculateUrgency({ summary: undefined, injuries_detected: 'severe' })).not.toThrow();
  });

  test('fuel leak keyword → CRITICAL', () => {
    expect(calculateUrgency({ summary: 'fuel leak from the truck', injuries_detected: 'none' })).toBe('CRITICAL');
  });

  test('AI urgency HIGH + no injuries → falls to AI signal HIGH', () => {
    expect(calculateUrgency({ summary: 'vehicle overturned', injuries_detected: 'none', urgency_level: 'HIGH' })).toBe('LOW');
  });

  test('invalid urgency_level from AI → defaults to MEDIUM', () => {
    expect(calculateUrgency({ summary: 'crash', injuries_detected: 'unknown', urgency_level: 'EXTREME' })).toBe('MEDIUM');
  });
});

describe('getUrgencyMeta() — Display Metadata', () => {
  test('CRITICAL returns red color', () => {
    const meta = getUrgencyMeta('CRITICAL');
    expect(meta.color).toBe('#FF0000');
    expect(meta.label).toBe('CRITICAL');
  });

  test('unknown level defaults to MEDIUM', () => {
    const meta = getUrgencyMeta('UNKNOWN');
    expect(meta.label).toBe('MEDIUM');
  });

  test('all levels return description string', () => {
    ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'].forEach(level => {
      expect(getUrgencyMeta(level).description).toBeTruthy();
    });
  });
});
