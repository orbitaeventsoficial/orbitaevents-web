'use client';

import { AdminPage } from '../../components/AdminPage';
import InventoryItemEditor from '../[id]/InventoryItemEditor';

export default function NewInventoryItemPage() {
  return (
    <AdminPage
      title="Nou element"
      subtitle="Afegeix equipament a l'inventari"
      back={{ href: '/admin/inventory', label: 'Inventari' }}
      className="max-w-3xl"
    >
      <InventoryItemEditor mode="create" />
    </AdminPage>
  );
}
