export const INTRO_PAGES = ['/', '/ca', '/es', '/en'] as const;
export const MOBILE_INTRO_STORAGE_KEY = 'orbita-mobile-intro-seen';
export const MOBILE_INTRO_COMPLETE_EVENT = 'orbita-mobile-intro-complete';

const INTRO_BOT_PATTERNS = [
  'googlebot',
  'lighthouse',
  'pagespeed',
  'chrome-lighthouse',
  'gtmetrix',
  'pingdom',
  'webpagetest',
  'yandex',
  'bingbot',
  'slurp',
  'duckduckbot',
  'baiduspider',
  'facebookexternalhit',
  'twitterbot',
  'rogerbot',
  'linkedinbot',
  'embedly',
  'showyoubot',
  'outbrain',
  'pinterest',
  'applebot',
  'semrush',
  'ahrefsbot',
  'mj12bot',
  'dotbot',
  'petalbot',
  'bytespider',
  'headlesschrome',
] as const;

export type IntroMode = 'desktop' | 'mobile' | 'none';

export function isIntroPage(pathname: string | null | undefined): boolean {
  if (!pathname) return false;
  return INTRO_PAGES.includes(pathname as (typeof INTRO_PAGES)[number]);
}

export function isBotUserAgent(userAgent: string): boolean {
  const normalized = userAgent.toLowerCase();
  return INTRO_BOT_PATTERNS.some((pattern) => normalized.includes(pattern));
}

export function hasSeenMobileIntro(storage: Pick<Storage, 'getItem'>): boolean {
  return storage.getItem(MOBILE_INTRO_STORAGE_KEY) === 'true';
}

export function markMobileIntroSeen(storage: Pick<Storage, 'setItem'>, eventTarget: Pick<Window, 'dispatchEvent'>): void {
  storage.setItem(MOBILE_INTRO_STORAGE_KEY, 'true');
  eventTarget.dispatchEvent(new Event(MOBILE_INTRO_COMPLETE_EVENT));
}

interface ClientIntroModeOptions {
  pathname: string | null | undefined;
  search: string;
  isMobileViewport: boolean;
  reduceMotion: boolean;
  userAgent: string;
  hasSeenDesktopIntro: string | null;
}

export function getClientIntroMode({
  pathname,
  search,
  isMobileViewport,
  reduceMotion,
  userAgent,
  hasSeenDesktopIntro,
}: ClientIntroModeOptions): IntroMode {
  if (!isIntroPage(pathname)) {
    return 'none';
  }

  if (isMobileViewport) {
    return 'mobile';
  }

  const forceIntro = new URLSearchParams(search).get('intro') === '1';
  const isBot = forceIntro ? false : isBotUserAgent(userAgent);

  if (reduceMotion || isBot) {
    return 'none';
  }

  return forceIntro || !hasSeenDesktopIntro ? 'desktop' : 'none';
}

export function buildIntroBootstrapScript(): string {
  const introPages = JSON.stringify(INTRO_PAGES);
  const botPatterns = JSON.stringify(INTRO_BOT_PATTERNS);

  return `
    (() => {
      try {
        const introPages = ${introPages};
        const botPatterns = ${botPatterns};
        const path = window.location.pathname;
        const forceIntro = new URLSearchParams(window.location.search).get('intro') === '1';
        const isHomePage = introPages.includes(path);
        const isMobileViewport = window.innerWidth < 1024;
        const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        const hasSeenDesktopIntro = forceIntro ? null : sessionStorage.getItem('orbita-intro-seen');
        const userAgent = navigator.userAgent.toLowerCase();
        const isBot = forceIntro ? false : botPatterns.some((pattern) => userAgent.includes(pattern));
        const mode = !isHomePage
          ? 'none'
          : isMobileViewport
            ? 'mobile'
            : !reduceMotion && !isBot && (forceIntro || !hasSeenDesktopIntro)
              ? 'desktop'
              : 'none';
        const overlay = document.getElementById('intro-overlay');

        document.documentElement.dataset.orbitaIntroMode = mode;

        if (mode === 'desktop') {
          document.body.classList.add('hero-loading');
          document.body.classList.remove('intro-done');
          if (overlay) {
            overlay.style.display = 'block';
            overlay.style.opacity = '1';
            overlay.style.pointerEvents = 'auto';
          }
          return;
        }

        document.body.classList.remove('hero-loading');
        document.body.classList.add('intro-done');
        if (overlay) {
          overlay.style.opacity = '0';
          overlay.style.pointerEvents = 'none';
          overlay.style.display = 'none';
        }
      } catch {
        document.documentElement.dataset.orbitaIntroMode = 'none';
        document.body.classList.remove('hero-loading');
        document.body.classList.add('intro-done');
        const overlay = document.getElementById('intro-overlay');
        if (overlay) {
          overlay.style.display = 'none';
        }
      }
    })();
  `;
}
