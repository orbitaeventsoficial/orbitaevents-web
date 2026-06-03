import type { ReactNode } from 'react';

export type WxKind = 'sun' | 'partly' | 'cloud' | 'rain' | 'storm';
export type WxData = { kind: WxKind; tmax: number; tmin: number; forecast: boolean };

const ic = (d: ReactNode) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7}
    strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{d}</svg>
);

const WX_ARIA: Record<WxKind, string> = {
  sun: 'Sol', partly: 'Parcialment ennuvolat', cloud: 'Ennuvolat', rain: 'Pluja', storm: 'Tempesta',
};

function WxIcon({ kind }: { kind: WxKind }) {
  switch (kind) {
    case 'sun':
      return ic(<><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/></>);
    case 'partly':
      return ic(<><circle cx="10" cy="10" r="3.5"/><path d="M10 3v1M4.22 4.22l.71.71M3 10h1M17 14a5 5 0 0 0-10 0"/><path d="M7 14h10a4 4 0 1 1 0 8H8a5 5 0 1 1 0-10 4.97 4.97 0 0 1 .9.08"/></>);
    case 'cloud':
      return ic(<path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9z"/>);
    case 'rain':
      return ic(<><path d="M20 16.58A5 5 0 0 0 18 7h-1.26A8 8 0 1 0 4 15.25"/><path d="M8 19v2M8 13v2M16 19v2M16 13v2M12 21v2M12 15v2"/></>);
    case 'storm':
      return ic(<><path d="M19 16.9A5 5 0 0 0 18 7h-1.26A8 8 0 1 0 4 15.25"/><polyline points="13 11 9 17 15 17 11 23"/></>);
  }
}

export default function WxBadge({ wx, size = 'md' }: { wx: WxData; size?: 'sm' | 'md' }) {
  if (!wx.forecast) return null;
  return (
    <span className={`wx-badge wx-badge--${size}`} data-wx={wx.kind}
      aria-label={`Temps: ${WX_ARIA[wx.kind]}, màxima ${wx.tmax}°`}>
      <WxIcon kind={wx.kind} />
      <span>{wx.tmax}°</span>
    </span>
  );
}
