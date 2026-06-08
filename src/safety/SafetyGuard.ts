export type SafetyVerdict = 'allow' | 'block' | 'warn';

export interface SafetyResult {
  verdict: SafetyVerdict;
  reason?: string;
  warningText?: string;
}

const BLOCK_PATTERNS: Array<{ pattern: RegExp; reason: string }> = [
  { pattern: /rescue|mayday|sos|emergency call|call for help/i, reason: 'emergency_redirect' },
  { pattern: /diagnos|symptom|treat (my|the) (wound|blister|hypotherm)/i, reason: 'medical' },
  { pattern: /where (is|are) .*(they|he|she|my)/i, reason: 'third_party_location' },
  { pattern: /current (weather|conditions|temp)/i, reason: 'realtime_conditions' },
];

const WARN_PATTERNS: Array<{ pattern: RegExp; warningText: string }> = [
  {
    pattern: /water|drink|stream|river/i,
    warningText: 'Always treat water before drinking.',
  },
  {
    pattern: /weather|wind|rain|storm/i,
    warningText: 'Patagonian weather changes rapidly — check CONAF and local services before departure.',
  },
  {
    pattern: /route|trail|path|cross/i,
    warningText: 'Conditions vary — verify locally before departure.',
  },
];

const EMERGENCY_MESSAGE =
  'For emergencies contact CONAF: +56 61 2691931 or local rescue services immediately. This app cannot coordinate rescues.';

export function checkInput(query: string): SafetyResult {
  for (const { pattern, reason } of BLOCK_PATTERNS) {
    if (pattern.test(query)) {
      if (reason === 'emergency_redirect') {
        return { verdict: 'block', reason, warningText: EMERGENCY_MESSAGE };
      }
      return {
        verdict: 'block',
        reason,
        warningText: reason === 'medical'
          ? 'I cannot provide medical advice. Seek professional medical help.'
          : 'I cannot answer that query.',
      };
    }
  }

  for (const { pattern, warningText } of WARN_PATTERNS) {
    if (pattern.test(query)) {
      return { verdict: 'warn', warningText };
    }
  }

  return { verdict: 'allow' };
}

export function checkOutput(response: string): string {
  // Strip any accidental real-time condition assertions
  return response.replace(
    /\b(currently|right now|at this moment|as of today)\b/gi,
    'historically',
  );
}
