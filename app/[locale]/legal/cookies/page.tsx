import { Metadata } from 'next';
import { SITE_CONFIG } from '@/config/site-config';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Política de Cookies | Òrbita Events',
  description: 'Información sobre el uso de cookies en el sitio web de Òrbita Events.',
  robots: { index: true, follow: true },
};

export default function CookiesPage() {
  const { business } = SITE_CONFIG;
  
  return (
    <main className="min-h-screen bg-bg-main py-20">
      <div className="container mx-auto px-4 max-w-4xl">
        <h1 className="text-4xl font-bold text-white mb-8">Política de Cookies</h1>
        
        <div className="prose prose-invert prose-gold max-w-none space-y-8 text-white/80">
          <p className="text-lg">
            Última actualización: {new Date().toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}
          </p>

          <section>
            <h2 className="text-2xl font-semibold text-white">¿Qué son las cookies?</h2>
            <p>
              Las cookies son pequeños archivos de texto que los sitios web almacenan en tu dispositivo 
              cuando los visitas. Se utilizan ampliamente para hacer que los sitios web funcionen de 
              manera más eficiente y para proporcionar información a los propietarios del sitio.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white">Cookies que utilizamos</h2>
            
            <h3 className="text-xl font-medium text-white mt-6">Cookies técnicas (necesarias)</h3>
            <p>Son esenciales para el funcionamiento del sitio web.</p>
            <div className="overflow-x-auto mt-4">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/20">
                    <th className="text-left py-2 text-white">Nombre</th>
                    <th className="text-left py-2 text-white">Finalidad</th>
                    <th className="text-left py-2 text-white">Duración</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-white/10">
                    <td className="py-2">session_id</td>
                    <td className="py-2">Mantener la sesión del usuario</td>
                    <td className="py-2">Sesión</td>
                  </tr>
                  <tr className="border-b border-white/10">
                    <td className="py-2">cookie_consent</td>
                    <td className="py-2">Guardar preferencias de cookies</td>
                    <td className="py-2">1 año</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <h3 className="text-xl font-medium text-white mt-6">Cookies analíticas</h3>
            <p>Nos ayudan a entender cómo los visitantes interactúan con el sitio.</p>
            <div className="overflow-x-auto mt-4">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/20">
                    <th className="text-left py-2 text-white">Nombre</th>
                    <th className="text-left py-2 text-white">Proveedor</th>
                    <th className="text-left py-2 text-white">Finalidad</th>
                    <th className="text-left py-2 text-white">Duración</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-white/10">
                    <td className="py-2">_ga</td>
                    <td className="py-2">Google Analytics</td>
                    <td className="py-2">Distinguir usuarios</td>
                    <td className="py-2">2 años</td>
                  </tr>
                  <tr className="border-b border-white/10">
                    <td className="py-2">_gid</td>
                    <td className="py-2">Google Analytics</td>
                    <td className="py-2">Distinguir usuarios</td>
                    <td className="py-2">24 horas</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white">¿Cómo gestionar las cookies?</h2>
            <p>
              Puedes configurar tu navegador para rechazar todas las cookies o para que te avise 
              cuando se envía una cookie. Sin embargo, si rechazas las cookies, es posible que 
              algunas partes del sitio no funcionen correctamente.
            </p>
            <ul className="list-disc pl-6 space-y-2 mt-4">
              <li><a href="https://support.google.com/chrome/answer/95647" target="_blank" rel="noopener" className="text-oe-gold hover:underline">Google Chrome</a></li>
              <li><a href="https://support.mozilla.org/es/kb/cookies-informacion-que-los-sitios-web-guardan-en-" target="_blank" rel="noopener" className="text-oe-gold hover:underline">Mozilla Firefox</a></li>
              <li><a href="https://support.apple.com/es-es/guide/safari/sfri11471/mac" target="_blank" rel="noopener" className="text-oe-gold hover:underline">Safari</a></li>
              <li><a href="https://support.microsoft.com/es-es/microsoft-edge/eliminar-las-cookies-en-microsoft-edge-63947406-40ac-c3b8-57b9-2a946a29ae09" target="_blank" rel="noopener" className="text-oe-gold hover:underline">Microsoft Edge</a></li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white">Contacto</h2>
            <p>
              Si tienes preguntas sobre nuestra política de cookies, contacta con nosotros:
            </p>
            <ul className="list-none space-y-2 mt-4">
              <li>📧 Email: <a href={`mailto:${business.email}`} className="text-oe-gold hover:underline">{business.email}</a></li>
            </ul>
          </section>
        </div>
      </div>
    </main>
  );
}
