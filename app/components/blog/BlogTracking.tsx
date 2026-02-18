'use client';

import { useEffect } from 'react';
import { trackCTAClick, trackScrollDepth } from '@/app/lib/analytics';

type BlogTrackingProps = {
  page: 'index' | 'post';
  slug?: string;
};

export default function BlogTracking({ page, slug }: BlogTrackingProps) {
  useEffect(() => {
    const trackedScroll = new Set<number>();

    const onScroll = () => {
      const doc = document.documentElement;
      const maxScroll = doc.scrollHeight - window.innerHeight;
      if (maxScroll <= 0) return;
      const percentage = Math.round((window.scrollY / maxScroll) * 100);

      if (percentage >= 50 && !trackedScroll.has(50)) {
        trackedScroll.add(50);
        trackScrollDepth(50);
        trackCTAClick(`blog_scroll_50${slug ? `_${slug}` : ''}`, `blog_${page}`);
      }

      if (percentage >= 90 && !trackedScroll.has(90)) {
        trackedScroll.add(90);
        trackScrollDepth(90);
        trackCTAClick(`blog_scroll_90${slug ? `_${slug}` : ''}`, `blog_${page}`);
      }
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();

    return () => {
      window.removeEventListener('scroll', onScroll);
    };
  }, [page, slug]);

  useEffect(() => {
    if (page !== 'post' || !slug) return;

    trackCTAClick(`blog_post_view_${slug}`, 'blog_post');

    const timer = window.setTimeout(() => {
      trackCTAClick(`blog_read_30s_${slug}`, 'blog_post');
    }, 30000);

    return () => {
      window.clearTimeout(timer);
    };
  }, [page, slug]);

  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null;
      const cta = target?.closest<HTMLElement>('[data-blog-cta]');
      if (!cta) return;
      const label = cta.dataset.blogCta;
      if (!label) return;
      trackCTAClick(label, `blog_${page}`);
    };

    document.addEventListener('click', onClick);
    return () => {
      document.removeEventListener('click', onClick);
    };
  }, [page]);

  return null;
}

