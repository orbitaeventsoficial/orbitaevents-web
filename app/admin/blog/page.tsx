'use client';

import { useState, useEffect } from 'react';
import { PencilIcon, TrashIcon, PlusIcon } from '@heroicons/react/24/outline';

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

  useEffect(() => {
    fetchPosts();
  }, [locale, page]);

  const fetchPosts = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/admin/blog?locale=${locale}&page=${page}&limit=20`);
      const data = await res.json();
      setPosts(data.posts || []);
      setTotal(data.pagination?.total || 0);
      setTotalPages(data.pagination?.totalPages || 0);
    } catch (error) {
      console.error('Failed to fetch posts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Estás seguro de que quieres eliminar este post?')) return;

    try {
      const res = await fetch(`/api/admin/blog?id=${id}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        alert('Post eliminado correctamente');
        fetchPosts();
      } else {
        alert('Error al eliminar el post');
      }
    } catch (error) {
      console.error('Failed to delete post:', error);
      alert('Error al eliminar el post');
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
        alert('Error al actualizar el post');
      }
    } catch (error) {
      console.error('Failed to update post:', error);
      alert('Error al actualizar el post');
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
            className="rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-white"
          >
            <option value="es">Español</option>
            <option value="ca">Català</option>
          </select>

          <button
            onClick={() => (window.location.href = '/admin/blog/new')}
            className="flex items-center gap-2 rounded-lg bg-purple-600 px-4 py-2 text-white hover:bg-purple-700"
          >
            <PlusIcon className="h-5 w-5" />
            Nuevo Post
          </button>
        </div>
      </div>

      {loading ? (
        <div className="text-center text-white/60">Cargando...</div>
      ) : posts.length === 0 ? (
        <div className="rounded-lg border border-white/10 bg-white/5 p-12 text-center">
          <p className="text-white/60">No hay posts todavía</p>
          <button
            onClick={() => (window.location.href = '/admin/blog/new')}
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
                  <th className="px-6 py-3 text-left text-sm font-semibold text-white">
                    Título
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-white">
                    Categoría
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-white">
                    Estado
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-white">
                    Visitas
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-white">
                    Fecha
                  </th>
                  <th className="px-6 py-3 text-right text-sm font-semibold text-white">
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
                            className="rounded p-2 text-blue-400 hover:bg-white/5"
                            title="Editar"
                          >
                            <PencilIcon className="h-5 w-5" />
                          </button>
                          <button
                            onClick={() => handleDelete(post.id)}
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
