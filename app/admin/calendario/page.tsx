import CalendarMonthClient from './CalendarMonthClient';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Calendari d’ocupació | Òrbita Admin',
};

export default function CalendarioPage() {
  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Calendari d&apos;ocupació
          </h1>
          <p className="mt-1 text-sm">
            Vista mensual de reserves i dies bloquejats.
          </p>
        </div>
      </header>

      <CalendarMonthClient />
    </div>
  );
}
