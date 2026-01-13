// app/admin/ressenyes/page.tsx
import { redirect } from 'next/navigation';

export default function ReviewsRedirectPage() {
  redirect('/admin/google-reviews');
}
