/**
 * Urgency Engine - Hybrid Logic
 * AI signals + Rule-based overrides to determine priority level.
 */

export const calculateUrgency = (aiOutput) => {
  const { injuries_detected, summary } = aiOutput;
  const lowercaseSummary = summary.toLowerCase();

  // Rule 1: Fire or Explosion (CRITICAL)
  if (lowercaseSummary.includes('fire') || lowercaseSummary.includes('explosion')) {
    return 'CRITICAL';
  }

  // Rule 2: Bleeding or Unconscious (HIGH)
  if (
    injuries_detected === 'severe' || 
    lowercaseSummary.includes('bleeding') || 
    lowercaseSummary.includes('unconscious') ||
    lowercaseSummary.includes('unresponsive')
  ) {
    return 'HIGH';
  }

  // Rule 3: No injuries detected (LOW)
  if (injuries_detected === 'none' && !aiOutput.urgency_level) {
    return 'LOW';
  }

  // Fallback to AI signal if no rules matched
  return aiOutput.urgency_level || 'MEDIUM';
};
