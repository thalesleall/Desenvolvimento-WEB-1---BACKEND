// src/server.ts
import Fastify from 'fastify';
import dotenv from 'dotenv';
import mongoPlugin from './plugins/mongo';
import productRoutes from './routes/product.route';

dotenv.config();

const fastify = Fastify({ logger: true });

// 1. Registrar Plugins Essenciais
fastify.register(mongoPlugin);

// 2. Registrar Módulos de Rotas
// GARANTA QUE ESTA LINHA SÓ APARECE UMA VEZ E TEM O PREFIXO
fastify.register(productRoutes, { prefix: '/products' });

// 3. Definir Rotas Globais (como a raiz)
// GARANTA QUE ESTA DEFINIÇÃO SÓ APARECE UMA VEZ
fastify.get('/', async (request, reply) => {
  return { hello: 'world', message: 'API de Produtos' };
});
// REMOVA QUALQUER OUTRA fastify.get('/') QUE POSSA ESTAR AQUI

// Função para iniciar o servidor
const start = async () => {
  try {
    const port = parseInt(process.env.PORT || '3000', 10);
    await fastify.listen({ port: port, host: '0.0.0.0' });
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();