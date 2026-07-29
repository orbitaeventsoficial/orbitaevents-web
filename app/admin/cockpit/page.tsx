import { redirect } from 'next/navigation';

// Fusionat al Centre econòmic (#1224): el contingut de tresoreria/previsió viu ara a les
// pestanyes d'/admin/economia. Redirigim per no trencar enllaços antics.
export default function CockpitPage() {
  redirect('/admin/economia?tab=tresoreria');
}
