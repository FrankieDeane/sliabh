import { Platform } from 'react-native';

export function injectWebStyles() {
  if (Platform.OS !== 'web' || typeof document === 'undefined') return;

  // Leaflet CSS must be synchronously available before MapContainer mounts
  const leafletId = 'leaflet-css-eager';
  if (!document.getElementById(leafletId)) {
    const link = document.createElement('link');
    link.id = leafletId;
    link.rel = 'stylesheet';
    link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
    document.head.appendChild(link);
  }

  // Editorial typefaces: Fraunces (expedition serif display) + Inter (UI)
  const fontsId = 'sliabh-fonts';
  if (!document.getElementById(fontsId)) {
    const pre1 = document.createElement('link');
    pre1.rel = 'preconnect';
    pre1.href = 'https://fonts.googleapis.com';
    const pre2 = document.createElement('link');
    pre2.rel = 'preconnect';
    pre2.href = 'https://fonts.gstatic.com';
    pre2.crossOrigin = 'anonymous';
    const fonts = document.createElement('link');
    fonts.id = fontsId;
    fonts.rel = 'stylesheet';
    fonts.href =
      'https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,300..700;1,9..144,300..600&family=Inter:wght@400;500;600;700;800&display=swap';
    document.head.append(pre1, pre2, fonts);
  }

  const id = 'sliabh-global-styles';
  if (document.getElementById(id)) return;

  const style = document.createElement('style');
  style.id = id;
  style.textContent = `
    /* ─────────────────────────────────────────────
       KEYFRAMES
    ───────────────────────────────────────────── */
    /* ─────────────────────────────────────────────
       EDITORIAL TYPE SYSTEM — expedition luxury
    ───────────────────────────────────────────── */
    body, #root { font-family: 'Inter', -apple-system, sans-serif; }

    [data-serif], [data-serif] * {
      font-family: 'Fraunces', Georgia, serif !important;
      font-optical-sizing: auto;
    }
    [data-display-xl], [data-display-xl] * {
      font-family: 'Fraunces', Georgia, serif !important;
      font-weight: 380 !important;
      letter-spacing: -0.02em !important;
      line-height: 1.02 !important;
    }
    [data-eyebrow], [data-eyebrow] * {
      font-family: 'Inter', sans-serif !important;
      font-weight: 600 !important;
      letter-spacing: 0.35em !important;
      text-transform: uppercase !important;
      font-size: 11px !important;
    }
    [data-coord], [data-coord] * {
      font-family: 'Inter', sans-serif !important;
      font-weight: 500 !important;
      letter-spacing: 0.2em !important;
      font-variant-numeric: tabular-nums;
    }
    [data-bignum], [data-bignum] * {
      font-family: 'Fraunces', Georgia, serif !important;
      font-weight: 300 !important;
      letter-spacing: -0.03em !important;
      font-variant-numeric: tabular-nums;
    }

    /* Editorial full-bleed band: image carries the section */
    [data-band] {
      position: relative;
      overflow: hidden;
    }
    [data-band] img {
      transition: transform 1.6s cubic-bezier(0.22, 1, 0.36, 1);
    }
    [data-band]:hover img { transform: scale(1.04); }

    /* Hairline rules, expedition-log style */
    [data-rule] {
      height: 1px !important;
      background: linear-gradient(90deg, transparent, rgba(148,163,184,0.35), transparent) !important;
    }

    /* Slow editorial reveal */
    @keyframes editorialUp {
      from { opacity: 0; transform: translateY(28px); }
      to   { opacity: 1; transform: translateY(0); }
    }
    [data-ed-reveal] { animation: editorialUp 1.1s cubic-bezier(0.22, 1, 0.36, 1) both; }

    @keyframes kenBurns {
      0%   { transform: scale(1.0) translate(0, 0); }
      50%  { transform: scale(1.08) translate(-1%, -0.5%); }
      100% { transform: scale(1.04) translate(1%, 0.5%); }
    }
    @keyframes shimmer {
      0%   { background-position: -200% center; }
      100% { background-position: 200% center; }
    }
    @keyframes fadeUp {
      from { opacity: 0; transform: translateY(24px); }
      to   { opacity: 1; transform: translateY(0); }
    }
    @keyframes fadeIn {
      from { opacity: 0; }
      to   { opacity: 1; }
    }
    @keyframes pageIn {
      from { opacity: 0; transform: translateY(10px); }
      to   { opacity: 1; transform: translateY(0); }
    }
    @keyframes pulseGlow {
      0%, 100% { box-shadow: 0 0 0 0 rgba(34,197,94,0.18); }
      50%       { box-shadow: 0 0 20px 4px rgba(34,197,94,0.22); }
    }
    @keyframes floatOrb {
      0%   { transform: translate(0, 0) scale(1); }
      33%  { transform: translate(30px, -20px) scale(1.06); }
      66%  { transform: translate(-20px, 14px) scale(0.96); }
      100% { transform: translate(0, 0) scale(1); }
    }
    @keyframes meshShift {
      0%   { background-position: 0% 50%; }
      50%  { background-position: 100% 50%; }
      100% { background-position: 0% 50%; }
    }
    @keyframes skeletonShimmer {
      0%   { background-position: -400px 0; }
      100% { background-position: 400px 0; }
    }
    @keyframes gradientBorder {
      0%   { background-position: 0% 50%; }
      50%  { background-position: 100% 50%; }
      100% { background-position: 0% 50%; }
    }
    @keyframes buttonShimmer {
      0%   { left: -100%; }
      100% { left: 200%; }
    }
    @keyframes countUp {
      from { opacity: 0; transform: translateY(8px); }
      to   { opacity: 1; transform: translateY(0); }
    }

    /* ─────────────────────────────────────────────
       GLOBAL RESETS & TYPOGRAPHY
    ───────────────────────────────────────────── */
    * {
      -webkit-font-smoothing: antialiased;
      -moz-osx-font-smoothing: grayscale;
    }
    ::selection {
      background: rgba(34,197,94,0.28);
      color: #f0f9ff;
    }

    /* ─────────────────────────────────────────────
       PREMIUM SCROLLBAR
    ───────────────────────────────────────────── */
    ::-webkit-scrollbar { width: 5px; height: 5px; }
    ::-webkit-scrollbar-track { background: transparent; }
    ::-webkit-scrollbar-thumb {
      background: linear-gradient(180deg, rgba(34,197,94,0.35), rgba(22,163,74,0.2));
      border-radius: 3px;
    }
    ::-webkit-scrollbar-thumb:hover {
      background: linear-gradient(180deg, rgba(34,197,94,0.6), rgba(22,163,74,0.4));
    }
    ::-webkit-scrollbar-corner { background: transparent; }

    /* ─────────────────────────────────────────────
       HERO VIDEO + BG
    ───────────────────────────────────────────── */
    [data-hero-bg] {
      animation: kenBurns 18s ease-in-out infinite alternate;
      will-change: transform;
    }
    [data-hero-video] {
      position: absolute !important;
      top: 0 !important; left: 0 !important;
      width: 100% !important; height: 100% !important;
      object-fit: cover !important;
      pointer-events: none !important;
      z-index: 0 !important;
      animation: none !important;
    }

    /* ─────────────────────────────────────────────
       GLASS MORPHISM
    ───────────────────────────────────────────── */
    [data-glass] {
      backdrop-filter: blur(16px) saturate(1.5);
      -webkit-backdrop-filter: blur(16px) saturate(1.5);
      background: rgba(7,11,20,0.55) !important;
      border: 1px solid rgba(255,255,255,0.06) !important;
    }
    [data-header-glass] {
      backdrop-filter: blur(14px) saturate(1.5);
      -webkit-backdrop-filter: blur(14px) saturate(1.5);
    }

    /* ─────────────────────────────────────────────
       INTERACTIVE CARDS
    ───────────────────────────────────────────── */
    [data-interactive-card] {
      transition: transform 0.26s cubic-bezier(0.34, 1.56, 0.64, 1),
                  box-shadow 0.26s ease,
                  border-color 0.26s ease;
      will-change: transform;
    }
    [data-interactive-card]:hover {
      transform: translateY(-5px) scale(1.014);
      box-shadow: 0 16px 40px rgba(0,0,0,0.38), 0 0 0 1px rgba(34,197,94,0.14);
    }

    /* ─────────────────────────────────────────────
       REVEAL + STAT CARDS (GSAP targets)
    ───────────────────────────────────────────── */
    [data-stat-card],
    [data-section-label],
    [data-reveal-card],
    [data-interactive-card] {
      will-change: transform, opacity;
    }

    /* ─────────────────────────────────────────────
       DESTINATION CARDS
    ───────────────────────────────────────────── */
    [data-dest-card] {
      transition: transform 0.24s cubic-bezier(0.34,1.56,0.64,1),
                  box-shadow 0.24s ease;
      will-change: transform;
      overflow: hidden;
    }
    [data-dest-card]:hover {
      transform: translateY(-4px) scale(1.012);
      box-shadow: 0 14px 36px rgba(0,0,0,0.4), 0 0 0 1px rgba(34,197,94,0.18);
    }
    [data-dest-card] img, [data-dest-card] [data-dest-img] {
      transition: transform 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94);
    }
    [data-dest-card]:hover img, [data-dest-card]:hover [data-dest-img] {
      transform: scale(1.06);
    }

    /* ─────────────────────────────────────────────
       TRAIL CARDS (image zoom on hover)
    ───────────────────────────────────────────── */
    [data-trail-card] {
      transition: transform 0.24s cubic-bezier(0.34,1.56,0.64,1),
                  box-shadow 0.24s ease;
      will-change: transform;
      overflow: hidden;
    }
    [data-trail-card]:hover {
      transform: translateY(-3px) scale(1.01);
      box-shadow: 0 12px 32px rgba(0,0,0,0.36), 0 0 0 1px rgba(34,197,94,0.12);
    }
    [data-trail-card] [data-trail-thumb] {
      transition: transform 0.55s cubic-bezier(0.25, 0.46, 0.45, 0.94);
      will-change: transform;
    }
    [data-trail-card]:hover [data-trail-thumb] {
      transform: scale(1.08);
    }

    /* ─────────────────────────────────────────────
       GRADIENT TEXT UTILITY
    ───────────────────────────────────────────── */
    [data-gradient-text] {
      background: linear-gradient(135deg, #4ade80 0%, #22c55e 40%, #86efac 80%, #4ade80 100%);
      background-size: 200% auto;
      -webkit-background-clip: text;
      background-clip: text;
      -webkit-text-fill-color: transparent;
      animation: shimmer 4s linear infinite;
    }

    /* ─────────────────────────────────────────────
       ANIMATED GRADIENT BORDER
    ───────────────────────────────────────────── */
    [data-gradient-border] {
      position: relative;
    }
    [data-gradient-border]::before {
      content: '';
      position: absolute;
      inset: -1px;
      border-radius: inherit;
      background: linear-gradient(135deg, #22c55e, #16a34a, #4ade80, #22c55e);
      background-size: 300% 300%;
      animation: gradientBorder 4s ease infinite;
      z-index: -1;
      opacity: 0.6;
    }

    /* ─────────────────────────────────────────────
       BUTTON STATES + SHIMMER
    ───────────────────────────────────────────── */
    [data-btn] {
      cursor: pointer;
      position: relative;
      overflow: hidden;
      transition: transform 0.15s cubic-bezier(0.34,1.56,0.64,1),
                  box-shadow 0.15s ease,
                  filter 0.15s ease;
      will-change: transform;
    }
    [data-btn]::before {
      content: '';
      position: absolute;
      top: 0; left: -100%;
      width: 60%;
      height: 100%;
      background: linear-gradient(90deg, transparent, rgba(255,255,255,0.12), transparent);
      transform: skewX(-20deg);
      pointer-events: none;
      transition: none;
    }
    [data-btn]:hover::before {
      animation: buttonShimmer 0.55s ease forwards;
    }
    [data-btn]:hover  { transform: translateY(-2px) scale(1.02); filter: brightness(1.08); }
    [data-btn]:active { transform: translateY(1px)  scale(0.98); filter: brightness(0.95); }
    [data-btn]:focus-visible {
      outline: 2px solid #22c55e;
      outline-offset: 3px;
    }
    [data-btn="primary"] {
      box-shadow: 0 4px 16px rgba(22,163,74,0.4), 0 1px 3px rgba(0,0,0,0.25);
    }
    [data-btn="primary"]:hover {
      box-shadow: 0 8px 28px rgba(22,163,74,0.55), 0 2px 6px rgba(0,0,0,0.3);
    }
    [data-btn="secondary"]:hover {
      box-shadow: 0 4px 14px rgba(0,0,0,0.22);
    }
    [data-btn="ghost"]:hover {
      background-color: rgba(22,163,74,0.08) !important;
    }
    [data-btn="danger"] {
      box-shadow: 0 4px 14px rgba(220,38,38,0.3);
    }

    /* Primary btn pulse (when not hovered) */
    [data-btn-primary] {
      animation: pulseGlow 3s ease-in-out infinite;
      transition: transform 0.18s cubic-bezier(0.34,1.56,0.64,1),
                  background-color 0.18s ease;
    }
    [data-btn-primary]:hover {
      transform: scale(1.04);
      animation: none;
    }

    /* ─────────────────────────────────────────────
       MAGNETIC BUTTON TARGET
    ───────────────────────────────────────────── */
    [data-magnetic] {
      display: inline-flex;
      will-change: transform;
    }

    /* ─────────────────────────────────────────────
       NAVIGATION LINKS
    ───────────────────────────────────────────── */
    [data-nav-link] {
      position: relative;
    }
    [data-nav-link]::after {
      content: '';
      position: absolute;
      bottom: -2px; left: 50%;
      width: 0; height: 2px;
      background: #22c55e;
      border-radius: 1px;
      transition: width 0.22s ease, left 0.22s ease;
    }
    [data-nav-link]:hover::after {
      width: 100%; left: 0;
    }

    /* ─────────────────────────────────────────────
       SKELETON LOADING SHIMMER
    ───────────────────────────────────────────── */
    [data-skeleton] {
      background: linear-gradient(90deg,
        rgba(255,255,255,0.04) 25%,
        rgba(255,255,255,0.1) 50%,
        rgba(255,255,255,0.04) 75%
      );
      background-size: 800px 100%;
      animation: skeletonShimmer 1.6s infinite linear;
      border-radius: 6px;
    }

    /* ─────────────────────────────────────────────
       DOWNLOAD PROGRESS BAR
    ───────────────────────────────────────────── */
    [data-download-progress] {
      background: linear-gradient(90deg, #16a34a, #22c55e, #4ade80);
      background-size: 200% 100%;
      animation: meshShift 2s linear infinite;
      border-radius: 99px;
      transition: width 0.1s linear;
    }

    /* ─────────────────────────────────────────────
       SECTION DIVIDER
    ───────────────────────────────────────────── */
    [data-section-divider] {
      height: 1px;
      background: linear-gradient(to right, transparent, rgba(30,45,66,0.7) 20%, rgba(30,45,66,0.7) 80%, transparent);
      margin: 32px 0;
    }

    /* ─────────────────────────────────────────────
       PAGE TRANSITIONS
    ───────────────────────────────────────────── */
    [data-page-content] {
      animation: pageIn 0.4s cubic-bezier(0.22, 1, 0.36, 1);
    }

    /* ─────────────────────────────────────────────
       HERO SECTIONS
    ───────────────────────────────────────────── */
    [data-hero-section] {
      height: 100vh !important;
      min-height: 620px;
    }
    [data-hero-title-display] {
      font-size: clamp(42px, 6vw, 72px) !important;
      line-height: 1.0 !important;
      letter-spacing: -2.5px !important;
    }

    /* ─────────────────────────────────────────────
       FEATURE GRID
    ───────────────────────────────────────────── */
    [data-feature-blocks] {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 16px;
    }
    @media (max-width: 768px) {
      [data-feature-blocks] { grid-template-columns: 1fr; }
    }

    /* ─────────────────────────────────────────────
       GALLERY
    ───────────────────────────────────────────── */
    [data-gallery-label] {
      background: linear-gradient(to top, rgba(7,11,20,0.72) 0%, transparent 100%) !important;
    }

    /* ─────────────────────────────────────────────
       AUTH BANNER
    ───────────────────────────────────────────── */
    [data-auth-banner] {
      transition: background-color 0.2s ease, border-color 0.2s ease, transform 0.2s ease;
    }
    [data-auth-banner]:hover {
      transform: translateY(-2px);
      border-color: rgba(22,163,74,0.45) !important;
      background-color: rgba(22,163,74,0.1) !important;
    }

    /* ─────────────────────────────────────────────
       FEATURED GRID (DESKTOP)
    ───────────────────────────────────────────── */
    [data-featured-grid] {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 12px;
    }

    /* ─────────────────────────────────────────────
       RUTAS SPLIT LAYOUT
    ───────────────────────────────────────────── */
    [data-rutas-split] {
      display: flex;
      flex-direction: row;
      height: calc(100vh - 58px);
      overflow: hidden;
    }
    [data-rutas-list-panel] {
      width: 400px;
      flex-shrink: 0;
      overflow-y: auto;
      overflow-x: hidden;
    }
    [data-rutas-map-panel] {
      flex: 1;
      position: sticky;
      top: 0;
      height: calc(100vh - 58px);
    }

    /* ─────────────────────────────────────────────
       TRAIL DETAIL HERO
    ───────────────────────────────────────────── */
    [data-trail-hero] {
      height: 100vh !important;
      min-height: 560px;
    }
    [data-trail-hero-gradient-top] {
      background: linear-gradient(to bottom, rgba(7,11,20,0.55) 0%, transparent 40%) !important;
    }
    [data-trail-hero-gradient-bottom] {
      background: linear-gradient(to top, rgba(7,11,20,0.95) 0%, rgba(7,11,20,0.6) 50%, transparent 100%) !important;
      height: 70% !important;
    }
    [data-trail-tab-bar] {
      position: sticky;
      top: 58px;
      z-index: 20;
      backdrop-filter: blur(12px) saturate(1.3);
      -webkit-backdrop-filter: blur(12px) saturate(1.3);
      background-color: rgba(7,11,20,0.85) !important;
    }

    /* ─────────────────────────────────────────────
       LIGHTBOX
    ───────────────────────────────────────────── */
    [data-lightbox-backdrop] {
      animation: fadeIn 0.2s ease;
    }

    /* ─────────────────────────────────────────────
       COUNTER ANIMATION
    ───────────────────────────────────────────── */
    [data-counter] {
      animation: countUp 0.6s ease both;
    }

    /* ─────────────────────────────────────────────
       FLOATING ORB DECORATIONS
    ───────────────────────────────────────────── */
    [data-float-orb] {
      animation: floatOrb 12s ease-in-out infinite;
      will-change: transform;
      pointer-events: none;
    }
    [data-float-orb="slow"] {
      animation-duration: 18s;
    }
    [data-float-orb="fast"] {
      animation-duration: 8s;
    }
  `;
  document.head.appendChild(style);
}
