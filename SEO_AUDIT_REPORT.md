# Auditoría SEO — sliabh.com.ar

Fecha: 2026-09-28 · Stack: Expo Router (web SPA, `output: "single"`) + Netlify, con HTML prerenderizado por ruta (`scripts/prerender-*.mjs`).

## Metodología

El dominio no era accesible desde el entorno de la auditoría (bloqueado por la política de red), así que **no se rastreó producción**. En su lugar se reconstruyó, desde el código, el HTML que reciben los crawlers para **las 236 URLs del sitemap** (95 rutas, 7 regiones, 8 parques y 8 páginas principales, cada una en español e inglés): los tags salen de funciones deterministas (`trailSeo`, `hubSeo`, `coreSeo`) compartidas por las pantallas y los scripts de prerender. Lo que depende del servidor en vivo queda marcado como **Revisión manual requerida**.

## Score

| Categoría (peso) | Antes | Después (estimado) |
|---|---|---|
| Technical (30%) | 72 | 85 |
| On-Page (30%) | 52 | 80 |
| Content (20%) | 48 | 55 |
| Performance (20%) | ~50 | ~62 |
| **Total** | **58** | **73** |

Medido con `node scripts/audit-seo.mjs`: títulos y metas pasaron de 27% y 11% dentro de rango al 100%, sin duplicados. El resto del "después" es estimado: Content sube poco porque el contenido thin (descripciones largas faltantes) es trabajo editorial, no de código. Performance no se pudo medir con datos de campo.

## Resumen por categoría

### Technical Health
| Check | Estado | Detalle |
|---|---|---|
| HTTPS | Revisión manual requerida | Todas las URLs internas y canónicas usan https. |
| robots.txt | Pass | Permite buscadores y bots de IA, bloquea scrapers, declara el sitemap. |
| sitemap.xml | Pass | Se regenera en cada build; hreflang es/en e image sitemap. |
| Canonical | Pass | Uno por página; noindex en auth, 404 y recorridos privados. |
| hreflang | Pass | es / en / x-default recíprocos en `<head>` y sitemap. |
| Enlaces internos del menú | **Fail → corregido** | Header, menú móvil y footer eran botones (`router.push`), no `<a href>`: /rutas, /mapas, /faq, /supervivencia no recibían enlaces rastreables. |
| Redirect "/" → "/inicio" | Warning (P2) | Redirección en el cliente: la URL cambia y GA registra `/inicio`. |
| TTFB / cadenas de redirección | Revisión manual requerida | Sin acceso al dominio. |

### On-Page SEO
| Check | Antes | Después |
|---|---|---|
| Title 30–60 caracteres | 63 de 236 (27%) | **236 de 236 (100%)** |
| Meta description 120–160 | 26 de 236 (11%) | **236 de 236 (100%)** |
| Un solo H1 | Pass (rutas, hubs, core) | Pass |
| ≥2 H2 | Pass en rutas y hubs | Pass (+ H2 "Rutas cercanas") |
| Alt en imágenes | **Fail**: fotos de rutas y hero sin alt | Pass en tarjetas y hero de rutas |
| Títulos/metas duplicados | 0 | 0 |
| Concordancia de género | "dificultad extremo/moderado" en metas y FAQ | Corregido |

### Content Quality
| Check | Estado |
|---|---|
| Páginas con < 300 palabras sin JS | 162 de 236 (69%) — Warning |
| Rutas sin `long_description` | 56 (es) / 83 (en) de 95 — **Fail (P2, editorial)** |
| Fotos | 95 rutas usan 41 fotos distintas; 77 son externas (Wikimedia) — Warning (P3) |
| Enlaces entre rutas | Solo "Más rutas en X" → ahora 6 rutas cercanas por ruta |

### Performance
| Check | Estado |
|---|---|
| Core Web Vitals (LCP, INP, CLS) | Revisión manual requerida (PageSpeed Insights / Search Console) |
| Interrupciones | **Fail → corregido**: banner a 1–2 s (empujaba el layout: CLS), encuesta a 4 s, newsletter a 9 s |
| Imágenes | webp, lazy loading en tarjetas — Pass |
| Video hero | 2,9 MB con `preload="metadata"` y poster — Warning (medir LCP) |

## Fixes priorizados

| Prio | Issue | Impacto | Esfuerzo | Estado |
|---|---|---|---|---|
| P0 | Menús sin `<a href>` rastreable | Alto | Bajo | ✅ Hecho |
| P0 | Hasta 3 interrupciones en la página de aterrizaje + CLS del banner | Alto | Bajo | ✅ Hecho |
| P1 | Sin enlaces entre rutas hermanas (páginas por sesión) | Alto | Medio | ✅ Hecho |
| P1 | Fotos de rutas sin alt | Medio | Bajo | ✅ Hecho |
| P1 | Títulos > 60 caracteres | Medio | Bajo | ✅ Hecho |
| P1 | Metas > 160 / < 120 caracteres | Medio | Bajo | ✅ Hecho |
| P1 | "dificultad extremo" en metas y FAQ | Bajo | Bajo | ✅ Hecho |
| P2 | "/" redirige a "/inicio" en el cliente | Medio | Medio | Pendiente |
| P2 | Descripciones largas faltantes (contenido thin) | Alto | Alto | Pendiente |
| P2 | Medir Core Web Vitals reales y el peso del video hero | Medio | Bajo | Pendiente |
| P3 | Fotos propias por ruta en lugar de Wikimedia repetidas | Medio | Alto | Pendiente |

### Detalle de lo implementado

1. **Menús rastreables.** `WebHeader`, `MobileWebNav` y `WebFooter` usan `<Link>` (renderiza `<a href>`). Con el idioma en inglés apuntan a las URLs `/en/…`, las mismas del sitemap. Helper: `src/utils/navHref.ts`. El footer suma enlaces a Guías de supervivencia y Guías de montaña.
2. **Una sola interrupción por sesión** (`src/utils/overlayGate.ts`). Banner promocional, encuesta y newsletter comparten la regla: nunca en la página de aterrizaje, nunca antes de 30 s, y como máximo una por sesión. El banner superior solo aparece al cambiar de ruta (dentro de la ventana de 500 ms del clic, que CLS no penaliza). El aviso de cookies (obligatorio) y el de instalación (solo usuarios logueados) no cambian.
3. **"Rutas cercanas"** al final de cada ruta: 6 tarjetas con `<a href>`, primero del mismo parque y luego de la misma región, ordenadas por distancia real (`relatedTrails` en `src/data/hubs.ts`). También se incluye en el HTML sin JS (`prerender-trails.mjs`).
4. **Alt descriptivo** en las fotos de rutas: "Sendero Laguna de los Tres — Parque Nacional Los Glaciares, Santa Cruz, Argentina" (`trailPhotoAlt`).
5. **Títulos y metas dentro de rango** con `src/utils/seoText.ts` (`fitTitle` / `fitDescription`): se prueba del más completo al más corto y la keyword siempre va primero. Las 8 páginas principales se reescribieron a mano.
6. **Concordancia**: "dificultad moderada/extrema" (`difficultyEsFem`).

## Schema markup

Ya existía y se mantiene válido; no requirió cambios:

| Página | Tipos |
|---|---|
| Todas | `WebSite` (con `SearchAction`), `Organization` |
| Ruta | `TouristAttraction` (geo, dirección, propiedades técnicas), `BreadcrumbList`, `FAQPage` |
| Región / parque | `CollectionPage`, `ItemList`, `Place` / `TouristAttraction`, `BreadcrumbList`, `FAQPage` |
| Páginas principales | `WebPage`, `BreadcrumbList` (+ `FAQPage` en supervivencia) |

Revisión manual requerida: pasar 1 URL de cada tipo por el [Rich Results Test](https://search.google.com/test/rich-results) después del deploy.

## Archivos creados / modificados

Creados:
- `src/utils/navHref.ts`: URLs públicas del menú por idioma.
- `src/utils/overlayGate.ts`: regla de una interrupción por sesión.
- `src/utils/seoText.ts`: ajuste de títulos y descripciones.
- `scripts/audit-seo.mjs`: auditor de títulos, metas y contenido de las 236 URLs.
- `SEO_AUDIT_REPORT.md`: este reporte.

Modificados:
- `src/components/layout/WebHeader.tsx`, `MobileWebNav.tsx`, `WebFooter.tsx`: `<Link>` en lugar de `router.push`.
- `src/components/ui/PromoBanner.tsx`, `QuickPoll.tsx`, `NewsletterPopup.tsx`: pasan por `overlayGate`.
- `app/_layout.tsx`: registra páginas vistas para la regla de interrupciones.
- `app/(tabs)/ruta/[id].tsx`: bloque "Rutas cercanas" y alt en el hero.
- `src/components/trails/TrailCard.tsx`: alt en las fotos.
- `src/data/hubs.ts`: `relatedTrails()`.
- `src/utils/trailSeo.ts`, `src/utils/hubSeo.ts`, `src/data/coreSeo.ts`: títulos y metas.
- `src/utils/trailFaq.ts`: concordancia de dificultad.
- `scripts/prerender-trails.mjs`: rutas cercanas en el HTML sin JS.

## Próximos pasos (P2 / P3)

1. **Descripciones largas (P2, mayor impacto pendiente).** Empezar por las 20 rutas con más impresiones en Search Console: 300–500 palabras con acceso, tramos, agua, campamentos y errores comunes. Se puede generar un borrador con IA a partir de los datos de cada ruta, pero necesita revisión experta antes de publicar.
2. **Home en "/" (P2).** Renderizar la home directamente en `/` y hacer un 301 de `/inicio` a `/` en `netlify.toml`.
3. **Core Web Vitals (P2).** Revisar el informe de CWV en Search Console. Si el LCP mobile supera 2,5 s, no cargar el video hero en mobile (dejar solo el poster).
4. **Medir el impacto (P2).** En GA4, comparar tiempo de interacción y páginas por sesión 4 semanas antes y después del deploy. En Search Console, el CTR de las páginas `/ruta/*` (por los títulos nuevos).
5. **Fotos propias (P3).** Una foto única por ruta, idealmente de la comunidad vía `/contribuir`, con nombre de archivo descriptivo.
