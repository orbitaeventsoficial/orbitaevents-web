import { Metadata } from 'next';
import { SITE_CONFIG } from '@/config/site-config';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Aviso Legal | Òrbita Events',
  description: 'Aviso legal e información corporativa de Òrbita Events.',
  robots: { index: true, follow: true },
};

export default function AvisoLegalPage() {
  const { business } = SITE_CONFIG;
  
  return (
    <main className="min-h-screen bg-bg-main py-20">
      <div className="container mx-auto px-4 max-w-4xl">
        <h1 className="text-4xl font-bold text-white mb-8">Aviso Legal</h1>
        
        <div className="prose prose-invert prose-gold max-w-none space-y-8 text-white/80">
          <section>
            <h2 className="text-2xl font-semibold text-white">1. Datos Identificativos</h2>
            <p>
              En cumplimiento del deber de información establecido en la Ley 34/2002 de Servicios 
              de la Sociedad de la Información y el Comercio Electrónico (LSSI-CE), se facilitan 
              los siguientes datos:
            </p>
            <ul className="list-none space-y-2 mt-4 bg-white/5 p-6 rounded-xl">
              <li><strong className="text-white">Titular:</strong> {business.legalName}</li>
              <li><strong className="text-white">Ubicación:</strong> {business.address.city}, {business.address.region}, {business.address.country}</li>
              <li><strong className="text-white">Email:</strong> <a href={`mailto:${business.email}`} className="text-oe-gold hover:underline">{business.email}</a></li>
              <li><strong className="text-white">Teléfono:</strong> <a href={`tel:${business.phone}`} className="text-oe-gold hover:underline">{business.phoneDisplay}</a></li>
              <li><strong className="text-white">Sitio web:</strong> <a href="https://orbitaevents.com" className="text-oe-gold hover:underline">orbitaevents.com</a></li>
              <li className="text-white/60 text-sm mt-4">Para datos fiscales completos (NIF, dirección), contactar por email.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white">2. Objeto</h2>
            <p>
              El presente sitio web tiene por objeto facilitar información sobre los servicios 
              de DJ, iluminación, efectos especiales y producción de eventos que ofrece {business.name}, 
              así como permitir el contacto con potenciales clientes.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white">3. Condiciones de Uso</h2>
            <p>
              El acceso a este sitio web es gratuito y no requiere suscripción o registro previo. 
              No obstante, el uso de determinados servicios puede requerir la cumplimentación de 
              formularios de contacto.
            </p>
            <p className="mt-4">
              El usuario se compromete a hacer un uso adecuado de los contenidos y servicios 
              ofrecidos, absteniéndose de:
            </p>
            <ul className="list-disc pl-6 space-y-2 mt-4">
              <li>Realizar actividades ilícitas o contrarias a la buena fe</li>
              <li>Difundir contenidos delictivos, violentos, pornográficos o discriminatorios</li>
              <li>Intentar acceder a áreas restringidas del sistema</li>
              <li>Introducir virus o programas maliciosos</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white">4. Propiedad Intelectual e Industrial</h2>
            <p>
              Todos los contenidos de este sitio web, incluyendo textos, fotografías, gráficos, 
              imágenes, iconos, tecnología, software, diseño gráfico y código fuente, son propiedad 
              de {business.name} o de terceros que han autorizado su uso.
            </p>
            <p className="mt-4">
              Queda prohibida la reproducción, distribución, transformación o comunicación pública 
              de dichos contenidos sin autorización expresa del titular.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white">5. Exclusión de Responsabilidad</h2>
            <p>{business.name} no se hace responsable de:</p>
            <ul className="list-disc pl-6 space-y-2 mt-4">
              <li>Errores u omisiones en los contenidos</li>
              <li>Falta de disponibilidad del sitio web</li>
              <li>Transmisión de virus o programas maliciosos</li>
              <li>Uso ilícito o negligente por parte de los usuarios</li>
              <li>Contenidos de sitios web enlazados</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white">6. Enlaces</h2>
            <p>
              Este sitio web puede contener enlaces a páginas externas. {business.name} no se 
              responsabiliza del contenido, políticas de privacidad o prácticas de dichos sitios 
              web de terceros.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white">7. Legislación Aplicable</h2>
            <p>
              El presente aviso legal se rige por la legislación española. Para cualquier 
              controversia que pudiera derivarse del acceso o uso de este sitio web, las partes 
              se someten a los Juzgados y Tribunales de {business.address.city}.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white">8. Modificaciones</h2>
            <p>
              {business.name} se reserva el derecho de modificar el presente aviso legal en 
              cualquier momento. Las modificaciones entrarán en vigor desde su publicación en 
              el sitio web.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white">9. Contacto</h2>
            <p>
              Para cualquier consulta relacionada con este aviso legal, puede contactar con 
              nosotros a través de:
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
