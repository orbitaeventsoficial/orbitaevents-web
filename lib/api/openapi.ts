/**
 * OpenAPI 3.1 Schema Definition
 * Documenta totes les API routes del projecte
 */

export const openAPISchema = {
  openapi: '3.1.0',
  info: {
    title: 'Òrbita Events API',
    version: '1.0.0',
    description: 'API per gestionar events, reserves i configuració del web Òrbita Events',
    contact: {
      name: 'Òrbita Events',
      email: 'info@orbitaevents.com',
      url: 'https://orbitaevents.com',
    },
  },
  servers: [
    {
      url: 'https://orbitaevents.com',
      description: 'Production',
    },
    {
      url: 'http://localhost:3000',
      description: 'Development',
    },
  ],
  tags: [
    { name: 'Public', description: 'APIs públiques sense autenticació' },
    { name: 'Admin', description: 'APIs d\'administració (requereixen auth)' },
    { name: 'Contact', description: 'Formularis de contacte' },
  ],
  paths: {
    '/api/health': {
      get: {
        tags: ['Public'],
        summary: 'Health check',
        description: 'Comprova l\'estat del servidor i la base de dades',
        responses: {
          200: {
            description: 'Servidor saludable',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    status: { type: 'string', enum: ['healthy', 'degraded', 'unhealthy'] },
                    timestamp: { type: 'string', format: 'date-time' },
                    responseTime: { type: 'string' },
                    checks: {
                      type: 'object',
                      properties: {
                        database: {
                          type: 'object',
                          properties: {
                            status: { type: 'string' },
                            latency: { type: 'string' },
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    '/api/contact': {
      post: {
        tags: ['Contact'],
        summary: 'Enviar formulari de contacte',
        description: 'Envia un missatge de contacte. Requereix validació Turnstile.',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['name', 'email', 'message', 'turnstileToken'],
                properties: {
                  name: { type: 'string', minLength: 2, maxLength: 100 },
                  email: { type: 'string', format: 'email' },
                  phone: { type: 'string' },
                  eventType: { type: 'string' },
                  eventDate: { type: 'string', format: 'date' },
                  message: { type: 'string', minLength: 10, maxLength: 5000 },
                  turnstileToken: { type: 'string' },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: 'Missatge enviat correctament',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean' },
                    message: { type: 'string' },
                  },
                },
              },
            },
          },
          400: { description: 'Dades invàlides' },
          429: { description: 'Rate limit excedit' },
        },
      },
    },
    '/api/public/availability': {
      get: {
        tags: ['Public'],
        summary: 'Obtenir disponibilitat',
        description: 'Retorna la disponibilitat de dissabtes pels propers mesos',
        parameters: [
          {
            name: 'months',
            in: 'query',
            schema: { type: 'integer', default: 3 },
            description: 'Nombre de mesos a consultar',
          },
        ],
        responses: {
          200: {
            description: 'Dades de disponibilitat',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    ok: { type: 'boolean' },
                    data: {
                      type: 'object',
                      properties: {
                        nextAvailableDate: { type: 'string', format: 'date', nullable: true },
                        nextAvailableSaturday: { type: 'string', format: 'date', nullable: true },
                        monthlyAvailability: {
                          type: 'array',
                          items: {
                            type: 'object',
                            properties: {
                              month: { type: 'string' },
                              year: { type: 'integer' },
                              availableSaturdays: { type: 'integer' },
                              totalSaturdays: { type: 'integer' },
                            },
                          },
                        },
                        urgencyLevel: { type: 'string', enum: ['low', 'medium', 'high', 'critical'] },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    '/api/public/stats': {
      get: {
        tags: ['Public'],
        summary: 'Obtenir estadístiques públiques',
        description: 'Retorna estadístiques del negoci (events realitzats, valoracions, etc.)',
        responses: {
          200: {
            description: 'Estadístiques',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    ok: { type: 'boolean' },
                    data: {
                      type: 'object',
                      properties: {
                        totalEvents: { type: 'integer' },
                        totalWeddings: { type: 'integer' },
                        yearsExperience: { type: 'string' },
                        averageRating: { type: 'number' },
                        googleRating: { type: 'number', nullable: true },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    '/api/admin/settings': {
      get: {
        tags: ['Admin'],
        summary: 'Obtenir configuració',
        description: 'Retorna tota la configuració del sistema',
        security: [{ basicAuth: [] }, { bearerAuth: [] }],
        responses: {
          200: { description: 'Configuració del sistema' },
          401: { description: 'No autoritzat' },
        },
      },
      patch: {
        tags: ['Admin'],
        summary: 'Actualitzar configuració',
        description: 'Actualitza valors de configuració',
        security: [{ basicAuth: [] }, { bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  key: { type: 'string' },
                  value: { type: 'string' },
                },
              },
            },
          },
        },
        responses: {
          200: { description: 'Configuració actualitzada' },
          401: { description: 'No autoritzat' },
          403: { description: 'CSRF token invàlid' },
        },
      },
    },
    '/api/admin/bookings': {
      get: {
        tags: ['Admin'],
        summary: 'Llistar reserves',
        description: 'Retorna totes les reserves amb filtres opcionals',
        security: [{ basicAuth: [] }, { bearerAuth: [] }],
        parameters: [
          { name: 'status', in: 'query', schema: { type: 'string' } },
          { name: 'from', in: 'query', schema: { type: 'string', format: 'date' } },
          { name: 'to', in: 'query', schema: { type: 'string', format: 'date' } },
        ],
        responses: {
          200: { description: 'Llista de reserves' },
          401: { description: 'No autoritzat' },
        },
      },
      post: {
        tags: ['Admin'],
        summary: 'Crear reserva',
        description: 'Crea una nova reserva',
        security: [{ basicAuth: [] }, { bearerAuth: [] }],
        responses: {
          201: { description: 'Reserva creada' },
          401: { description: 'No autoritzat' },
          403: { description: 'CSRF token invàlid' },
        },
      },
    },
  },
  components: {
    securitySchemes: {
      basicAuth: {
        type: 'http',
        scheme: 'basic',
        description: 'Autenticació bàsica amb ADMIN_USER i ADMIN_PASS',
      },
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        description: 'Token Bearer amb ADMIN_KEY',
      },
    },
  },
};

// Export as JSON for external tools
export function getOpenAPIJSON(): string {
  return JSON.stringify(openAPISchema, null, 2);
}
