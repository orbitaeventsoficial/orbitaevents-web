// app/admin/bookings/new/page.tsx
import { redirect } from 'next/navigation';

export default function BookingsNewRedirectPage() {
  redirect('/admin/bookings');
}
