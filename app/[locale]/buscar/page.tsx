// app/[locale]/buscar/page.tsx
import BuscarClient from './client';

export const dynamic = 'force-dynamic';

export default function BuscarPage() {
  return <BuscarClient />;
}
