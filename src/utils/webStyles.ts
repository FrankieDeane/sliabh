import { Platform } from 'react-native';

export function injectWebStyles() {
  if (Platform.OS !== 'web' || typeof document === 'undefined') return;
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

    /* Section reveal base (GSAP animates these) */
    [data-stat-card],
    [data-section-label],
    [data-reveal-card] {
      will-change: transform, opacity;
    }
  `;
  document.head.appendChild(style);
}
