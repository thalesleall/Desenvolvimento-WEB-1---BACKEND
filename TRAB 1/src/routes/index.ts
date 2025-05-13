import { FastifyInstance } from 'fastify';

export async function registerRoutes(app: FastifyInstance) {
  app.get('/', async () => {
    return { message: 'API protegida e rodando ✅' };
  });
}
