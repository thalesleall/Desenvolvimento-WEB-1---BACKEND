// app.ts - Função principal para construir a aplicação Fastify
// Este arquivo monta a aplicação, registra plugins de segurança e rotas principais.
// Use esta função para criar uma instância do servidor para testes ou inicialização.

import Fastify from 'fastify';
import { registerSecurity } from './plugins/security';
import { registerRoutes } from '@routes/index';

/**
 * Cria e configura uma instância do Fastify.
 * Registra plugins de segurança e rotas principais.
 * @returns {FastifyInstance} Instância configurada do Fastify
 */
export function buildApp() {
  const app = Fastify({
    logger: true, // Ativa logs detalhados no console
  });

  // Plugins de segurança (CORS, Helmet, Rate Limit)
  registerSecurity(app);

  // Rotas principais (ex: rota raiz)
  registerRoutes(app);

  return app;
}
