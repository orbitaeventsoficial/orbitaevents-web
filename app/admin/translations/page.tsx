// app/admin/translations/page.tsx
import { redirect } from 'next/navigation';

export default function TranslationsRedirectPage() {
  redirect('/admin/text-manager');
}
