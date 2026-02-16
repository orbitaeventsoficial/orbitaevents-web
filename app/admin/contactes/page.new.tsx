// app/admin/contactes/page.tsx
// REDIRECT: /contactes és l'antic nom, ara tot va a /clientes
import { redirect } from 'next/navigation';

export default function ContactesRedirectPage() {
  redirect('/admin/clientes');
}
