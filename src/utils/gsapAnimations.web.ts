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

export function animateHeroEntrance(container: string = '[data-hero]') {
  loadGSAP().then((result) => {
    if (!result) return;
    const { gsap } = result;

    const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });
    tl.from(`${container} [data-hero-brand]`, { opacity: 0, y: 24, duration: 0.9 }, 0.2)
      .from(`${container} [data-hero-title]`, { opacity: 0, y: 38, duration: 1.1 }, 0.4)
      .from(`${container} [data-hero-sub]`, { opacity: 0, y: 18, duration: 0.8 }, 0.65)
      .from(`${container} [data-hero-cta]`, {
        opacity: 0,
        y: 14,
        scale: 0.96,
        duration: 0.7,
        stagger: 0.14,
      }, 0.85);
  });
}

export function animateScrollReveal() {
  loadGSAP().then((result) => {
    if (!result) return;
    const { gsap, ScrollTrigger } = result;

    // Stat cards
    ScrollTrigger.batch('[data-stat-card]', {
      onEnter: (els: Element[]) =>
        gsap.from(els, { opacity: 0, y: 22, stagger: 0.1, duration: 0.65, ease: 'power2.out' }),
      once: true,
    });

    // Section labels / headings
    ScrollTrigger.batch('[data-section-label]', {
      onEnter: (els: Element[]) =>
        gsap.from(els, { opacity: 0, x: -16, stagger: 0.08, duration: 0.55, ease: 'power2.out' }),
      once: true,
    });

    // Cards in a row (action cards, trail cards)
    ScrollTrigger.batch('[data-reveal-card]', {
      onEnter: (els: Element[]) =>
        gsap.from(els, { opacity: 0, y: 28, stagger: 0.1, duration: 0.7, ease: 'power2.out' }),
      once: true,
    });
  });
}

export function animateParallaxHero(heroEl: string = '[data-hero]') {
  loadGSAP().then((result) => {
    if (!result) return;
    const { gsap, ScrollTrigger } = result;

    // Parallax the background image inside the hero
    gsap.to(`${heroEl} [data-hero-bg]`, {
      y: '25%',
      ease: 'none',
      scrollTrigger: {
        trigger: heroEl,
        start: 'top top',
        end: 'bottom top',
        scrub: true,
      },
    });

    // Fade and drift the hero content on scroll
    gsap.to(`${heroEl} [data-hero-content]`, {
      opacity: 0,
      y: -40,
      ease: 'none',
      scrollTrigger: {
        trigger: heroEl,
        start: 'top top',
        end: '40% top',
        scrub: true,
      },
    });
  });
}
