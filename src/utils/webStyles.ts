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

  const id = 'sliabh-global-styles';
  if (document.getElementById(id)) return;

  const style = document.createElement('style');
  style.id = id;
  style.textContent = `
    /* ── Ken Burns hero animation ── */
    @keyframes kenBurns {
      0%   { transform: scale(1.0) translate(0, 0); }
      50%  { transform: scale(1.08) translate(-1%, -0.5%); }
      100% { transform: scale(1.04) translate(1%, 0.5%); }
    }

    /* ── Subtle shimmer for badges ── */
    @keyframes shimmer {
      0%   { background-position: -200% center; }
      100% { background-position: 200% center; }
    }

    /* ── Fade up entrance ── */
    @keyframes fadeUp {
      from { opacity: 0; transform: translateY(24px); }
      to   { opacity: 1; transform: translateY(0); }
    }

    /* ── Pulse glow for accent elements ── */
    @keyframes pulseGlow {
      0%, 100% { box-shadow: 0 0 0 0 rgba(34,197,94,0.18); }
      50%       { box-shadow: 0 0 20px 4px rgba(34,197,94,0.22); }
    }

    /* Ken Burns applied to hero background image */
    [data-hero-bg] {
      animation: kenBurns 18s ease-in-out infinite alternate;
      will-change: transform;
    }

    /* Hero video covers its container */
    [data-hero-video] {
      position: absolute;
      top: 0; left: 0;
      width: 100%; height: 100%;
      object-fit: cover;
      pointer-events: none;
      z-index: 0;
    }

    /* Smooth hover for interactive cards */
    [data-interactive-card] {
      transition: transform 0.22s cubic-bezier(0.34, 1.56, 0.64, 1),
                  box-shadow 0.22s ease,
                  border-color 0.22s ease;
      will-change: transform;
    }
    [data-interactive-card]:hover {
      transform: translateY(-3px) scale(1.012);
      box-shadow: 0 12px 32px rgba(0,0,0,0.35);
    }

    /* Navigation link hover underline */
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

    /* Frosted glass header on scroll */
    [data-header-glass] {
      backdrop-filter: blur(12px) saturate(1.4);
      -webkit-backdrop-filter: blur(12px) saturate(1.4);
    }

    /* Smooth page transitions */
    * {
      -webkit-font-smoothing: antialiased;
      -moz-osx-font-smoothing: grayscale;
    }

    /* Hide scrollbar on horizontal scroll containers */
    ::-webkit-scrollbar { height: 4px; width: 4px; }
    ::-webkit-scrollbar-track { background: transparent; }
    ::-webkit-scrollbar-thumb { background: rgba(100,116,139,0.3); border-radius: 2px; }

    /* Accent btn pulse */
    [data-btn-primary] {
      animation: pulseGlow 3s ease-in-out infinite;
      transition: transform 0.18s cubic-bezier(0.34,1.56,0.64,1),
                  background-color 0.18s ease;
    }
    [data-btn-primary]:hover {
      transform: scale(1.04);
    }

    /* Gallery label gradient */
    [data-gallery-label] {
      background: linear-gradient(to top, rgba(7,11,20,0.72) 0%, transparent 100%) !important;
    }

    /* Section reveal base (GSAP animates these) */
    [data-stat-card],
    [data-section-label],
    [data-reveal-card] {
      will-change: transform, opacity;
    }

    /* Smooth page entrance */
    @keyframes pageIn {
      from { opacity: 0; transform: translateY(10px); }
      to   { opacity: 1; transform: translateY(0); }
    }
    [data-page-content] {
      animation: pageIn 0.4s cubic-bezier(0.22, 1, 0.36, 1);
    }

    /* Section divider gradient */
    [data-section-divider] {
      height: 1px;
      background: linear-gradient(to right, transparent, rgba(30,45,66,0.7) 20%, rgba(30,45,66,0.7) 80%, transparent);
      margin: 32px 0;
    }

    /* Hero video — always covers its container */
    [data-hero-video] {
      position: absolute !important;
      top: 0 !important; left: 0 !important;
      width: 100% !important; height: 100% !important;
      object-fit: cover !important;
      pointer-events: none !important;
      z-index: 0 !important;
    }

    /* Auth banner hover lift */
    [data-auth-banner] {
      transition: background-color 0.2s ease, border-color 0.2s ease, transform 0.2s ease;
    }
    [data-auth-banner]:hover {
      transform: translateY(-2px);
      border-color: rgba(22,163,74,0.45) !important;
      background-color: rgba(22,163,74,0.1) !important;
    }

    /* Gallery lightbox animation */
    [data-lightbox-backdrop] {
      animation: fadeIn 0.2s ease;
    }
    @keyframes fadeIn {
      from { opacity: 0; }
      to   { opacity: 1; }
    }

    /* Featured grid on desktop */
    [data-featured-grid] {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 12px;
    }

    /* ── Trail detail: full-viewport hero ── */
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
      top: 58px; /* below WebHeader */
      z-index: 20;
      backdrop-filter: blur(12px) saturate(1.3);
      -webkit-backdrop-filter: blur(12px) saturate(1.3);
      background-color: rgba(7,11,20,0.85) !important;
    }

    /* ── Premium button states ── */
    [data-btn] {
      cursor: pointer;
      transition: transform 0.15s cubic-bezier(0.34,1.56,0.64,1),
                  box-shadow 0.15s ease,
                  filter 0.15s ease;
      will-change: transform;
    }
    [data-btn]:hover  { transform: translateY(-2px) scale(1.02); filter: brightness(1.08); }
    [data-btn]:active { transform: translateY(1px)  scale(0.98); filter: brightness(0.95); }
    [data-btn]:focus-visible {
      outline: 2px solid #22c55e;
      outline-offset: 3px;
    }
    [data-btn="primary"] {
      box-shadow: 0 4px 16px rgba(22,163,74,0.35), 0 1px 3px rgba(0,0,0,0.25);
    }
    [data-btn="primary"]:hover {
      box-shadow: 0 8px 24px rgba(22,163,74,0.45), 0 2px 6px rgba(0,0,0,0.3);
    }
    [data-btn="secondary"]:hover {
      box-shadow: 0 4px 14px rgba(0,0,0,0.2);
    }
    [data-btn="ghost"]:hover {
      background-color: rgba(22,163,74,0.08) !important;
    }
    [data-btn="danger"] {
      box-shadow: 0 4px 14px rgba(220,38,38,0.3);
    }
  `;
  document.head.appendChild(style);
}
