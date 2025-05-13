import Fastify from 'fastify';
import { registerSecurity } from './plugins/security';
import { registerRoutes } from '@routes/index';

export function buildApp() {
  const app = Fastify({
    logger: true,
  });

  // Plugins de segurança
  registerSecurity(app);

  // Rotas
  registerRoutes(app);

  return app;
}
