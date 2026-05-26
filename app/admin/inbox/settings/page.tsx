// app/admin/inbox/settings/page.tsx
// Canvi #802 — extirpació AdminPage, reconstrucció ix- (Brass & Obsidian)
import Link from 'next/link';
import ImapSettingsClient from './ImapSettingsClient';
import '../inbox.css';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: "Configurar safata d'entrada | Òrbita Admin",
};

export default function InboxSettingsPage() {
  return (
    <div className="ix">
      <div className="ix__head">
        <div className="ix__headleft">
          <Link href="/admin/inbox" className="ix__back">← Safata</Link>
          <span className="ix__eyebrow">Safata d&apos;entrada</span>
          <h1 className="ix__title">Configuració IMAP</h1>
          <p className="ix__subtitle">Connexió al servidor de correu DonDominio.</p>
        </div>
      </div>
      <div className="ix__settingsbody">
        <ImapSettingsClient />
      </div>
    </div>
  );
}
