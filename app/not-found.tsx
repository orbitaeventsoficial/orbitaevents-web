// app/not-found.tsx - Global 404 (fuera de locale routing)
// Este archivo DEBE exportar su propio HTML completo porque está fuera del [locale] layout
// y el root layout usa componentes que requieren next-intl

import caMessages from '@/messages/ca.json';
import { SITE_CONFIG } from '@/app/config/site-config';

export default function NotFound() {
  const t = (caMessages as Record<string, any>).notFound || {};

  return (
    <html lang="ca">
      <head>
        <title>{`404 - ${t.title} | ${SITE_CONFIG.business.name}`}</title>
        <meta name="robots" content="noindex" />
        <style>{`
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: #0a0a0a;
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
          }
          .container {
            max-width: 42rem;
            text-align: center;
            color: white;
            padding: 1rem;
          }
          .code {
            font-size: 9rem;
            font-weight: 900;
            color: rgba(215, 184, 110, 0.2);
            margin-bottom: 1rem;
            line-height: 1;
          }
          .bar {
            width: 6rem;
            height: 0.25rem;
            background: #d7b86e;
            margin: 0 auto 2rem;
            border-radius: 9999px;
          }
          h2 {
            font-size: 2.5rem;
            font-weight: 900;
            margin-bottom: 1rem;
          }
          p {
            font-size: 1.25rem;
            color: rgba(255, 255, 255, 0.6);
            margin-bottom: 2rem;
            line-height: 1.75;
          }
          .btn {
            display: inline-flex;
            align-items: center;
            gap: 0.5rem;
            padding: 1rem 2rem;
            background: #d7b86e;
            color: #000;
            font-weight: 700;
            border-radius: 0.75rem;
            text-decoration: none;
            font-size: 1.125rem;
            transition: transform 0.2s, box-shadow 0.2s;
          }
          .btn:hover {
            transform: scale(1.05);
            box-shadow: 0 0 30px rgba(215, 184, 110, 0.5);
          }
          @media (max-width: 640px) {
            .code { font-size: 5rem; }
            h2 { font-size: 1.75rem; }
            p { font-size: 1rem; }
          }
        `}</style>
      </head>
      <body>
        <div className="container">
          <div className="code">404</div>
          <div className="bar" />
          <h2>{t.title}</h2>
          <p>{t.description}</p>
          <a href="/" className="btn">
            {t.backToHome}
          </a>
        </div>
      </body>
    </html>
  );
}
