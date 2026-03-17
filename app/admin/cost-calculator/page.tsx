import { AdminPage } from '../components/AdminPage';
import CostCalculatorClient from './CostCalculatorClient';

export const metadata = {
  title: 'Calculadora de costos | Òrbita Admin',
};

export default function CostCalculatorPage() {
  return (
    <AdminPage
      title="Calculadora de costos"
      subtitle="Construeix pressupostos personalitzats arrossegant components"
    >
      <CostCalculatorClient />
    </AdminPage>
  );
}
