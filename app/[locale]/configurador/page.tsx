// app/configurador/page.tsx
import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import Breadcrumbs from '@/components/seo/Breadcrumbs';
import nextDynamic from 'next/dynamic';
import { getSiteUrl } from '@/lib/site';


export const dynamic = 'force-dynamic';

// Loading skeleton mentre carrega el client
function LoadingSkeleton() {
  return (
    <div className="min-h-screen bg-bg-main py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Progress Steps skeleton */}
        <div className="mb-16 flex justify-center">
          <div className="flex items-center gap-2 sm:gap-4">
            {[1, 2, 3, 4].map((s) => (
              <div key={s} className="flex items-center gap-2 sm:gap-4">
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-bg-surface animate-pulse" />
                {s < 4 && <div className="h-0.5 w-6 sm:w-12 bg-bg-surface" />}
              </div>
            ))}
          </div>
        </div>
        {/* Content skeleton */}
        <div className="text-center mb-12">
          <div className="h-12 w-96 mx-auto bg-bg-surface rounded-lg animate-pulse mb-4" />
          <div className="h-6 w-64 mx-auto bg-bg-surface rounded animate-pulse" />
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="p-8 rounded-2xl bg-bg-surface border border-border animate-pulse">
              <div className="w-12 h-12 bg-zinc-800 rounded-full mb-4" />
              <div className="h-6 w-32 bg-zinc-800 rounded mb-2" />
              <div className="h-4 w-24 bg-zinc-800 rounded" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

const ConfiguradorClient = nextDynamic(() => import('./client'), {
  loading: () => <LoadingSkeleton />,
  ssr: false,
});

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = params;
  const tMeta = await getTranslations({ locale, namespace: 'configuradorPage.meta' });

  return {
    title: tMeta('title'),
    description: tMeta('description'),
    metadataBase: new URL(getSiteUrl()),
    alternates: { canonical: '/configurador' },
    openGraph: {
      title: tMeta('ogTitle'),
      description: tMeta('ogDescription'),
      url: '/configurador',
      images: [
        {
          url: '/api/og?title=Configurador',
          alt: tMeta('ogTitle'),
        },
      ],
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: tMeta('ogTitle'),
      description: tMeta('ogDescription'),
      images: ['/api/og?title=Configurador'],
    },
    robots: { index: true, follow: true },
  };
}

type PageProps = {
  params: { locale: string };
};

export default async function ConfiguradorPage({ params }: PageProps) {
  const { locale } = params;
  const tCommon = await getTranslations({ locale, namespace: 'common' });

  return (
    <>
      <Breadcrumbs
        items={[
          { name: tCommon('nav.home'), url: '/' },
          { name: tCommon('nav.configurator'), url: '/configurador' },
        ]}
      />
      <ConfiguradorClient />
    </>
  );
}
