// app/[locale]/not-found.tsx
import { Link } from '@/lib/navigation';
import { useTranslations } from 'next-intl';

export default function NotFound() {
  const t = useTranslations('notFound');

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0a0a0a] p-4">
      <div className="max-w-[42rem] text-center text-white">
        {/* 404 */}
        <div className="mb-8">
          <h1 className="text-[5rem] sm:text-[9rem] font-black text-[rgba(215,184,110,0.2)] leading-none mb-4">
            404
          </h1>
          <div className="w-24 h-1 bg-[var(--oe-gold)] mx-auto rounded-full" />
        </div>

        <h2 className="text-4xl sm:text-[2.5rem] font-black mb-4">
          {t('title')}
        </h2>

        <p className="text-xl text-white/60 mb-8 leading-relaxed">
          {t('description')}
          <br />
          {t('descriptionExtra')}
        </p>

        <div className="flex flex-col gap-4 mb-12 items-center">
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-8 py-4 bg-[var(--oe-gold)] text-black font-bold rounded-xl text-lg no-underline hover:scale-105 hover:shadow-[0_0_30px_rgba(215,184,110,0.5)] transition-all"
          >
            {t('backToHome')}
          </Link>

          <Link
            href="/servicios"
            className="inline-flex items-center gap-2 px-8 py-4 bg-white/5 text-white font-bold rounded-xl text-lg no-underline border border-[rgba(215,184,110,0.3)] hover:bg-white/10 transition-colors"
          >
            {t('viewServices')}
          </Link>
        </div>

        <div className="border-t border-white/10 pt-8">
          <p className="text-sm text-white/60 mb-4">
            {t('lookingFor')}
          </p>
          <div className="flex flex-wrap justify-center gap-4 text-sm">
            <Link href="/servicios/bodas" className="text-[var(--oe-gold)] no-underline hover:underline">
              {t('links.djWeddings')}
            </Link>
            <Link href="/servicios/discomovil" className="text-[var(--oe-gold)] no-underline hover:underline">
              {t('links.discomovil')}
            </Link>
            <Link href="/servicios/fiestas" className="text-[var(--oe-gold)] no-underline hover:underline">
              {t('links.parties')}
            </Link>
            <Link href="/servicios/empresas" className="text-[var(--oe-gold)] no-underline hover:underline">
              {t('links.corporate')}
            </Link>
            <Link href="/contacto" className="text-[var(--oe-gold)] no-underline hover:underline">
              {t('links.contact')}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
