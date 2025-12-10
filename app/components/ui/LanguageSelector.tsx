'use client';

import { useLocale } from 'next-intl';
import { useRouter, usePathname } from 'next/navigation';
import { useState } from 'react';

/**
 * 🌍 LANGUAGE SELECTOR - NOMÉS CA/ES
 *
 * Selector simplificat amb només català i espanyol.
 * L'idioma actiu es destaca amb un anell taronja.
 */

// BANDERES SVG
const flags: Record<string, JSX.Element> = {
  // Catalunya - SENYERA (4 barres vermelles sobre groc)
  ca: (
    <svg viewBox="0 0 640 480" className="w-full h-full">
      <path fill="#FCDD09" d="M0 0h640v480H0z"/>
      <path stroke="#DA121A" strokeWidth="53" d="M0 53h640M0 160h640M0 267h640M0 374h640"/>
    </svg>
  ),

  // Espanya
  es: (
    <svg viewBox="0 0 640 480" className="w-full h-full">
      <path fill="#AA151B" d="M0 0h640v480H0z"/>
      <path fill="#F1BF00" d="M0 120h640v240H0z"/>
    </svg>
  ),
};

// Configuració dels idiomes - NOMÉS CA/ES
const languages = [
  { code: 'ca', name: 'Català', shortName: 'CA' },
  { code: 'es', name: 'Español', shortName: 'ES' },
];

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
  const router = useRouter();
  const pathname = usePathname();
  const [hoveredLang, setHoveredLang] = useState<string | null>(null);

  const switchLocale = (newLocale: string) => {
    // Guardar preferència a cookie
    document.cookie = `NEXT_LOCALE=${newLocale}; path=/; max-age=31536000`;

    const segments = pathname.split('/');
    // Si la URL ja té locale, substituir-lo
    if (languages.some(l => l.code === segments[1])) {
      segments[1] = newLocale;
    } else {
      // Si no té locale, afegir-lo
      segments.splice(1, 0, newLocale);
    }
    const newPath = segments.join('/') || '/';
    router.push(newPath);
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // VARIANT: FLAGS (només banderes SVG)
  // ═══════════════════════════════════════════════════════════════════════════
  if (variant === 'flags') {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        {languages.map((lang) => {
          const isActive = locale === lang.code;
          return (
            <button
              key={lang.code}
              onClick={() => switchLocale(lang.code)}
              onMouseEnter={() => setHoveredLang(lang.code)}
              onMouseLeave={() => setHoveredLang(null)}
              className={`
                relative group flex items-center
                transition-all duration-300 ease-out
                ${isActive ? 'scale-110 z-10' : 'hover:scale-110'}
              `}
              aria-label={`Canviar idioma a ${lang.name}`}
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
                {flags[lang.code]}
              </div>

              {/* Punt indicador actiu */}
              {isActive && (
                <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-orange-500 rounded-full shadow-lg shadow-orange-500/50" />
              )}

              {/* Tooltip */}
              {showTooltip && hoveredLang === lang.code && !isActive && (
                <span className="absolute -bottom-10 left-1/2 -translate-x-1/2 px-3 py-1.5 text-xs font-medium bg-neutral-900 text-white rounded-lg whitespace-nowrap z-50 shadow-xl border border-white/10">
                  {lang.name}
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
        {languages.map((lang) => {
          const isActive = locale === lang.code;
          return (
            <button
              key={lang.code}
              onClick={() => switchLocale(lang.code)}
              className={`
                flex items-center gap-2 px-3 py-2 rounded-lg
                text-sm font-medium
                transition-all duration-200
                ${isActive
                  ? 'bg-orange-500 text-white'
                  : 'text-neutral-400 hover:text-white hover:bg-white/10'
                }
              `}
              aria-label={`Canviar idioma a ${lang.name}`}
            >
              <div className="w-6 h-5 rounded overflow-hidden ring-1 ring-white/20">
                {flags[lang.code]}
              </div>
              <span className="hidden sm:inline">{lang.shortName}</span>
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
        {languages.map((lang) => {
          const isActive = locale === lang.code;
          return (
            <button
              key={lang.code}
              onClick={() => switchLocale(lang.code)}
              className={`
                flex flex-col items-center justify-center
                p-2 rounded-xl
                transition-all duration-200
                ${isActive
                  ? 'bg-orange-500/20 ring-2 ring-orange-500'
                  : 'bg-white/5 hover:bg-white/10'
                }
              `}
              aria-label={`Canviar idioma a ${lang.name}`}
            >
              <div className="w-8 h-6 rounded overflow-hidden mb-1 ring-1 ring-white/20">
                {flags[lang.code]}
              </div>
              <span className={`text-xs font-medium ${isActive ? 'text-orange-500' : 'text-neutral-400'}`}>
                {lang.shortName}
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
  const router = useRouter();
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  const currentLang = languages.find(l => l.code === locale) || languages[0];

  const switchLocale = (newLocale: string) => {
    document.cookie = `NEXT_LOCALE=${newLocale}; path=/; max-age=31536000`;
    const segments = pathname.split('/');
    if (languages.some(l => l.code === segments[1])) {
      segments[1] = newLocale;
    } else {
      segments.splice(1, 0, newLocale);
    }
    router.push(segments.join('/') || '/');
    setIsOpen(false);
  };

  return (
    <div className={`relative ${className}`}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 transition-colors"
      >
        <div className="w-7 h-5 rounded overflow-hidden ring-1 ring-white/20">
          {flags[currentLang.code]}
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
              {languages.map((lang) => {
                const isActive = locale === lang.code;
                return (
                  <button
                    key={lang.code}
                    onClick={() => switchLocale(lang.code)}
                    className={`flex items-center gap-3 w-full p-3 rounded-xl transition-all ${isActive ? 'bg-orange-500/20 ring-1 ring-orange-500/50' : 'hover:bg-white/5'}`}
                  >
                    <div className="w-9 h-7 rounded-md overflow-hidden ring-1 ring-white/20 shadow-lg">
                      {flags[lang.code]}
                    </div>
                    <span className={`text-sm font-medium ${isActive ? 'text-orange-400' : 'text-white'}`}>
                      {lang.name}
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
  const router = useRouter();
  const pathname = usePathname();

  const switchLocale = (newLocale: string) => {
    document.cookie = `NEXT_LOCALE=${newLocale}; path=/; max-age=31536000`;
    const segments = pathname.split('/');
    if (languages.some(l => l.code === segments[1])) {
      segments[1] = newLocale;
    } else {
      segments.splice(1, 0, newLocale);
    }
    router.push(segments.join('/') || '/');
  };

  return (
    <div className={`flex items-center justify-center gap-4 py-4 ${className}`}>
      <span className="text-neutral-500 text-sm mr-2">🌍</span>
      {languages.map((lang, index) => {
        const isActive = locale === lang.code;
        return (
          <div key={lang.code} className="flex items-center">
            <button
              onClick={() => switchLocale(lang.code)}
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
                {flags[lang.code]}
              </div>
              <span className="text-sm font-medium">{lang.shortName}</span>
            </button>
            {index < languages.length - 1 && (
              <span className="text-neutral-700 mx-2">|</span>
            )}
          </div>
        );
      })}
    </div>
  );
}
