'use client';

import { useLocale, useTranslations } from 'next-intl';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { PUBLIC_LANGUAGE_CODES, PUBLIC_LANGUAGE_SHORT_NAMES } from '@/lib/constants';

/**
 * 🌍 LANGUAGE SELECTOR - CA/ES/EN
 *
 * Selector de idiomas con català, español e inglés.
 * L'idioma actiu es destaca amb un anell taronja.
 */

// BANDERES SVG
const flags: Record<string, JSX.Element> = {
  // Catalunya - SENYERA (4 barres vermelles sobre groc)
  ca: (
    <svg viewBox="0 0 640 480" className="w-full h-full">
      <rect width="640" height="480" fill="#FCDD09"/>
      <rect y="53" width="640" height="53" fill="#DA121A"/>
      <rect y="160" width="640" height="53" fill="#DA121A"/>
      <rect y="267" width="640" height="53" fill="#DA121A"/>
      <rect y="374" width="640" height="53" fill="#DA121A"/>
    </svg>
  ),

  // Espanya
  es: (
    <svg viewBox="0 0 640 480" className="w-full h-full">
      <rect width="640" height="480" fill="#AA151B"/>
      <rect y="120" width="640" height="240" fill="#F1BF00"/>
    </svg>
  ),

  // United Kingdom
  en: (
    <svg viewBox="0 0 640 480" className="w-full h-full">
      <defs>
        <clipPath id="gb-a">
          <path fillOpacity=".7" d="M-85.3 0h682.6v512H-85.3z"/>
        </clipPath>
      </defs>
      <g clipPath="url(#gb-a)" transform="translate(80) scale(.94)">
        <g strokeWidth="1pt">
          <path fill="#012169" d="M-256 0H768v512H-256z"/>
          <path fill="#fff" d="M-256 0v57.2L653.5 512H768v-57.2L-141.5 0H-256zM768 0v57.2L-141.5 512H-256v-57.2L653.5 0H768z"/>
          <path fill="#fff" d="M170.7 0v512h170.6V0H170.7zM-256 170.7v170.6H768V170.7H-256z"/>
          <path fill="#c8102e" d="M-256 204.8v102.4H768V204.8H-256zM204.8 0v512h102.4V0H204.8zM-256 512L85.3 341.3h76.4L-179.7 512H-256zm0-512L85.3 170.7H9L-256 38.2V0zm606.4 170.7L691.7 0H768L426.7 170.7h-76.3zM768 512L426.7 341.3H503l265 132.5V512z"/>
        </g>
      </g>
    </svg>
  ),
};

// Configuració dels idiomes - CA/ES/EN
const languageCodes = PUBLIC_LANGUAGE_CODES;
const shortNames = PUBLIC_LANGUAGE_SHORT_NAMES;

interface LanguageSelectorProps {
  variant?: 'flags' | 'flags-text' | 'compact';
  showTooltip?: boolean;
  className?: string;
}

export default function LanguageSelector({
  variant = 'flags',
  showTooltip = true,
  className = ''
}: LanguageSelectorProps) {
  const locale = useLocale();
  const pathname = usePathname();
  const [hoveredLang, setHoveredLang] = useState<string | null>(null);
  const tAccessibility = useTranslations('accessibility');
  const tLang = useTranslations('languages');

  const switchLocale = (newLocale: string) => {
    // Guardar preferència a cookie
    document.cookie = `NEXT_LOCALE=${newLocale}; path=/; max-age=31536000`;

    // Obtenir path sense locale actual
    const segments = (pathname || '').split('/');
    const hasLocalePrefix = languageCodes.some(code => code === segments[1]);
    const pathWithoutLocale = hasLocalePrefix
      ? '/' + segments.slice(2).join('/')
      : pathname;

    // Construir nova URL
    const DEFAULT_LOCALE = 'ca';
    let newPath: string;
    if (newLocale === DEFAULT_LOCALE) {
      newPath = pathWithoutLocale || '/';
    } else {
      newPath = `/${newLocale}${pathWithoutLocale || ''}`;
    }

    // Forçar recàrrega completa per aplicar el canvi d'idioma
    window.location.href = newPath;
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // VARIANT: FLAGS (només banderes SVG)
  // ═══════════════════════════════════════════════════════════════════════════
  if (variant === 'flags') {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        {languageCodes.map((code) => {
          const isActive = locale === code;
          const langName = tLang(code);
          return (
            <button
              key={code}
              onClick={() => switchLocale(code)}
              onMouseEnter={() => setHoveredLang(code)}
              onMouseLeave={() => setHoveredLang(null)}
              className={`
                relative group flex items-center
                transition-all duration-300 ease-out
                ${isActive ? 'scale-110 z-10' : 'hover:scale-110'}
              `}
              aria-label={tAccessibility('changeLanguageTo', { language: langName })}
            >
              {/* Glow effect quan actiu */}
              {isActive && (
                <div className="absolute inset-0 bg-orange-500/30 blur-xl rounded-full scale-150" />
              )}

              {/* Bandera SVG */}
              <div className={`
                relative w-9 h-7 rounded-md overflow-hidden
                transition-all duration-300 shadow-lg
                ${isActive
                  ? 'ring-2 ring-orange-500 shadow-orange-500/40'
                  : 'ring-1 ring-white/20 hover:ring-white/50 shadow-black/30'
                }
              `}>
                {flags[code]}
              </div>

              {/* Punt indicador actiu */}
              {isActive && (
                <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-orange-500 rounded-full shadow-lg shadow-orange-500/50" />
              )}

              {/* Tooltip */}
              {showTooltip && hoveredLang === code && !isActive && (
                <span className="absolute -bottom-10 left-1/2 -translate-x-1/2 px-3 py-1.5 text-xs font-medium bg-neutral-900 text-white rounded-lg whitespace-nowrap z-50 shadow-xl border border-white/10">
                  {langName}
                </span>
              )}
            </button>
          );
        })}
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // VARIANT: FLAGS-TEXT (banderes + codi)
  // ═══════════════════════════════════════════════════════════════════════════
  if (variant === 'flags-text') {
    return (
      <div className={`flex items-center gap-1 ${className}`}>
        {languageCodes.map((code) => {
          const isActive = locale === code;
          const langName = tLang(code);
          return (
            <button
              key={code}
              onClick={() => switchLocale(code)}
              className={`
                flex items-center gap-2 px-3 py-2 rounded-lg
                text-sm font-medium
                transition-all duration-200
                ${isActive
                  ? 'bg-orange-500 text-white'
                  : 'text-neutral-400 hover:text-white hover:bg-white/10'
                }
              `}
              aria-label={tAccessibility('changeLanguageTo', { language: langName })}
            >
              <div className="w-6 h-5 rounded overflow-hidden ring-1 ring-white/20">
                {flags[code]}
              </div>
              <span className="hidden sm:inline">{shortNames[code]}</span>
            </button>
          );
        })}
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // VARIANT: COMPACT (per mòbil - grid)
  // ═══════════════════════════════════════════════════════════════════════════
  if (variant === 'compact') {
    return (
      <div className={`grid grid-cols-2 gap-2 ${className}`}>
        {languageCodes.map((code) => {
          const isActive = locale === code;
          const langName = tLang(code);
          return (
            <button
              key={code}
              onClick={() => switchLocale(code)}
              className={`
                flex flex-col items-center justify-center
                p-2 rounded-xl
                transition-all duration-200
                ${isActive
                  ? 'bg-orange-500/20 ring-2 ring-orange-500'
                  : 'bg-white/5 hover:bg-white/10'
                }
              `}
              aria-label={tAccessibility('changeLanguageTo', { language: langName })}
            >
              <div className="w-8 h-6 rounded overflow-hidden mb-1 ring-1 ring-white/20">
                {flags[code]}
              </div>
              <span className={`text-xs font-medium ${isActive ? 'text-orange-500' : 'text-neutral-400'}`}>
                {shortNames[code]}
              </span>
            </button>
          );
        })}
      </div>
    );
  }

  return null;
}

// ═══════════════════════════════════════════════════════════════════════════
// VERSIÓ MÒBIL AMB DROPDOWN
// ═══════════════════════════════════════════════════════════════════════════
export function LanguageSelectorMobile({ className = '' }: { className?: string }) {
  const locale = useLocale();
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const tLang = useTranslations('languages');

  const currentLangCode = languageCodes.find(code => code === locale) || languageCodes[0];

  const switchLocale = (newLocale: string) => {
    document.cookie = `NEXT_LOCALE=${newLocale}; path=/; max-age=31536000`;

    const segments = (pathname || '').split('/');
    const hasLocalePrefix = languageCodes.some(code => code === segments[1]);
    const pathWithoutLocale = hasLocalePrefix
      ? '/' + segments.slice(2).join('/')
      : pathname;

    const DEFAULT_LOCALE = 'ca';
    let newPath: string;
    if (newLocale === DEFAULT_LOCALE) {
      newPath = pathWithoutLocale || '/';
    } else {
      newPath = `/${newLocale}${pathWithoutLocale || ''}`;
    }

    window.location.href = newPath;
  };

  return (
    <div className={`relative ${className}`}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 transition-colors"
      >
        <div className="w-7 h-5 rounded overflow-hidden ring-1 ring-white/20">
          {flags[currentLangCode]}
        </div>
        <svg
          className={`w-4 h-4 text-neutral-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute top-full right-0 mt-2 p-3 min-w-[180px] bg-neutral-900/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl z-50">
            <div className="space-y-2">
              {languageCodes.map((code) => {
                const isActive = locale === code;
                const langName = tLang(code);
                return (
                  <button
                    key={code}
                    onClick={() => switchLocale(code)}
                    className={`flex items-center gap-3 w-full p-3 rounded-xl transition-all ${isActive ? 'bg-orange-500/20 ring-1 ring-orange-500/50' : 'hover:bg-white/5'}`}
                  >
                    <div className="w-9 h-7 rounded-md overflow-hidden ring-1 ring-white/20 shadow-lg">
                      {flags[code]}
                    </div>
                    <span className={`text-sm font-medium ${isActive ? 'text-orange-400' : 'text-white'}`}>
                      {langName}
                    </span>
                    {isActive && <span className="ml-auto text-orange-400">✓</span>}
                  </button>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// BARRA HORITZONTAL DE BANDERES (per footer)
// ═══════════════════════════════════════════════════════════════════════════
export function LanguageBar({ className = '' }: { className?: string }) {
  const locale = useLocale();
  const pathname = usePathname();

  const switchLocale = (newLocale: string) => {
    document.cookie = `NEXT_LOCALE=${newLocale}; path=/; max-age=31536000`;

    const segments = (pathname || '').split('/');
    const hasLocalePrefix = languageCodes.some(code => code === segments[1]);
    const pathWithoutLocale = hasLocalePrefix
      ? '/' + segments.slice(2).join('/')
      : pathname;

    const DEFAULT_LOCALE = 'ca';
    let newPath: string;
    if (newLocale === DEFAULT_LOCALE) {
      newPath = pathWithoutLocale || '/';
    } else {
      newPath = `/${newLocale}${pathWithoutLocale || ''}`;
    }

    window.location.href = newPath;
  };

  return (
    <div className={`flex items-center justify-center gap-4 py-4 ${className}`}>
      <span className="text-neutral-500 text-sm mr-2">🌍</span>
      {languageCodes.map((code, index) => {
        const isActive = locale === code;
        return (
          <div key={code} className="flex items-center">
            <button
              onClick={() => switchLocale(code)}
              className={`
                flex items-center gap-2 px-3 py-1.5 rounded-full
                transition-all duration-200
                ${isActive
                  ? 'bg-orange-500 text-white'
                  : 'text-neutral-400 hover:text-white hover:bg-white/10'
                }
              `}
            >
              <div className="w-5 h-4 rounded overflow-hidden">
                {flags[code]}
              </div>
              <span className="text-sm font-medium">{shortNames[code]}</span>
            </button>
            {index < languageCodes.length - 1 && (
              <span className="text-neutral-700 mx-2">|</span>
            )}
          </div>
        );
      })}
    </div>
  );
}
