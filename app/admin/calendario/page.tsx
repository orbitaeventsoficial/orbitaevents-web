import CalendarMonthClient from './CalendarMonthClient';
import CalendarWeekClient from './CalendarWeekClient';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: "Calendari d'ocupacio | Orbita Admin",
};

export default function CalendarioPage({
  searchParams,
}: {
  searchParams: { view?: string };
}) {
  const view = searchParams.view === 'week' ? 'week' : 'month';

  return view === 'week' ? <CalendarWeekClient /> : <CalendarMonthClient />;
}
