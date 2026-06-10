import { Platform } from 'react-native';

let gsapLoaded = false;
let gsapInstance: any = null;
let ScrollTriggerInstance: any = null;

export async function loadGSAP() {
  if (Platform.OS !== 'web' || typeof window === 'undefined') return null;
  if (gsapLoaded) return { gsap: gsapInstance, ScrollTrigger: ScrollTriggerInstance };

  try {
    const [gsapMod, stMod] = await Promise.all([
      import('gsap'),
      import('gsap/ScrollTrigger'),
    ]);
    gsapInstance = gsapMod.gsap;
    ScrollTriggerInstance = stMod.ScrollTrigger;
    gsapInstance.registerPlugin(ScrollTriggerInstance);
    gsapLoaded = true;
    return { gsap: gsapInstance, ScrollTrigger: ScrollTriggerInstance };
  } catch {
    return null;
  }
}

// ── Hero entrance — staggered cinematic reveal ────────────────────────────────
export function animateHeroEntrance(container: string = '[data-hero]') {
  loadGSAP().then((result) => {
    if (!result) return;
    const { gsap } = result;

    const tl = gsap.timeline({ defaults: { ease: 'power4.out' } });

    // Eyebrow fades in first
    tl.from(`${container} [data-hero-eyebrow]`, {
      opacity: 0, y: 16, letterSpacing: '8px', duration: 0.9,
    }, 0.1)
    // Title chars split
    .from(`${container} [data-hero-title]`, {
      opacity: 0, y: 52, skewY: 2, duration: 1.2,
    }, 0.3)
    // Subtitle
    .from(`${container} [data-hero-sub]`, {
      opacity: 0, y: 22, duration: 0.8,
    }, 0.65)
    // CTAs pop in with scale
    .from(`${container} [data-hero-cta]`, {
      opacity: 0, y: 18, scale: 0.94,
      stagger: 0.15, duration: 0.75,
    }, 0.85)
    // Stats strip slides up
    .from(`${container} [data-hero-stats]`, {
      opacity: 0, y: 24, duration: 0.6,
    }, 1.1);
  });
}

// ── Scroll reveal — clip-path + fade for premium feel ────────────────────────
export function animateScrollReveal() {
  loadGSAP().then((result) => {
    if (!result) return;
    const { gsap, ScrollTrigger } = result;

    // Stat cards — staggered scale up
    ScrollTrigger.batch('[data-stat-card]', {
      onEnter: (els: Element[]) =>
        gsap.fromTo(els,
          { opacity: 0, y: 28, scale: 0.96 },
          { opacity: 1, y: 0, scale: 1, stagger: 0.1, duration: 0.7, ease: 'power3.out' }
        ),
      once: true,
    });

    // Section labels — slide from left
    ScrollTrigger.batch('[data-section-label]', {
      onEnter: (els: Element[]) =>
        gsap.fromTo(els,
          { opacity: 0, x: -20 },
          { opacity: 1, x: 0, stagger: 0.08, duration: 0.6, ease: 'power2.out' }
        ),
      once: true,
    });

    // Cards — staggered rise
    ScrollTrigger.batch('[data-reveal-card]', {
      onEnter: (els: Element[]) =>
        gsap.fromTo(els,
          { opacity: 0, y: 36 },
          { opacity: 1, y: 0, stagger: 0.12, duration: 0.75, ease: 'power3.out' }
        ),
      once: true,
    });

    // Interactive cards — gentle float in
    ScrollTrigger.batch('[data-interactive-card]', {
      onEnter: (els: Element[]) =>
        gsap.fromTo(els,
          { opacity: 0, y: 24 },
          { opacity: 1, y: 0, stagger: 0.1, duration: 0.65, ease: 'power2.out' }
        ),
      once: true,
      start: 'top 92%',
    });
  });
}

// ── Parallax hero background + content fade-out on scroll ────────────────────
export function animateParallaxHero(heroEl: string = '[data-hero]') {
  loadGSAP().then((result) => {
    if (!result) return;
    const { gsap, ScrollTrigger } = result;

    // Video / image parallax
    gsap.to(`${heroEl} [data-hero-bg]`, {
      y: '28%',
      ease: 'none',
      scrollTrigger: {
        trigger: heroEl,
        start: 'top top',
        end: 'bottom top',
        scrub: 0.8,
      },
    });

    // Hero content drifts and fades out
    gsap.to(`${heroEl} [data-hero-content]`, {
      opacity: 0,
      y: -56,
      scale: 0.97,
      ease: 'none',
      scrollTrigger: {
        trigger: heroEl,
        start: 'top top',
        end: '38% top',
        scrub: true,
      },
    });
  });
}

// ── Counter animation for numeric stats ──────────────────────────────────────
export function animateCounters(selector: string = '[data-counter]') {
  if (Platform.OS !== 'web' || typeof document === 'undefined') return;
  loadGSAP().then((result) => {
    if (!result) return;
    const { gsap, ScrollTrigger } = result;

    document.querySelectorAll(selector).forEach((el) => {
      const target = parseFloat((el as HTMLElement).dataset.value || '0');
      const obj = { val: 0 };
      ScrollTrigger.create({
        trigger: el,
        start: 'top 85%',
        once: true,
        onEnter: () => {
          gsap.to(obj, {
            val: target,
            duration: 1.8,
            ease: 'power2.out',
            onUpdate: () => {
              (el as HTMLElement).textContent = Number.isInteger(target)
                ? Math.round(obj.val).toString()
                : obj.val.toFixed(1);
            },
          });
        },
      });
    });
  });
}

// ── Magnetic button effect ────────────────────────────────────────────────────
export function initMagneticButtons(selector: string = '[data-magnetic]') {
  if (Platform.OS !== 'web' || typeof document === 'undefined') return;
  loadGSAP().then((result) => {
    if (!result) return;
    const { gsap } = result;

    document.querySelectorAll(selector).forEach((el) => {
      const btn = el as HTMLElement;
      const strength = parseFloat(btn.dataset.strength || '0.35');

      btn.addEventListener('mousemove', (e: MouseEvent) => {
        const rect = btn.getBoundingClientRect();
        const x = e.clientX - rect.left - rect.width / 2;
        const y = e.clientY - rect.top - rect.height / 2;
        gsap.to(btn, {
          x: x * strength,
          y: y * strength,
          duration: 0.35,
          ease: 'power2.out',
        });
      });

      btn.addEventListener('mouseleave', () => {
        gsap.to(btn, { x: 0, y: 0, duration: 0.55, ease: 'elastic.out(1, 0.4)' });
      });
    });
  });
}

// ── Smooth section entrance with stagger for feature grids ───────────────────
export function animateFeatureGrid(selector: string = '[data-feature-blocks] > *') {
  if (Platform.OS !== 'web' || typeof document === 'undefined') return;
  loadGSAP().then((result) => {
    if (!result) return;
    const { gsap, ScrollTrigger } = result;

    const els = document.querySelectorAll(selector);
    if (!els.length) return;

    gsap.fromTo(
      Array.from(els),
      { opacity: 0, y: 40, scale: 0.97 },
      {
        opacity: 1, y: 0, scale: 1,
        stagger: 0.15, duration: 0.85, ease: 'power3.out',
        scrollTrigger: {
          trigger: els[0].parentElement,
          start: 'top 80%',
          once: true,
        },
      }
    );
  });
}

// ── Horizontal scroll indicator for card rows ─────────────────────────────────
export function animateHubCards(selector: string = '[data-dest-card]') {
  if (Platform.OS !== 'web' || typeof document === 'undefined') return;
  loadGSAP().then((result) => {
    if (!result) return;
    const { gsap, ScrollTrigger } = result;

    ScrollTrigger.batch(selector, {
      onEnter: (els: Element[]) =>
        gsap.fromTo(els,
          { opacity: 0, x: 24 },
          { opacity: 1, x: 0, stagger: 0.1, duration: 0.65, ease: 'power2.out' }
        ),
      once: true,
      start: 'top 90%',
    });
  });
}
