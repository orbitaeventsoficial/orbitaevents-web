// app/admin/packs/new/page.tsx
import { redirect } from 'next/navigation';

export default function PacksNewRedirectPage() {
  redirect('/admin/packs');
}
