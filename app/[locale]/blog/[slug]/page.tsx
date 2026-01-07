import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';

interface Props {
  params: {
    locale: string;
    slug: string;
  };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug } = params;

  const post = await prisma.blogPost.findUnique({
    where: {
      slug,
      isPublished: true,
    },
    include: {
      translations: {
        where: { locale },
      },
    },
  });

  if (!post || post.translations.length === 0) {
    return {
      title: 'Post no encontrado',
    };
  }

  const translation = post.translations[0];

  return {
    title: translation.metaTitle || translation.title,
    description: translation.metaDescription || translation.excerpt,
    openGraph: {
      title: translation.metaTitle || translation.title,
      description: translation.metaDescription || translation.excerpt,
      type: 'article',
      publishedTime: post.publishedAt?.toISOString(),
      authors: [post.author],
      images: post.featuredImage ? [post.featuredImage] : [],
    },
  };
}

async function getPost(slug: string, locale: string) {
  const post = await prisma.blogPost.findUnique({
    where: {
      slug,
      isPublished: true,
    },
    include: {
      translations: {
        where: { locale },
      },
    },
  });

  if (!post || post.translations.length === 0) {
    return null;
  }

  // Increment view count
  await prisma.blogPost.update({
    where: { id: post.id },
    data: { viewCount: { increment: 1 } },
  });

  return post;
}

export default async function BlogPostPage({ params }: Props) {
  const { locale, slug } = params;
  const post = await getPost(slug, locale);

  if (!post) {
    notFound();
  }

  const translation = post.translations[0];

  return (
    <div className="min-h-screen bg-gradient-to-b from-black via-purple-950/20 to-black">
      {/* Featured Image */}
      {post.featuredImage && (
        <div className="relative h-[400px] overflow-hidden">
          <img
            src={post.featuredImage}
            alt={translation.title}
            className="h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent" />
        </div>
      )}

      {/* Article */}
      <article className="px-6 py-12">
        <div className="mx-auto max-w-4xl">
          {/* Back Button */}
          <Link
            href={`/${locale}/blog`}
            className="mb-8 inline-flex items-center gap-2 text-purple-400 hover:text-purple-300"
          >
            <ArrowLeftIcon className="h-4 w-4" />
            {locale === 'ca' ? 'Tornar al blog' : 'Volver al blog'}
          </Link>

          {/* Header */}
          <header className="mb-8">
            <div className="mb-4 flex flex-wrap items-center gap-3 text-sm text-white/60">
              <span className="rounded-full bg-purple-500/20 px-3 py-1 text-xs text-purple-300">
                {post.category}
              </span>
              {post.readingTime && (
                <span>
                  {post.readingTime} {locale === 'ca' ? 'min lectura' : 'min lectura'}
                </span>
              )}
              <span>•</span>
              <span>
                {new Date(post.publishedAt || post.createdAt).toLocaleDateString(
                  locale === 'ca' ? 'ca-ES' : 'es-ES',
                  {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  }
                )}
              </span>
              <span>•</span>
              <span>
                {post.viewCount} {locale === 'ca' ? 'visualitzacions' : 'visualizaciones'}
              </span>
            </div>

            <h1 className="mb-4 text-4xl font-bold text-white md:text-5xl">
              {translation.title}
            </h1>

            <p className="text-xl text-white/80">{translation.excerpt}</p>

            <div className="mt-6 flex items-center gap-4">
              <div className="h-12 w-12 overflow-hidden rounded-full bg-gradient-to-br from-purple-500 to-pink-500">
                <div className="flex h-full w-full items-center justify-center text-white">
                  {post.author.charAt(0)}
                </div>
              </div>
              <div>
                <div className="font-medium text-white">{post.author}</div>
                {post.tags.length > 0 && (
                  <div className="flex gap-2 text-sm text-white/60">
                    {post.tags.map((tag) => (
                      <span key={tag}>#{tag}</span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </header>

          {/* Content */}
          <div className="prose prose-invert prose-lg max-w-none">
            <div
              className="text-white/90"
              dangerouslySetInnerHTML={{
                __html: translation.content.replace(/\n/g, '<br />'),
              }}
            />
          </div>

          {/* Footer */}
          <footer className="mt-12 border-t border-white/10 pt-8">
            <div className="rounded-lg border border-white/10 bg-white/5 p-6">
              <h3 className="mb-2 text-lg font-semibold text-white">
                {locale === 'ca'
                  ? 'Tens un esdeveniment proper?'
                  : '¿Tienes un evento próximo?'}
              </h3>
              <p className="mb-4 text-white/70">
                {locale === 'ca'
                  ? 'Contacta amb nosaltres per fer del teu esdeveniment una experiència inolvidable.'
                  : 'Contáctanos para hacer de tu evento una experiencia inolvidable.'}
              </p>
              <Link
                href={`/${locale}/contacto`}
                className="inline-block rounded-lg bg-purple-600 px-6 py-3 text-white hover:bg-purple-700"
              >
                {locale === 'ca' ? 'Contactar' : 'Contactar'}
              </Link>
            </div>
          </footer>
        </div>
      </article>
    </div>
  );
}
