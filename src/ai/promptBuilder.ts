import type { AIMessage } from './AIService';
import type { KnowledgePack } from '../knowledge/types';

const SYSTEM_PROMPT = `You are Sliabh, an offline trail information assistant for Patagonia hikers.

Your role:
- Provide accurate, practical trail information based on your loaded knowledge pack.
- Help hikers plan safe, well-prepared treks.

Hard rules:
- You are NOT a GPS navigator, rescue service, or emergency authority.
- Never assert real-time conditions as current fact.
- Never provide medical diagnosis or treatment.
- Always hedge weather and trail condition information: use "typically", "historically", "plan for".
- If asked about emergencies: always state "Contact CONAF: +56 61 2691931 or local rescue services immediately."
- Only answer questions about Patagonia hiking. Redirect anything else.

Disclaimer to include when discussing routes, water, or weather:
- Routes: "Conditions vary — verify locally before departure."
- Water: "Always treat water before drinking."
- Weather: "Patagonian weather changes rapidly — check CONAF and local services."`;

export function buildMessages(
  userQuery: string,
  history: Array<{ role: 'user' | 'assistant'; content: string }>,
  pack: KnowledgePack | null,
): AIMessage[] {
  const messages: AIMessage[] = [
    { role: 'system', content: buildSystemWithContext(pack) },
    ...history.slice(-6).map((m) => ({ role: m.role, content: m.content })),
    { role: 'user', content: userQuery },
  ];
  return messages;
}

function buildSystemWithContext(pack: KnowledgePack | null): string {
  if (!pack) return SYSTEM_PROMPT;

  const ctx = [
    `LOADED REGION: ${pack.meta.name}, ${pack.meta.country}`,
    pack.faqs.length > 0
      ? `FAQs:\n${pack.faqs.map((f) => `Q: ${f.q}\nA: ${f.a}`).join('\n\n')}`
      : '',
    pack.alerts.length > 0
      ? `ACTIVE ALERTS:\n${pack.alerts.map((a) => `[${a.severity.toUpperCase()}] ${a.area}: ${a.message}`).join('\n')}`
      : '',
    pack.routes.length > 0
      ? `ROUTES:\n${pack.routes.map((r) => `${r.name} — ${r.distance_km}km, ${r.difficulty}, ${r.duration_days.min}–${r.duration_days.max} days`).join('\n')}`
      : '',
  ]
    .filter(Boolean)
    .join('\n\n');

  return `${SYSTEM_PROMPT}\n\n--- KNOWLEDGE PACK ---\n${ctx}`;
}
