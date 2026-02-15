'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { PencilIcon, TrashIcon, PlusIcon } from '@heroicons/react/24/outline';
import { log } from '@/lib/logger';

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
      setFlashMessage({ type: 'success', text: 'Post creado correctamente' });
    }
  }, [searchParams]);

  const handleDelete = async (id: string) => {
    if (!confirm('¿Estás seguro de que quieres eliminar este post?')) return;

    try {
      const res = await fetch(`/api/admin/blog?id=${id}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        setFlashMessage({ type: 'success', text: 'Post eliminado correctamente' });
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
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-100">Gestió de Blog</h1>
          <p className="mt-1 text-sm text-slate-400">{total} posts en total</p>
        </div>

        <div className="flex gap-3">
          <select
            value={locale}
            onChange={(e) => setLocale(e.target.value)}
            aria-label="Idioma"
            className="rounded-xl border border-slate-600/50 bg-slate-800/80 px-4 py-2 text-slate-100 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
          >
            <option value="es">Español</option>
            <option value="ca">Català</option>
          </select>

          <button
            onClick={() => (window.location.href = '/admin/blog/new')}
            type="button"
            className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 px-4 py-2 text-white font-medium shadow-lg shadow-cyan-500/20 hover:from-cyan-400 hover:to-blue-500 transition-colors"
          >
            <PlusIcon className="h-5 w-5" />
            Nou post
          </button>
        </div>
      </div>

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
              className="text-xs text-slate-400 hover:text-slate-200"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-20" role="status" aria-live="polite">
          <div className="animate-spin w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full" />
        </div>
      ) : posts.length === 0 ? (
        <div className="rounded-2xl border border-slate-700/50 bg-slate-800/60 backdrop-blur-sm p-12 text-center">
          <p className="text-slate-400">No hay posts todavía</p>
          <button
            onClick={() => (window.location.href = '/admin/blog/new')}
            type="button"
            className="mt-4 text-cyan-400 hover:text-cyan-300"
          >
            Crear el primer
          </button>
        </div>
      ) : (
        <>
          <div className="rounded-2xl border border-slate-700/50 bg-slate-800/60 backdrop-blur-sm overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-slate-700/30 border-b border-slate-700/50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left font-medium text-slate-300">
                    Títol
                  </th>
                  <th scope="col" className="px-6 py-3 text-left font-medium text-slate-300">
                    Categoría
                  </th>
                  <th scope="col" className="px-6 py-3 text-left font-medium text-slate-300">
                    Estat
                  </th>
                  <th scope="col" className="px-6 py-3 text-left font-medium text-slate-300">
                    Visitas
                  </th>
                  <th scope="col" className="px-6 py-3 text-left font-medium text-slate-300">
                    Data
                  </th>
                  <th scope="col" className="px-6 py-3 text-right font-medium text-slate-300">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/30">
                {posts.map((post) => {
                  const translation = post.translations[0];
                  return (
                    <tr key={post.id} className="hover:bg-slate-700/30 transition-colors">
                      <td className="px-6 py-4">
                        <div>
                          <div className="font-medium text-slate-100">
                            {translation?.title || 'Sense títol'}
                          </div>
                          <div className="text-sm text-slate-500">/{post.slug}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="rounded-full bg-purple-500/20 px-3 py-1 text-xs text-purple-300">
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
                      <td className="px-6 py-4 text-slate-400">{post.viewCount}</td>
                      <td className="px-6 py-4 text-sm text-slate-400">
                        {new Date(post.createdAt).toLocaleDateString('es-ES')}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() =>
                              (window.location.href = `/admin/blog/edit/${post.id}`)
                            }
                            type="button"
                            className="rounded-lg p-2 text-cyan-400 hover:bg-slate-700/50 transition-colors"
                            title="Editar"
                          >
                            <PencilIcon className="h-5 w-5" />
                          </button>
                          <button
                            onClick={() => handleDelete(post.id)}
                            type="button"
                            className="rounded-lg p-2 text-rose-400 hover:bg-slate-700/50 transition-colors"
                            title="Eliminar"
                          >
                            <TrashIcon className="h-5 w-5" />
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
                className="rounded-xl border border-slate-600/50 bg-slate-700/50 px-4 py-2 text-slate-200 disabled:opacity-50 hover:bg-slate-600/50 transition-colors"
              >
                Anterior
              </button>
              <span className="flex items-center px-4 text-slate-400">
                Página {page} de {totalPages}
              </span>
              <button
                onClick={() => setPage(page + 1)}
                disabled={page === totalPages}
                type="button"
                className="rounded-xl border border-slate-600/50 bg-slate-700/50 px-4 py-2 text-slate-200 disabled:opacity-50 hover:bg-slate-600/50 transition-colors"
              >
                Siguiente
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

