import CalendarMonthClient from './CalendarMonthClient';
import CalendarWeekClient from './CalendarWeekClient';
import CalendarDayClient from './CalendarDayClient';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: "Calendari d'ocupacio | Orbita Admin",
};

export default function CalendarioPage({
  searchParams,
}: {
  searchParams: { view?: string };
}) {
  if (searchParams.view === 'day') return <CalendarDayClient />;
  if (searchParams.view === 'week') return <CalendarWeekClient />;
  return <CalendarMonthClient />;
}
