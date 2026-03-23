// lib/logger.ts
// Sistema de logging estructurado para Òrbita Events
// Reemplaza todos los console.error/warn/log del proyecto

import { LOGGER_LEVEL_EMOJI } from '@/lib/constants';

type LogLevel = 'error' | 'warn' | 'info' | 'debug';

interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  context?: Record<string, unknown>;
  error?: {
    message: string;
    stack?: string;
    name: string;
  };
}

interface LogOptions {
  context?: Record<string, unknown>;
  sendAlert?: boolean;
}


function formatForConsole(entry: LogEntry): string {
  const emoji = LOGGER_LEVEL_EMOJI[entry.level];
  const time = new Date(entry.timestamp).toLocaleTimeString('ca-ES');
  return `${emoji} [${time}] ${entry.message}`;
}

function createLogEntry(
  level: LogLevel,
  message: string,
  error?: Error,
  context?: Record<string, unknown>
): LogEntry {
  return {
    level,
    message,
    timestamp: new Date().toISOString(),
    context,
    error: error
      ? {
          message: error.message,
          stack: error.stack,
          name: error.name,
        }
      : undefined,
  };
}

// Almacén de logs en memoria
const logStore: LogEntry[] = [];
const MAX_LOGS = 100;

function storeLog(entry: LogEntry): void {
  logStore.push(entry);
  if (logStore.length > MAX_LOGS) logStore.shift();
}

function normalizeError(error: unknown): Error {
  if (error instanceof Error) return error;
  if (typeof error === 'string') return new Error(error);
  if (typeof error === 'object' && error !== null) {
    return new Error(JSON.stringify(error));
  }
  return new Error(String(error));
}

export const log = {
  /**
   * Log de error - Para errores que necesitan atención
   * @example log.error('Error guardando lead', error, { leadId: '123' })
   */
  error: (
    message: string,
    error?: unknown,
    options?: LogOptions
  ): void => {
    const err = error ? normalizeError(error) : undefined;
    const entry = createLogEntry('error', message, err, options?.context);

    // Siempre mostrar en consola
    console.error(formatForConsole(entry), options?.context || '', err || '');

    storeLog(entry);
  },

  /**
   * Log de warning - Para situaciones que podrían ser problemáticas
   * @example log.warn('Rate limit casi alcanzado', { ip: '1.2.3.4', count: 4 })
   */
  warn: (message: string, context?: Record<string, unknown>): void => {
    const entry = createLogEntry('warn', message, undefined, context);
    console.warn(formatForConsole(entry), context || '');

    storeLog(entry);
  },

  /**
   * Log informativo - Para eventos importantes del sistema
   * @example log.info('Nuevo lead creado', { leadId: '123', source: 'web' })
   */
  info: (message: string, context?: Record<string, unknown>): void => {
    const entry = createLogEntry('info', message, undefined, context);
    console.info(formatForConsole(entry), context || '');
    storeLog(entry);
  },

  /**
   * Log de debug - Solo en desarrollo
   * @example log.debug('Request body', { body: parsedData })
   */
  debug: (message: string, context?: Record<string, unknown>): void => {
    if (process.env.NODE_ENV !== 'production') {
      const entry = createLogEntry('debug', message, undefined, context);
      console.debug(formatForConsole(entry), context || '');
    }
  },

  /**
   * Obtener logs almacenados (útil para debugging)
   */
  getLogs: (): LogEntry[] => {
    return [...logStore];
  },

  /**
   * Limpiar logs almacenados
   */
  clearLogs: (): void => {
    logStore.length = 0;
  },
};

export default log;

// Tipos exportados para uso externo
export type { LogEntry, LogLevel, LogOptions };
