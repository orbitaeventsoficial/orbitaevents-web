import { Metadata } from 'next';
import { SITE_CONFIG } from '@/config/site-config';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Términos y Condiciones | Òrbita Events',
  description: 'Términos y condiciones de uso de los servicios de Òrbita Events.',
  robots: { index: true, follow: true },
};

export default function TerminosPage() {
  const { business } = SITE_CONFIG;
  
  return (
    <main className="min-h-screen bg-bg-main py-20">
      <div className="container mx-auto px-4 max-w-4xl">
        <h1 className="text-4xl font-bold text-white mb-8">Términos y Condiciones</h1>
        
        <div className="prose prose-invert prose-gold max-w-none space-y-8 text-white/80">
          <p className="text-lg">
            Última actualización: {new Date().toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}
          </p>

          <section>
            <h2 className="text-2xl font-semibold text-white">1. Identificación</h2>
            <p>
              Estos términos y condiciones regulan el uso de los servicios ofrecidos por:
            </p>
            <ul className="list-none space-y-2 mt-4">
              <li><strong>Empresa:</strong> {business.legalName}</li>
              <li><strong>Ubicación:</strong> {business.address.city}, {business.address.region}, {business.address.country}</li>
              <li><strong>Contacto:</strong> {business.email}</li>
            </ul>
            <p className="text-sm text-white/60 mt-2">Para datos fiscales completos, contactar por email.</p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white">2. Servicios</h2>
            <p>
              Òrbita Events ofrece servicios de DJ, iluminación, efectos especiales, tematización 
              y producción técnica para eventos como bodas, fiestas privadas, eventos corporativos 
              y celebraciones.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white">3. Reservas y Pagos</h2>
            <h3 className="text-xl font-medium text-white mt-4">3.1 Proceso de Reserva</h3>
            <ul className="list-disc pl-6 space-y-2">
              <li>Solicitud de presupuesto personalizado</li>
              <li>Aceptación del presupuesto por parte del cliente</li>
              <li>Pago de la señal para confirmar la reserva</li>
              <li>Firma del contrato de servicios</li>
            </ul>

            <h3 className="text-xl font-medium text-white mt-4">3.2 Condiciones de Pago</h3>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Señal:</strong> 30% del total para confirmar la reserva</li>
              <li><strong>Resto:</strong> El día del evento o según acuerdo</li>
              <li><strong>Métodos:</strong> Transferencia bancaria, Bizum, efectivo</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white">4. Cancelaciones</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Más de 30 días antes:</strong> Devolución del 50% de la señal</li>
              <li><strong>Entre 15-30 días:</strong> Sin devolución de la señal</li>
              <li><strong>Menos de 15 días:</strong> Cobro del 100% del servicio</li>
              <li><strong>Fuerza mayor:</strong> Se acordarán condiciones especiales</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white">5. Obligaciones del Cliente</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>Proporcionar información veraz sobre el evento</li>
              <li>Garantizar acceso al lugar del evento para montaje</li>
              <li>Disponer de suministro eléctrico adecuado</li>
              <li>Informar de cualquier cambio con antelación</li>
              <li>Cumplir con los pagos acordados</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white">6. Obligaciones de Òrbita Events</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>Prestar los servicios contratados con profesionalidad</li>
              <li>Disponer de equipo técnico en perfecto estado</li>
              <li>Contar con equipamiento de respaldo</li>
              <li>Cumplir con los horarios acordados</li>
              <li>Disponer de seguro de responsabilidad civil</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white">7. Limitación de Responsabilidad</h2>
            <p>
              Òrbita Events no será responsable de:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Cortes de suministro eléctrico ajenos a nuestro control</li>
              <li>Daños causados por condiciones meteorológicas adversas</li>
              <li>Incidencias causadas por terceros</li>
              <li>Eventos de fuerza mayor</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white">8. Propiedad Intelectual</h2>
            <p>
              Las fotografías y vídeos realizados durante los eventos podrán ser utilizados por 
              Òrbita Events con fines promocionales, salvo indicación expresa en contrario por 
              parte del cliente.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white">9. Resolución de Conflictos</h2>
            <p>
              Para cualquier controversia derivada de estos términos, las partes se someten 
              a los Juzgados y Tribunales de {business.address.city}, renunciando a cualquier 
              otro fuero que pudiera corresponderles.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white">10. Contacto</h2>
            <p>
              Para consultas sobre estos términos:
            </p>
            <ul className="list-none space-y-2 mt-4">
              <li>📧 Email: <a href={`mailto:${business.email}`} className="text-oe-gold hover:underline">{business.email}</a></li>
              <li>📱 Teléfono: <a href={`tel:${business.phone}`} className="text-oe-gold hover:underline">{business.phoneDisplay}</a></li>
            </ul>
          </section>
        </div>
      </div>
    </main>
  );
}
