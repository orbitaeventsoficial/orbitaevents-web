'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Pencil, Trash2, Plus } from 'lucide-react';
import { fetchWithCsrf } from '@/lib/csrf';
import { formatDateSimple } from '@/lib/constants';
import { log } from '@/lib/logger';
import ConfirmDialog, { useConfirmDialog } from '../components/ConfirmDialog';
import { AdminEmptyState, AdminPage } from '../components/AdminPage';

interface BlogPost {
  id: string;
  slug: string;
  author: string;
  category: string;
  tags: string[];
  featuredImage?: string;
  isPublished: boolean;
  publishedAt?: string;
  viewCount: number;
  readingTime?: number;
  createdAt: string;
  updatedAt: string;
  translations: {
    id: string;
    locale: string;
    title: string;
    excerpt: string;
  }[];
}

function getFlashClass(type: 'success' | 'error') {
  return type === 'success' ? 'ap-inline-alert ap-inline-alert--success' : 'ap-inline-alert ap-inline-alert--danger';
}

function getPublishBadgeClass(isPublished: boolean) {
  return isPublished ? 'ap-badge ap-badge--success' : 'ap-badge ap-badge--warning';
}

export default function BlogAdminPage() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [locale, setLocale] = useState('ca');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [flashMessage, setFlashMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const searchParams = useSearchParams();
  const router = useRouter();
  const { confirm, dialogProps } = useConfirmDialog();

  const fetchPosts = useCallback(async () => {
    const controller = new AbortController();
    const tid = setTimeout(() => controller.abort(), 15000);
    try {
      setLoading(true);
      const res = await fetchWithCsrf(`/api/admin/blog?locale=${locale}&page=${page}&limit=20`, { signal: controller.signal });
      const data = await res.json();
      setPosts(data.posts || []);
      setTotal(data.pagination?.total || 0);
      setTotalPages(data.pagination?.totalPages || 0);
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') {
        setFlashMessage({ type: 'error', text: 'La connexió ha trigat massa. Reintenta.' });
      } else {
        log.error('Failed to fetch posts:', error);
        setFlashMessage({ type: 'error', text: 'Error carregant posts' });
      }
    } finally {
      clearTimeout(tid);
      setLoading(false);
    }
  }, [locale, page]);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  useEffect(() => {
    const created = searchParams?.get('created');
    if (created === '1') {
      setFlashMessage({ type: 'success', text: 'Post creat correctament' });
    }
  }, [searchParams]);

  const handleDelete = async (id: string) => {
    const ok = await confirm({
      title: 'Eliminar post',
      message: 'Segur que vols eliminar aquest post?',
      confirmLabel: 'Eliminar',
      variant: 'danger',
    });
    if (!ok) return;

    try {
      const res = await fetchWithCsrf(`/api/admin/blog?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        setFlashMessage({ type: 'success', text: 'Post eliminat correctament' });
        fetchPosts();
      } else {
        setFlashMessage({ type: 'error', text: 'Error en eliminar el post' });
      }
    } catch (error) {
      log.error('Failed to delete post:', error);
      setFlashMessage({ type: 'error', text: 'Error en eliminar el post' });
    }
  };

  const handleTogglePublish = async (post: BlogPost) => {
    try {
      const res = await fetchWithCsrf('/api/admin/blog', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: post.id, isPublished: !post.isPublished }),
      });

      if (res.ok) {
        fetchPosts();
      } else {
        setFlashMessage({ type: 'error', text: 'Error en actualitzar el post' });
      }
    } catch (error) {
      log.error('Failed to update post:', error);
      setFlashMessage({ type: 'error', text: 'Error en actualitzar el post' });
    }
  };

  return (
    <AdminPage
      title="Blog"
      subtitle={`${total} posts en total`}
      actions={
        <div className="flex gap-3">
          <select
            value={locale}
            onChange={(e) => setLocale(e.target.value)}
            aria-label="Idioma"
            className="ap-input rounded-xl px-4 py-2"
          >
            <option value="es">Castellà</option>
            <option value="ca">Català</option>
          </select>

          <button onClick={() => router.push('/admin/blog/new')} type="button" className="ap-btn ap-btn--primary flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Nou post
          </button>
        </div>
      }
    >
      {flashMessage && (
        <div className={getFlashClass(flashMessage.type)} role={flashMessage.type === 'success' ? 'status' : 'alert'} aria-live="polite">
          <div className="flex items-center justify-between gap-4">
            <span>{flashMessage.text}</span>
            <button onClick={() => setFlashMessage(null)} type="button" aria-label="Tancar missatge" className="text-xs">
              ✕
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-20 admin-tone-text-neutral" role="status" aria-live="polite">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-current border-t-transparent" />
        </div>
      ) : !loading && flashMessage?.type === 'error' && posts.length === 0 ? (
        <AdminEmptyState
          icon="⚠️"
          title={flashMessage.text}
          action={
            <button type="button" onClick={fetchPosts} className="ap-btn ap-btn--primary">
              Reintentar
            </button>
          }
        />
      ) : posts.length === 0 ? (
        <AdminEmptyState
          icon="📝"
          title="Encara no hi ha posts"
          action={
            <button onClick={() => router.push('/admin/blog/new')} type="button" className="ap-btn ap-btn--primary">
              Crea el primer
            </button>
          }
        />
      ) : (
        <>
          <section className="space-y-3 lg:hidden">
            {posts.map((post) => {
              const translation = post.translations[0];
              return (
                <article key={post.id} className="ap-card block rounded-2xl p-4 transition-colors hover:admin-tone-bg-neutral">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium">{translation?.title || 'Sense títol'}</p>
                      <p className="mt-0.5 text-xs admin-tone-text-slate">/{post.slug}</p>
                    </div>
                    <button
                      onClick={() => handleTogglePublish(post)}
                      type="button"
                      aria-pressed={post.isPublished}
                      className={getPublishBadgeClass(post.isPublished)}
                    >
                      {post.isPublished ? 'Publicat' : 'Esborrany'}
                    </button>
                  </div>
                  <div className="mt-3 flex items-center justify-between border-t pt-3 text-xs admin-tone-border-neutral">
                    <div className="flex items-center gap-3 admin-tone-text-slate">
                      <span className="ap-badge">{post.category}</span>
                      <span>{post.viewCount} visites</span>
                      <span>{formatDateSimple(post.createdAt)}</span>
                    </div>
                    <div className="flex gap-1">
                      <button
                        onClick={() => router.push(`/admin/blog/edit/${post.id}`)}
                        type="button"
                        className="ap-btn ap-btn--secondary flex min-h-[44px] min-w-[44px] items-center justify-center p-2.5"
                        title="Editar"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(post.id)}
                        type="button"
                        className="ap-btn ap-btn--danger flex min-h-[44px] min-w-[44px] items-center justify-center p-2.5"
                        title="Eliminar"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
          </section>

          <div className="hidden lg:block ap-table-wrap">
            <table className="ap-table w-full text-sm" aria-label="Llistat d'articles del blog">
              <thead className="ap-table-head">
                <tr>
                  <th scope="col" className="ap-table-th">Títol</th>
                  <th scope="col" className="ap-table-th">Categoria</th>
                  <th scope="col" className="ap-table-th">Estat</th>
                  <th scope="col" className="ap-table-th">Visites</th>
                  <th scope="col" className="ap-table-th">Data</th>
                  <th scope="col" className="ap-table-th text-right">Accions</th>
                </tr>
              </thead>
              <tbody className="ap-table-body">
                {posts.map((post) => {
                  const translation = post.translations[0];
                  return (
                    <tr key={post.id}>
                      <td className="px-6 py-4">
                        <div>
                          <div className="font-medium">{translation?.title || 'Sense títol'}</div>
                          <div className="text-sm admin-tone-text-slate">/{post.slug}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="ap-badge">{post.category}</span>
                      </td>
                      <td className="px-6 py-4">
                        <button onClick={() => handleTogglePublish(post)} type="button" aria-pressed={post.isPublished} className={getPublishBadgeClass(post.isPublished)}>
                          {post.isPublished ? 'Publicat' : 'Esborrany'}
                        </button>
                      </td>
                      <td className="px-6 py-4">{post.viewCount}</td>
                      <td className="px-6 py-4 admin-tone-text-slate">{formatDateSimple(post.createdAt)}</td>
                      <td className="px-6 py-4">
                        <div className="flex justify-end gap-2">
                          <button onClick={() => router.push(`/admin/blog/edit/${post.id}`)} type="button" className="ap-btn ap-btn--secondary p-2" title="Editar">
                            <Pencil className="h-5 w-5" />
                          </button>
                          <button onClick={() => handleDelete(post.id)} type="button" className="ap-btn ap-btn--danger p-2" title="Eliminar">
                            <Trash2 className="h-5 w-5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="mt-6 flex justify-center gap-2">
              <button onClick={() => setPage(page - 1)} disabled={page === 1} type="button" className="ap-btn ap-btn--secondary">
                Anterior
              </button>
              <span className="flex items-center px-4 admin-tone-text-slate">Pàgina {page} de {totalPages}</span>
              <button onClick={() => setPage(page + 1)} disabled={page === totalPages} type="button" className="ap-btn ap-btn--secondary">
                Següent
              </button>
            </div>
          )}
        </>
      )}
      <ConfirmDialog {...dialogProps} />
    </AdminPage>
  );
}
