/**
 * urgencyEngine.js
 * Hybrid urgency classification engine.
 * Combines rule-based overrides with AI signal for maximum reliability.
 *
 * Priority order:
 *  1. Fire / explosion keywords → CRITICAL (override everything)
 *  2. Multi-vehicle collisions + injuries → CRITICAL
 *  3. Bleeding / unconscious / unresponsive → HIGH
 *  4. Child or elderly involved → HIGH
 *  5. Severe AI signal + confirmed injury → HIGH
 *  6. Minor injury confirmed → MEDIUM
 *  7. No injuries + low vehicle count → LOW
 *  8. Fallback to AI signal
 */

const keywords = {
  CRITICAL: ['fire', 'explosion', 'trapped', 'pinned', 'fuel leak', 'petrol leaking', 'on fire', 'burning'],
  HIGH: ['bleeding', 'unconscious', 'unresponsive', 'not moving', 'head injury', 'neck injury', 'child', 'infant', 'elderly', 'motionless'],
  MEDIUM: ['limping', 'minor cut', 'bruise', 'walking', 'conscious', 'alert'],
};

/**
 * Checks whether a summary contains any keyword from a given list.
 */
const matchesKeyword = (summary = '', list = []) =>
  list.some(word => summary.toLowerCase().includes(word));

/**
 * Calculates urgency from AI output using rule-based overrides.
 * Always returns a valid urgency level — never undefined.
 *
 * @param {Object} aiOutput - Validated report object from gemini.js
 * @returns {'LOW'|'MEDIUM'|'HIGH'|'CRITICAL'}
 */
export const calculateUrgency = (aiOutput = {}) => {
  // Absolute null/undefined guard — never crash
  if (!aiOutput || typeof aiOutput !== 'object') return 'MEDIUM';

  const summary = typeof aiOutput.summary === 'string' ? aiOutput.summary : '';
  const injuries = aiOutput.injuries_detected || 'unknown';
  const vehicleCount = typeof aiOutput.vehicles_count === 'number' ? aiOutput.vehicles_count : 0;
  const aiUrgency = aiOutput.urgency_level;

  // Rule 1: Fire, explosion, or fuel leak — always CRITICAL
  if (matchesKeyword(summary, keywords.CRITICAL)) {
    return 'CRITICAL';
  }

  // Rule 2: Multi-vehicle with severe injuries → CRITICAL
  if (vehicleCount >= 3 && (injuries === 'critical' || matchesKeyword(summary, keywords.HIGH))) {
    return 'CRITICAL';
  }

  // Rule 3: Bleeding, unconscious, child, or elderly → HIGH
  if (
    injuries === 'severe' ||
    injuries === 'critical' ||
    matchesKeyword(summary, keywords.HIGH)
  ) {
    return 'HIGH';
  }

  // Rule 4: AI says HIGH + any injury detected → keep HIGH
  if (aiUrgency === 'HIGH' && injuries !== 'none') {
    return 'HIGH';
  }

  // Rule 5: Confirmed minor injury → MEDIUM
  if (injuries === 'minor' || matchesKeyword(summary, keywords.MEDIUM)) {
    return 'MEDIUM';
  }

  // Rule 6: No injuries confirmed → LOW
  if (injuries === 'none') {
    return 'LOW';
  }

  // Fallback: trust AI signal, default to MEDIUM if missing
  const VALID = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];
  return VALID.includes(aiUrgency) ? aiUrgency : 'MEDIUM';
};

/**
 * Gets a human-readable urgency description for display in the UI.
 * @param {'LOW'|'MEDIUM'|'HIGH'|'CRITICAL'} level
 * @returns {{ label: string, color: string, description: string }}
 */
export const getUrgencyMeta = (level) => {
  const map = {
    CRITICAL: {
      label: 'CRITICAL',
      color: '#FF0000',
      description: 'Life-threatening situation. Call 108 immediately.',
    },
    HIGH: {
      label: 'HIGH',
      color: 'var(--accent-red)',
      description: 'Serious injuries detected. Emergency services required.',
    },
    MEDIUM: {
      label: 'MEDIUM',
      color: 'var(--accent-yellow)',
      description: 'Minor injuries present. Medical attention recommended.',
    },
    LOW: {
      label: 'LOW',
      color: 'var(--accent-cyan)',
      description: 'No serious injuries. Report filed for documentation.',
    },
  };
  return map[level] ?? map['MEDIUM'];
};
