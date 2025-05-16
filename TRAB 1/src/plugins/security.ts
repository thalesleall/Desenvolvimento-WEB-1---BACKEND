// security.ts - Plugin para registrar middlewares de segurança no Fastify
// Inclui Helmet, CORS e Rate Limit para proteger a API.

import { FastifyInstance } from 'fastify';
import helmet from '@fastify/helmet';
import cors from '@fastify/cors';
import rateLimit from '@fastify/rate-limit';

/**
 * Registra plugins de segurança na instância do Fastify.
 * Inclui Helmet, CORS e Rate Limit.
 *
 * Como usar:
 *   fastify.register(registerSecurity)
 *
 * Recomenda-se usar no início da configuração do app.
 */
export async function registerSecurity(app: FastifyInstance) {
  await app.register(helmet); // Protege contra vulnerabilidades conhecidas
  await app.register(cors, {
    origin: true,
    credentials: true,
  });
  await app.register(rateLimit, {
    max: 100,
    timeWindow: '1 minute',
  });
}
