/**
 * REDIRECT: /packs → /opiniones
 * La página de packs ha sido movida a opiniones
 */

import { redirect } from 'next/navigation';


export default function PacksRedirect() {
  redirect('/opiniones');
}
