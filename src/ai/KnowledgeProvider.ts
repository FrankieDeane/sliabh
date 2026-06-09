/**
 * Fully offline AI provider — searches the bundled knowledge pack and
 * Argentina trails data to answer hiker questions without any network.
 * Used as the final fallback when Ollama and the cloud function are unreachable.
 */
import type { AIMessage, AIProvider, AIResponse } from './AIService';
import { ARGENTINA_TRAILS } from '../data/argentinaTrails';

interface KnowledgeItem {
  keywords: string[];
  answer_es: string;
  answer_en: string;
}

// ── Built-in FAQ knowledge ────────────────────────────────────────────────────
const FAQ: KnowledgeItem[] = [
  {
    keywords: ['agua', 'water', 'tomar', 'drink', 'potable', 'fuente', 'source'],
    answer_es:
      'En la mayoría de senderos patagónicos el agua de arroyos y glaciares es segura si se filtra o hierve. Lleva siempre un filtro tipo Sawyer o tabletas de purificación. En zonas de alta montaña (Aconcagua, Lanín) usa nieve derretida y trata el agua antes de beberla.',
    answer_en:
      'On most Patagonian trails, water from streams and glaciers is safe if filtered or boiled. Always carry a Sawyer filter or purification tablets. In high-altitude zones (Aconcagua, Lanín) melt snow and treat before drinking.',
  },
  {
    keywords: ['hipotermia', 'hypothermia', 'frio', 'cold', 'temperatura', 'temperature'],
    answer_es:
      'Para evitar hipotermia: viste en capas (base técnica, forro polar, cortavientos impermeable), mantén la ropa seca, come y bebe regularmente para mantener el calor corporal. Si alguien tiembla sin control, sácale la ropa húmeda, abrigarlo y busca evacuación.',
    answer_en:
      'To avoid hypothermia: layer clothing (technical base, fleece, waterproof shell), keep dry, eat and drink regularly to maintain body heat. If someone shivers uncontrollably, remove wet clothing, warm them up and seek evacuation.',
  },
  {
    keywords: ['equipo', 'gear', 'llevar', 'bring', 'pack', 'mochila', 'backpack', 'lista', 'list'],
    answer_es:
      'Equipo esencial para trekking en Patagonia: botas impermeables con buen agarre, mapa + brújula (no solo GPS), capas de abrigo, impermeable, sleeping bag (según temporada), tienda, botiquín, comida para 1 día extra, agua + filtro, linterna, encendedor y silbato.',
    answer_en:
      'Essential gear for Patagonia trekking: waterproof boots with good grip, map + compass (not just GPS), warm layers, rain jacket, sleeping bag (season-appropriate), tent, first aid kit, 1 extra day of food, water + filter, headlamp, lighter and whistle.',
  },
  {
    keywords: ['permiso', 'permit', 'reserva', 'booking', 'entrada', 'entry', 'fee'],
    answer_es:
      'Los parques nacionales de Argentina como Aconcagua, Los Glaciares y Lanín requieren permiso previo. Compra el permiso en el sitio oficial del parque o en la oficina provincial antes de salir. Torres del Paine (Chile) exige reserva de camping con meses de anticipación.',
    answer_en:
      'Argentine national parks like Aconcagua, Los Glaciares and Lanín require a prior permit. Purchase it on the official park website or provincial office before departing. Torres del Paine (Chile) requires campsite bookings months in advance.',
  },
  {
    keywords: ['época', 'season', 'temporada', 'cuando', 'when', 'mejor', 'best', 'mes', 'month'],
    answer_es:
      'La mejor época para Patagonia es noviembre a marzo (verano austral). Para Bariloche y Mendoza, diciembre a marzo. Para la Quebrada de Humahuaca y el NOA, abril a octubre (época seca). El Aconcagua se intenta diciembre a febrero.',
    answer_en:
      'Best time for Patagonia is November to March (southern summer). For Bariloche and Mendoza, December to March. For Quebrada de Humahuaca and NOA, April to October (dry season). Aconcagua attempts are December to February.',
  },
  {
    keywords: ['seguridad', 'safety', 'emergencia', 'emergency', 'rescate', 'rescue', 'peligro', 'danger'],
    answer_es:
      'Antes de salir registra tu ruta en el guardaparques más cercano. Lleva comunicador satelital (SPOT o Garmin inReach) en zonas sin cobertura. El número de emergencias en Argentina es 911. En Chile el CONAF coordina rescates en parques nacionales.',
    answer_en:
      'Before departing, register your route with the nearest ranger station. Carry a satellite communicator (SPOT or Garmin inReach) in areas without cell coverage. Emergency number in Argentina is 911. In Chile, CONAF coordinates national park rescues.',
  },
  {
    keywords: ['aclimatacion', 'acclimation', 'altitude', 'altitud', 'soroche', 'altitude sickness', 'mal de altura'],
    answer_es:
      'Para aclimatarte en alta montaña: sube despacio (no más de 300–400 m de ganancia de altitud por día sobre 3000 m), duerme bajo, hidrátate mucho y no ignores síntomas como dolor de cabeza persistente, náuseas o confusión — baja de inmediato.',
    answer_en:
      'To acclimatize at altitude: ascend slowly (no more than 300–400 m altitude gain per day above 3000 m), sleep low, stay hydrated and never ignore symptoms like persistent headache, nausea or confusion — descend immediately.',
  },
  {
    keywords: ['refugio', 'hut', 'shelter', 'dormir', 'sleep', 'camping', 'camp', 'alojamiento'],
    answer_es:
      'En Torres del Paine los refugios CONAF/VERTICE se reservan online con meses de antelación. En Bariloche (Frey, López) los refugios del Club Andino aceptan reservas online. Fuera de temporada muchos cierran — verifica antes de salir.',
    answer_en:
      'In Torres del Paine, CONAF/VERTICE huts must be booked online months in advance. In Bariloche (Frey, López), Club Andino huts accept online reservations. Many close outside peak season — verify before departing.',
  },
  {
    keywords: ['clima', 'weather', 'viento', 'wind', 'lluvia', 'rain', 'nieve', 'snow'],
    answer_es:
      'El clima patagónico cambia en minutos. El viento en Torres del Paine puede superar los 100 km/h. Revisa siempre el pronóstico local (windy.com o meteochile.cl para Chile; SMN para Argentina) y lleva impermeable y segunda capa aunque salga sol.',
    answer_en:
      'Patagonian weather changes in minutes. Winds in Torres del Paine can exceed 100 km/h. Always check the local forecast (windy.com or meteochile.cl for Chile; SMN for Argentina) and bring rain gear and extra layers even on sunny days.',
  },
];

// ── Trail lookup helpers ──────────────────────────────────────────────────────
function searchTrails(query: string): string {
  const q = query.toLowerCase();
  const matches = ARGENTINA_TRAILS.filter(
    (t) =>
      t.name.toLowerCase().includes(q) ||
      t.area.toLowerCase().includes(q) ||
      t.province.toLowerCase().includes(q) ||
      (t.subarea ?? '').toLowerCase().includes(q) ||
      t.tags.some((tag) => q.includes(tag.toLowerCase())) ||
      t.description.toLowerCase().split(' ').some((word) => q.includes(word) && word.length > 4),
  ).slice(0, 3);

  if (matches.length === 0) return '';

  return matches
    .map(
      (t) =>
        `• **${t.name}** (${t.province}) — ${t.distance_km} km, ${t.elevation_gain_m} m desnivel, dificultad ${t.difficulty}. Mejor época: ${t.best_season}. ${t.description}`,
    )
    .join('\n');
}

function matchFAQ(query: string, lang: 'es' | 'en'): string | null {
  const q = query.toLowerCase();
  for (const item of FAQ) {
    if (item.keywords.some((kw) => q.includes(kw))) {
      return lang === 'en' ? item.answer_en : item.answer_es;
    }
  }
  return null;
}

function detectLang(messages: AIMessage[]): 'es' | 'en' {
  const userText = messages
    .filter((m) => m.role === 'user')
    .map((m) => m.content)
    .join(' ')
    .toLowerCase();
  // Simple heuristic: if common English words appear more than Spanish ones
  const enWords = ['what', 'how', 'where', 'when', 'why', 'can', 'the', 'is', 'are', 'do', 'i', 'trail'];
  const esWords = ['qué', 'cómo', 'dónde', 'cuándo', 'puedo', 'hay', 'el', 'la', 'es', 'son', 'ruta'];
  const enCount = enWords.filter((w) => userText.includes(w)).length;
  const esCount = esWords.filter((w) => userText.includes(w)).length;
  return enCount > esCount ? 'en' : 'es';
}

// ── Provider ──────────────────────────────────────────────────────────────────
export class KnowledgeProvider implements AIProvider {
  async generate(
    messages: AIMessage[],
    onToken?: (chunk: string, done: boolean) => void,
  ): Promise<AIResponse> {
    const lastUser = [...messages].reverse().find((m) => m.role === 'user');
    const query = lastUser?.content ?? '';
    const lang = detectLang(messages);

    // 1. Try FAQ match
    const faqAnswer = matchFAQ(query, lang);

    // 2. Try trail match
    const trailAnswer = searchTrails(query);

    let text = '';

    if (faqAnswer && trailAnswer) {
      text = faqAnswer + '\n\n' + (lang === 'en' ? '**Related trails:**' : '**Rutas relacionadas:**') + '\n' + trailAnswer;
    } else if (faqAnswer) {
      text = faqAnswer;
    } else if (trailAnswer) {
      text =
        (lang === 'en'
          ? 'Here are the most relevant trails I found:\n\n'
          : 'Aquí están las rutas más relevantes que encontré:\n\n') + trailAnswer;
    } else {
      text =
        lang === 'en'
          ? 'I\'m running in offline mode and couldn\'t find a specific answer for that question in my local knowledge base. For detailed route information, check the **Rutas** section. For safety emergencies call **911** (Argentina) or **130** (Chile CONAF).'
          : 'Estoy en modo sin conexión y no encontré una respuesta específica para esa pregunta en mi base de conocimiento local. Para información detallada de rutas, revisa la sección **Rutas**. En emergencias de seguridad llama al **911** (Argentina) o **130** (CONAF Chile).';
    }

    // Append offline notice
    const notice =
      lang === 'en'
        ? '\n\n_⚡ Offline mode — responses come from the bundled knowledge base._'
        : '\n\n_⚡ Modo sin conexión — respuestas del paquete de conocimiento incluido._';
    text += notice;

    onToken?.(text, true);
    return { text };
  }

  async isAvailable(): Promise<boolean> {
    return true; // Always available — no network needed
  }
}
