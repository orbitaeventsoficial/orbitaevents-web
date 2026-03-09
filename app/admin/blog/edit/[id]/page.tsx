'use client';

import { useParams } from 'next/navigation';
import { AdminPage } from '../../../components/AdminPage';
import BlogEditorForm from '../../BlogEditorForm';

export default function EditBlogPostPage() {
  const params = useParams<{ id: string }>();

  return (
    <AdminPage
      title="Editar post"
      subtitle="Actualitza contingut, SEO i estat de publicació"
      back={{ href: '/admin/blog', label: 'Blog' }}
    >
      <BlogEditorForm mode="edit" postId={params?.id} />
    </AdminPage>
  );
}
