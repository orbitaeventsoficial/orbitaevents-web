import { AdminPage } from '../components/AdminPage';
import CostCalculatorClient from './CostCalculatorClient';

export const metadata = {
  title: 'Calculadora de costos | Òrbita Admin',
};

export default function CostCalculatorPage() {
  return (
    <AdminPage
      title="Calculadora de costos"
      subtitle="Simula costos interns; els pressupostos client-facing viuen a Pressupostos"
    >
      <CostCalculatorClient />
    </AdminPage>
  );
}
