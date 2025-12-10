import { Metadata } from 'next';
import Link from 'next/link';
import { SITE_CONFIG } from '@/app/config/site-config';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Política de Privacidad | Òrbita Events',
  description: 'Política de privacidad y protección de datos de Òrbita Events según RGPD y LOPDGDD.',
  robots: { index: true, follow: true },
};

export default function PrivacidadPage() {
  const { business } = SITE_CONFIG;

  return (
    <main className="min-h-screen bg-bg-main py-20">
      <div className="container mx-auto px-4 max-w-4xl">
        <h1 className="text-4xl font-bold text-white mb-8">Política de Privacidad</h1>

        <div className="prose prose-invert prose-gold max-w-none space-y-8 text-white/80">
          <p className="text-lg">
            Última actualización: {new Date().toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}
          </p>

          {/* Banner Portal de Privacitat */}
          <div className="not-prose bg-gradient-to-r from-purple-500/20 to-fuchsia-500/20 border border-purple-500/30 rounded-xl p-6 my-8">
            <h3 className="text-xl font-semibold text-white mb-2">Gestiona tus datos personales</h3>
            <p className="text-white/70 mb-4">
              Puedes ejercer tus derechos RGPD de forma rápida y sencilla desde nuestro Portal de Privacidad.
            </p>
            <Link
              href="/privacitat"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-purple-500 to-fuchsia-500 text-white font-semibold rounded-lg hover:opacity-90 transition-opacity"
            >
              Acceder al Portal
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>

          <section>
            <h2 className="text-2xl font-semibold text-white">1. Responsable del Tratamiento</h2>
            <ul className="list-none space-y-2">
              <li><strong>Empresa:</strong> {business.legalName}</li>
              <li><strong>Ubicación:</strong> {business.address.city}, {business.address.region}, {business.address.country}</li>
              <li><strong>Email:</strong> {business.email}</li>
              <li><strong>Teléfono:</strong> {business.phoneDisplay}</li>
            </ul>
            <p className="text-sm text-white/60 mt-2">Para datos fiscales completos, contactar por email.</p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white">2. Datos que Recopilamos</h2>
            <p>Recopilamos la información que nos proporcionas directamente:</p>

            <h3 className="text-xl font-medium text-white mt-4">2.1. Datos de identificación</h3>
            <ul className="list-disc pl-6 space-y-2">
              <li>Nombre y apellidos</li>
              <li>Correo electrónico</li>
              <li>Número de teléfono</li>
              <li>Ciudad</li>
              <li>Cuenta de Instagram (opcional)</li>
            </ul>

            <h3 className="text-xl font-medium text-white mt-4">2.2. Datos del evento</h3>
            <ul className="list-disc pl-6 space-y-2">
              <li>Tipo de evento</li>
              <li>Fecha y ubicación</li>
              <li>Número de invitados</li>
              <li>Preferencias y solicitudes especiales</li>
            </ul>

            <h3 className="text-xl font-medium text-white mt-4">2.3. Datos de navegación</h3>
            <ul className="list-disc pl-6 space-y-2">
              <li>Dirección IP</li>
              <li>Tipo de navegador</li>
              <li>Páginas visitadas</li>
              <li>Tiempo de navegación</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white">3. Finalidad del Tratamiento</h2>

            <div className="overflow-x-auto mt-4">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="border-b border-white/20">
                    <th className="text-left py-2 px-3 text-white">Finalidad</th>
                    <th className="text-left py-2 px-3 text-white">Base legal</th>
                    <th className="text-left py-2 px-3 text-white">Conservación</th>
                  </tr>
                </thead>
                <tbody className="text-white/70">
                  <tr className="border-b border-white/10">
                    <td className="py-2 px-3">Gestión de contratos y servicios</td>
                    <td className="py-2 px-3">Ejecución contractual</td>
                    <td className="py-2 px-3">5 años (obligación fiscal)</td>
                  </tr>
                  <tr className="border-b border-white/10">
                    <td className="py-2 px-3">Facturación</td>
                    <td className="py-2 px-3">Obligación legal</td>
                    <td className="py-2 px-3">5 años</td>
                  </tr>
                  <tr className="border-b border-white/10">
                    <td className="py-2 px-3">Comunicaciones comerciales</td>
                    <td className="py-2 px-3">Consentimiento</td>
                    <td className="py-2 px-3">Hasta retirada del consentimiento</td>
                  </tr>
                  <tr className="border-b border-white/10">
                    <td className="py-2 px-3">Publicación de testimonios y fotos</td>
                    <td className="py-2 px-3">Consentimiento</td>
                    <td className="py-2 px-3">Hasta retirada del consentimiento</td>
                  </tr>
                  <tr>
                    <td className="py-2 px-3">Análisis y mejora del servicio</td>
                    <td className="py-2 px-3">Interés legítimo</td>
                    <td className="py-2 px-3">2 años</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white">4. Destinatarios de los Datos</h2>
            <p>Tus datos pueden ser comunicados a:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Proveedores de servicios:</strong> Hosting (Vercel), Base de datos (PostgreSQL), Email transaccional</li>
              <li><strong>Administraciones públicas:</strong> Cuando sea legalmente obligatorio</li>
            </ul>
            <p className="mt-4 text-amber-400 font-medium">No vendemos ni cedemos datos a terceros con finalidades comerciales.</p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white">5. Transferencias Internacionales</h2>
            <p>
              Algunos de nuestros proveedores pueden estar ubicados fuera del Espacio Económico Europeo.
              En estos casos, garantizamos que existen garantías adecuadas (Cláusulas Contractuales Tipo,
              adecuación de la Comisión Europea, etc.).
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white">6. Tus Derechos (ARCO-POL)</h2>
            <p>Según el RGPD y la LOPDGDD, tienes derecho a:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Acceso:</strong> Conocer qué datos tenemos sobre ti</li>
              <li><strong>Rectificación:</strong> Corregir datos inexactos o incompletos</li>
              <li><strong>Supresión:</strong> Solicitar que eliminemos tus datos (&quot;derecho al olvido&quot;)</li>
              <li><strong>Oposición:</strong> Oponerte a determinados tratamientos</li>
              <li><strong>Portabilidad:</strong> Recibir tus datos en formato estructurado</li>
              <li><strong>Limitación:</strong> Solicitar que limitemos el tratamiento</li>
            </ul>

            <div className="not-prose bg-white/5 border border-white/10 rounded-xl p-4 mt-6">
              <p className="text-white/80 mb-3">
                <strong className="text-white">Plazo de respuesta:</strong> Responderemos a tu solicitud en un máximo de 30 días.
              </p>
              <div className="flex flex-wrap gap-3">
                <Link
                  href="/privacitat"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-purple-500/20 border border-purple-500/30 text-purple-300 rounded-lg hover:bg-purple-500/30 transition-colors"
                >
                  Portal de Privacidad
                </Link>
                <a
                  href={`mailto:${business.email}?subject=Ejercicio%20de%20derechos%20RGPD`}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 text-white/80 rounded-lg hover:bg-white/10 transition-colors"
                >
                  Contactar por email
                </a>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white">7. Seguridad</h2>
            <p>Implementamos medidas técnicas y organizativas para proteger tus datos:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Cifrado de datos en tránsito (HTTPS/TLS)</li>
              <li>Cifrado de datos en reposo</li>
              <li>Controles de acceso basados en roles</li>
              <li>Registros de auditoría</li>
              <li>Copias de seguridad regulares</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white">8. Cookies</h2>
            <p>
              Utilizamos cookies para mejorar tu experiencia. Consulta nuestra{' '}
              <Link href="/legal/cookies" className="text-oe-gold hover:underline">
                Política de Cookies
              </Link>
              {' '}para más información.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white">9. Menores</h2>
            <p>
              Nuestros servicios no están dirigidos a menores de 14 años. No recopilamos
              conscientemente datos de menores sin consentimiento de los tutores legales.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white">10. Reclamaciones</h2>
            <p>
              Si consideras que hemos vulnerado tus derechos, puedes presentar una reclamación ante
              la Agencia Española de Protección de Datos (AEPD):{' '}
              <a href="https://www.aepd.es" target="_blank" rel="noopener noreferrer" className="text-oe-gold hover:underline">
                www.aepd.es
              </a>
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white">11. Contacto</h2>
            <p>
              Para cualquier consulta sobre esta política de privacidad:
            </p>
            <ul className="list-none space-y-2 mt-4">
              <li>Email: <a href={`mailto:${business.email}`} className="text-oe-gold hover:underline">{business.email}</a></li>
              <li>Teléfono: <a href={`tel:${business.phone}`} className="text-oe-gold hover:underline">{business.phoneDisplay}</a></li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white">12. Actualizaciones</h2>
            <p>
              Podemos actualizar esta política periódicamente. Te informaremos de cambios
              significativos a través de nuestra web o por email.
            </p>
          </section>
        </div>

        {/* CTA al portal */}
        <div className="mt-12 text-center">
          <Link
            href="/privacitat"
            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-500 to-fuchsia-500 text-white font-semibold rounded-xl hover:opacity-90 transition-all"
          >
            Gestiona tus datos personales
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>
      </div>
    </main>
  );
}
