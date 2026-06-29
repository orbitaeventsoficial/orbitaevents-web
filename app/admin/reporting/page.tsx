import { redirect } from 'next/navigation';

// Fusionat al Centre econòmic (#1224): la rendibilitat/reporting viu ara a la pestanya
// «Rendibilitat» d'/admin/economia. Redirigim per no trencar enllaços antics.
export default function ReportingPage() {
  redirect('/admin/economia?tab=rendibilitat');
}
