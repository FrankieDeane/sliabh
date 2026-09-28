/**
 * Ajuste de títulos y meta descriptions a lo que Google muestra sin cortar
 * (~60 caracteres de título, ~160 de descripción). Plain TS, sin React
 * Native: lo usan tanto las pantallas (SeoHead) como los scripts de
 * prerender (scripts/lib/load-ts.mjs).
 */
export const TITLE_MAX = 60;
export const DESC_MAX = 160;

/** Primer candidato que entra en el máximo; si ninguno entra, el más corto. */
export function fitTitle(candidates: string[], max = TITLE_MAX): string {
  const clean = candidates.map((c) => c.replace(/\s+/g, ' ').trim()).filter(Boolean);
  return clean.find((c) => c.length <= max) ?? clean.reduce((a, b) => (b.length < a.length ? b : a));
}

/** Recorta en el último espacio antes de `max` y agrega "…". */
export function clip(text: string, max: number): string {
  const clean = text.replace(/\s+/g, ' ').trim();
  if (clean.length <= max) return clean;
  let cut = clean.slice(0, max - 1).replace(/[\s,;:.—–-]+\S*$/, '');
  // No dejar un paréntesis abierto: "(6961…" → se corta antes del "(".
  const open = cut.lastIndexOf('(');
  if (open > cut.lastIndexOf(')')) cut = cut.slice(0, open).replace(/[\s,;:—–-]+$/, '');
  return cut + '…';
}

/**
 * Arma la descripción: `head` (los datos duros) + `tail` (el llamado a la
 * acción) siempre; `middle` (una frase de la ruta/hub) solo si queda lugar
 * para al menos `minMiddle` caracteres, recortada si hace falta.
 * `heads` y `tails` van del más completo al más corto: primero se busca una
 * combinación que deje lugar para `middle`; si no hay, la más larga que entre
 * (así las rutas con nombre corto no quedan por debajo de ~120 caracteres).
 */
export function fitDescription(
  heads: string[],
  middle: string,
  tails: string | string[],
  { max = DESC_MAX, minMiddle = 45 } = {},
): string {
  const join = (...parts: string[]) => parts.map((p) => p.trim()).filter(Boolean).join(' ');
  const tailList = Array.isArray(tails) ? tails : [tails];
  const combos = heads.flatMap((head) => tailList.map((tail) => ({ head, tail, base: join(head, tail) })));
  const fitting = combos.filter((c) => c.base.length <= max);
  if (middle) {
    for (const c of fitting) {
      const room = max - c.base.length - 1;
      if (room >= minMiddle) return join(c.head, clip(middle, room), c.tail);
    }
  }
  if (fitting.length) return fitting[0].base;
  return clip(combos[combos.length - 1].base, max);
}
