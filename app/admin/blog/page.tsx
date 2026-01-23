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
      setFlashMessage({ type: 'error', text: 'Error cargando posts' });
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
        setFlashMessage({ type: 'error', text: 'Error al eliminar el post' });
      }
    } catch (error) {
      log.error('Failed to delete post:', error);
      setFlashMessage({ type: 'error', text: 'Error al eliminar el post' });
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
        setFlashMessage({ type: 'error', text: 'Error al actualizar el post' });
      }
    } catch (error) {
      log.error('Failed to update post:', error);
      setFlashMessage({ type: 'error', text: 'Error al actualizar el post' });
    }
  };

  return (
    <div className="p-6">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Gestión de Blog</h1>
          <p className="mt-2 text-white/60">{total} posts en total</p>
        </div>

        <div className="flex gap-4">
          <select
            value={locale}
            onChange={(e) => setLocale(e.target.value)}
            aria-label="Idioma"
            className="rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-white"
          >
            <option value="es">Español</option>
            <option value="ca">Català</option>
          </select>

          <button
            onClick={() => (window.location.href = '/admin/blog/new')}
            type="button"
            className="flex items-center gap-2 rounded-lg bg-purple-600 px-4 py-2 text-white hover:bg-purple-700"
          >
            <PlusIcon className="h-5 w-5" />
            Nuevo Post
          </button>
        </div>
      </div>

      {flashMessage && (
        <div
          className={`mb-6 rounded-xl border px-4 py-3 text-sm ${
            flashMessage.type === 'success'
              ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-200'
              : 'border-red-500/30 bg-red-500/10 text-red-200'
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
              className="text-xs text-white/60 hover:text-white"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="text-center text-white/60" role="status" aria-live="polite">Cargando...</div>
      ) : posts.length === 0 ? (
        <div className="rounded-lg border border-white/10 bg-white/5 p-12 text-center">
          <p className="text-white/60">No hay posts todavía</p>
          <button
            onClick={() => (window.location.href = '/admin/blog/new')}
            type="button"
            className="mt-4 text-purple-400 hover:text-purple-300"
          >
            Crear el primero
          </button>
        </div>
      ) : (
        <>
          <div className="overflow-hidden rounded-lg border border-white/10 bg-white/5">
            <table className="w-full">
              <thead className="border-b border-white/10 bg-white/5">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-sm font-semibold text-white">
                    Título
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-sm font-semibold text-white">
                    Categoría
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-sm font-semibold text-white">
                    Estado
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-sm font-semibold text-white">
                    Visitas
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-sm font-semibold text-white">
                    Fecha
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-sm font-semibold text-white">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {posts.map((post) => {
                  const translation = post.translations[0];
                  return (
                    <tr key={post.id} className="hover:bg-white/5">
                      <td className="px-6 py-4">
                        <div>
                          <div className="font-medium text-white">
                            {translation?.title || 'Sin título'}
                          </div>
                          <div className="text-sm text-white/60">/{post.slug}</div>
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
                          className={`rounded-full px-3 py-1 text-xs ${
                            post.isPublished
                              ? 'bg-green-500/20 text-green-300'
                              : 'bg-yellow-500/20 text-yellow-300'
                          }`}
                        >
                          {post.isPublished ? 'Publicado' : 'Borrador'}
                        </button>
                      </td>
                      <td className="px-6 py-4 text-white/60">{post.viewCount}</td>
                      <td className="px-6 py-4 text-sm text-white/60">
                        {new Date(post.createdAt).toLocaleDateString('es-ES')}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() =>
                              (window.location.href = `/admin/blog/edit/${post.id}`)
                            }
                            type="button"
                            className="rounded p-2 text-blue-400 hover:bg-white/5"
                            title="Editar"
                          >
                            <PencilIcon className="h-5 w-5" />
                          </button>
                          <button
                            onClick={() => handleDelete(post.id)}
                            type="button"
                            className="rounded p-2 text-red-400 hover:bg-white/5"
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
                className="rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-white disabled:opacity-50"
              >
                Anterior
              </button>
              <span className="flex items-center px-4 text-white/60">
                Página {page} de {totalPages}
              </span>
              <button
                onClick={() => setPage(page + 1)}
                disabled={page === totalPages}
                type="button"
                className="rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-white disabled:opacity-50"
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
