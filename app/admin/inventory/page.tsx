// app/admin/inventory/page.tsx
// Pàgina de gestió d'inventari - delega al client component
import InventoryListClient from './InventoryListClient';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Inventari | Òrbita Admin',
};

export default function InventoryPage() {
  return <InventoryListClient />;
}
