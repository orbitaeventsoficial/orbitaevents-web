"use client";
// app/error.tsx

import { useEffect } from 'react';
import Link from 'next/link';
import { MessageCircle, Home, RefreshCcw, AlertTriangle } from 'lucide-react';
import { motion } from 'framer-motion';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log error to monitoring service (Sentry, etc)
    console.error('Error caught by error boundary:', error);
  }, [error]);

  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-6 text-center bg-bg-main relative overflow-hidden">
      {/* Background gradient */}
      <div
        className="absolute inset-0 -z-10"
        style={{
          background:
            'radial-gradient(circle at 50% 50%, rgba(239, 68, 68, 0.1), transparent 70%)',
        }}
      />

      <motion.div
        className="max-w-2xl"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
      >
        {/* Icon */}
        <motion.div
          className="w-24 h-24 mx-auto mb-8 rounded-full bg-red-500/10 border-2 border-red-500/30 flex items-center justify-center"
          animate={{ rotate: [0, 10, -10, 0] }}
          transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 2 }}
        >
          <AlertTriangle className="w-12 h-12 text-red-500" />
        </motion.div>

        {/* Title */}
        <h1 className="text-5xl md:text-6xl font-black mb-4 text-white">
          ¡Ups! Algo Salió Mal
        </h1>

        {/* Description */}
        <p className="text-xl text-text-muted mb-8 leading-relaxed">
          {error?.message || 'Error inesperado en la web.'}
          <br />
          <span className="text-oe-gold font-bold">
            Pero tranquilo, tu evento será perfecto. Prometido.
          </span>
        </p>

        {/* Error details (solo en desarrollo) */}
        {process.env.NODE_ENV === 'development' && error?.stack && (
          <details className="mb-8 text-left bg-bg-surface border border-border rounded-xl p-4">
            <summary className="cursor-pointer text-sm font-mono text-text-muted hover:text-white">
              Ver detalles técnicos (solo desarrollo)
            </summary>
            <pre className="mt-4 text-xs text-red-400 overflow-auto max-h-40">
              {error.stack}
            </pre>
          </details>
        )}

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
          <button
            onClick={() => reset()}
            className="oe-btn inline-flex items-center justify-center gap-2 group"
          >
            <RefreshCcw className="w-5 h-5 group-hover:rotate-180 transition-transform duration-500" />
            Intentar de Nuevo
          </button>

          <Link href="/" className="oe-btn inline-flex items-center justify-center gap-2">
            <Home className="w-5 h-5" />
            Volver al Inicio
          </Link>

          <Link
            href="/contacto"
            className="oe-btn-gold inline-flex items-center justify-center gap-2"
          >
            <MessageCircle className="w-5 h-5" />
            Contactar (Ayuda Rápida)
          </Link>
        </div>

        {/* Support info */}
        <p className="text-sm text-text-muted">
          ¿Problema persistente?{' '}
          <Link
            href="/contacto"
            className="text-oe-gold hover:underline"
          >
            Contáctanos a través del formulario
          </Link>
          <br />
          Código error: {error?.digest || 'No disponible'}
        </p>
      </motion.div>
    </main>
  );
}
