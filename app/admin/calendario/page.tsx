import CalendarMonthClient from './CalendarMonthClient';
import { AdminPage } from '../components/AdminPage';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: "Calendari d'ocupacio | Orbita Admin",
};

export default function CalendarioPage() {
  return (
    <AdminPage
      title="Calendari d'ocupaci\u00f3"
      subtitle="Vista mensual de reserves i dies bloquejats."
    >
      <CalendarMonthClient />
    </AdminPage>
  );
}
