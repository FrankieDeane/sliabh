// Auditoría rápida de títulos, meta descriptions y volumen de texto de todas
// las URLs del sitemap (rutas, regiones, parques y páginas principales, en
// es/en), sin hacer el build: usa los mismos builders que las pantallas y los
// scripts de prerender (trailSeo, hubSeo, coreSeo).
//
// Uso: node scripts/audit-seo.mjs          → resumen
//      node scripts/audit-seo.mjs --list   → además, cada URL fuera de rango
import { loadTs } from './lib/load-ts.mjs';

const TITLE = [30, 60];
const DESC = [120, 160];

const { ALL_HUB_TRAILS, REGIONS, PARKS } = loadTs('src/data/hubs.ts');
const { trailSeo } = loadTs('src/utils/trailSeo.ts');
const { hubSeo } = loadTs('src/utils/hubSeo.ts');
const { CORE_ROUTES, coreSeo } = loadTs('src/data/coreSeo.ts');

const words = (s) => String(s || '').split(/\s+/).filter(Boolean).length;
const rows = [];

for (const t of ALL_HUB_TRAILS) {
  for (const lang of ['es', 'en']) {
    const s = trailSeo(t, lang);
    const en = lang === 'en';
    const text = [en ? t.description_en ?? t.description : t.description, en ? t.long_description_en : t.long_description, ...s.faqs.map((f) => `${f.q} ${f.a}`)].join(' ');
    rows.push({ kind: 'ruta', path: s.path, title: s.title, desc: s.description, words: words(text) });
  }
}
for (const [kind, list] of [['region', REGIONS], ['park', PARKS]]) {
  for (const x of list) {
    for (const lang of ['es', 'en']) {
      const s = hubSeo(kind, x.slug, lang);
      if (!s) continue;
      const text = [s.intro, ...s.trails.map((t) => t.name), ...s.faqs.map((f) => `${f.q} ${f.a}`)].join(' ');
      rows.push({ kind, path: s.path, title: s.title, desc: s.description, words: words(text) });
    }
  }
}
for (const r of CORE_ROUTES) {
  for (const lang of ['es', 'en']) {
    const s = coreSeo(r, lang);
    rows.push({ kind: 'core', path: s.path, title: s.title, desc: s.description, words: null });
  }
}

const out = (v, [min, max]) => v < min || v > max;
const badTitle = rows.filter((r) => out(r.title.length, TITLE));
const badDesc = rows.filter((r) => out(r.desc.length, DESC));
const thin = rows.filter((r) => r.words !== null && r.words < 300);
const dup = (key) => Object.entries(rows.reduce((a, r) => ((a[r[key]] = (a[r[key]] || 0) + 1), a), {})).filter(([, n]) => n > 1);

const pct = (n) => `${n}/${rows.length} (${Math.round((n / rows.length) * 100)}%)`;
console.log(`URLs auditadas: ${rows.length}`);
console.log(`Título fuera de ${TITLE.join('–')}:        ${pct(badTitle.length)}`);
console.log(`Descripción fuera de ${DESC.join('–')}:  ${pct(badDesc.length)}`);
console.log(`Texto < 300 palabras (sin JS): ${pct(thin.length)}`);
console.log(`Títulos duplicados: ${dup('title').length} · descripciones duplicadas: ${dup('desc').length}`);
console.log(`Rutas sin descripción larga: es ${ALL_HUB_TRAILS.filter((t) => !t.long_description).length} · en ${ALL_HUB_TRAILS.filter((t) => !t.long_description_en).length} (de ${ALL_HUB_TRAILS.length})`);

if (process.argv.includes('--list')) {
  for (const r of badTitle) console.log(`  título ${r.title.length}  ${r.path}  ${r.title}`);
  for (const r of badDesc) console.log(`  desc   ${r.desc.length}  ${r.path}  ${r.desc}`);
}
