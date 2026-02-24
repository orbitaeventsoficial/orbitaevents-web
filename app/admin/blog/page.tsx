'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { Pencil, Trash2, Plus } from 'lucide-react';
import { log } from '@/lib/logger';
import { formatDateSimple } from '@/lib/constants';
import { AdminPage } from '../components/AdminPage';

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

export default function BlogAdminPage() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [locale, setLocale] = useState('es');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [flashMessage, setFlashMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const searchParams = useSearchParams();

  const fetchPosts = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/admin/blog?locale=${locale}&page=${page}&limit=20`);
      const data = await res.json();
      setPosts(data.posts || []);
      setTotal(data.pagination?.total || 0);
      setTotalPages(data.pagination?.totalPages || 0);
    } catch (error) {
      log.error('Failed to fetch posts:', error);
      setFlashMessage({ type: 'error', text: 'Error carregant posts' });
    } finally {
      setLoading(false);
    }
  }, [locale, page]);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  useEffect(() => {
    const created = searchParams.get('created');
    if (created === '1') {
      setFlashMessage({ type: 'success', text: 'Post creat correctament' });
    }
  }, [searchParams]);

  const handleDelete = async (id: string) => {
    if (!confirm('Segur que vols eliminar aquest post?')) return;

    try {
      const res = await fetch(`/api/admin/blog?id=${id}`, {
        method: 'DELETE',
      });

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
      const res = await fetch(`/api/admin/blog`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: post.id,
          isPublished: !post.isPublished,
        }),
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
            className="rounded-xl border px-4 py-2 focus:ring-1"
          >
            <option value="es">Castellà</option>
            <option value="ca">Català</option>
          </select>

          <button
            onClick={() => (window.location.href = '/admin/blog/new')}
            type="button"
            className="ap-btn ap-btn--primary flex items-center gap-2"
          >
            <Plus className="h-5 w-5" />
            Nou post
          </button>
        </div>
      }
    >

      {flashMessage && (
        <div
          className={`rounded-xl border px-4 py-3 text-sm ${
            flashMessage.type === 'success'
              ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300'
              : 'border-rose-500/30 bg-rose-500/10 text-rose-300'
          }`}
          role={flashMessage.type === 'success' ? 'status' : 'alert'}
          aria-live="polite"
        >
          <div className="flex items-center justify-between gap-4">
            <span>{flashMessage.text}</span>
            <button
              onClick={() => setFlashMessage(null)}
              type="button"
              aria-label="Tancar missatge"
              className="text-xs"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-20" role="status" aria-live="polite">
          <div className="animate-spin w-8 h-8 border-2 border-t-transparent rounded-full" />
        </div>
      ) : posts.length === 0 ? (
        <div className="rounded-2xl border backdrop-blur-sm p-12 text-center">
          <p className="">Encara no hi ha posts</p>
          <button
            onClick={() => (window.location.href = '/admin/blog/new')}
            type="button"
            className="mt-4"
          >
            Crea el primer
          </button>
        </div>
      ) : (
        <>
          <div className="rounded-2xl border backdrop-blur-sm overflow-hidden">
            <table className="w-full text-sm">
              <thead className="border-b">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left font-medium">
                    Títol
                  </th>
                  <th scope="col" className="px-6 py-3 text-left font-medium">
                    Categoria
                  </th>
                  <th scope="col" className="px-6 py-3 text-left font-medium">
                    Estat
                  </th>
                  <th scope="col" className="px-6 py-3 text-left font-medium">
                    Visites
                  </th>
                  <th scope="col" className="px-6 py-3 text-left font-medium">
                    Data
                  </th>
                  <th scope="col" className="px-6 py-3 text-right font-medium">
                    Accions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/30">
                {posts.map((post) => {
                  const translation = post.translations[0];
                  return (
                    <tr key={post.id} className="transition-colors">
                      <td className="px-6 py-4">
                        <div>
                          <div className="font-medium">
                            {translation?.title || 'Sense títol'}
                          </div>
                          <div className="text-sm">/{post.slug}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="rounded-full px-3 py-1 text-xs">
                          {post.category}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => handleTogglePublish(post)}
                          type="button"
                          aria-pressed={post.isPublished}
                          className={`rounded-full px-3 py-1 text-xs font-medium ${
                            post.isPublished
                              ? 'bg-emerald-500/20 text-emerald-300'
                              : 'bg-yellow-500/20 text-yellow-300'
                          }`}
                        >
                          {post.isPublished ? 'Publicat' : 'Esborrany'}
                        </button>
                      </td>
                      <td className="px-6 py-4">{post.viewCount}</td>
                      <td className="px-6 py-4 text-sm">
                        {formatDateSimple(post.createdAt)}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() =>
                              (window.location.href = `/admin/blog/edit/${post.id}`)
                            }
                            type="button"
                            className="rounded-lg p-2 transition-colors"
                            title="Editar"
                          >
                            <Pencil className="h-5 w-5" />
                          </button>
                          <button
                            onClick={() => handleDelete(post.id)}
                            type="button"
                            className="rounded-lg p-2 transition-colors"
                            title="Eliminar"
                          >
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
              <button
                onClick={() => setPage(page - 1)}
                disabled={page === 1}
                type="button"
                className="rounded-xl border px-4 py-2 disabled:opacity-50 transition-colors"
              >
                Anterior
              </button>
              <span className="flex items-center px-4">
                Pàgina {page} de {totalPages}
              </span>
              <button
                onClick={() => setPage(page + 1)}
                disabled={page === totalPages}
                type="button"
                className="rounded-xl border px-4 py-2 disabled:opacity-50 transition-colors"
              >
                Següent
              </button>
            </div>
          )}
        </>
      )}
    </AdminPage>
  );
}
