'use client';

import { AdminPage } from '../../components/AdminPage';
import BlogEditorForm from '../BlogEditorForm';

export default function NewBlogPostPage() {
  return (
    <AdminPage
      title="Nou post"
      subtitle="Crea un nou article per al blog"
      back={{ href: '/admin/blog', label: 'Blog' }}
    >
      <BlogEditorForm mode="create" />
    </AdminPage>
  );
}
