// server.ts - Ponto de entrada principal da aplicação
// Este arquivo inicializa o servidor Fastify, registra plugins, rotas e configura a documentação Swagger.

import Fastify from 'fastify';
import dotenv from 'dotenv';
import mongoPlugin from './plugins/mongo';
import productRoutes from './routes/product.route';

dotenv.config(); // Carrega variáveis de ambiente do .env

const fastify = Fastify({ logger: true }); // Cria instância do Fastify com logs

// Importa e registra plugins de documentação Swagger
const swagger = require('@fastify/swagger');
const swaggerUI = require('@fastify/swagger-ui');

// Configuração do Swagger para documentação automática da API
fastify.register(swagger, {
  swagger: {
    info: {
      title: 'Api de produtos em TS + Fastify',
      description: 'Documentação da API com Swagger; \n Autor: Thales Vinicius Leal Barcelos \n Codigo: 24740',
      version: '1.0.0'
    },
    host: 'https://desenvolvimento-web-1-backend.onrender.com/',
    schemes: ['http'],
    consumes: ['application/json'],
    produces: ['application/json'],
  }
});

// Configuração da interface visual do Swagger em /docs
fastify.register(swaggerUI, {
  routePrefix: '/documentação',
  uiConfig: {
    docExpansion: 'full',
    deepLinking: false
  },
  staticCSP: true,
  // Tipagem explícita dos parâmetros para evitar erros TS7006
  transformSpecification: (swaggerObject: any, request: import('fastify').FastifyRequest, reply: import('fastify').FastifyReply) => {
    return swaggerObject;
  },
  transformSpecificationClone: true
});

// 1. Registrar plugin de conexão com MongoDB
fastify.register(mongoPlugin);

// 2. Registrar rotas de produtos com prefixo '/products'
fastify.register(productRoutes, { prefix: '/products' });

// 3. Rotas globais (exemplo: raiz e ping)
fastify.get('/', async (request, reply) => {
  // Rota raiz da API
  return { hello: 'world', message: 'API de Produtos' };
});

fastify.get('/ping', {
  schema: {
    description: 'Rota de teste ping',
    tags: ['Teste'],
    summary: 'Ping test',
    response: {
      200: {
        description: 'Resposta de sucesso',
        type: 'object',
        properties: {
          pong: { type: 'string' }
        }
      }
    }
  }
}, async (request, reply) => {
  // Rota de teste para verificar se o servidor está online
  return { pong: 'pong' };
});

// Função para iniciar o servidor na porta definida no .env ou 3000
const start = async () => {
  try {
    const port = parseInt(process.env.PORT || '3000', 10);
    await fastify.listen({ port: port, host: '0.0.0.0' });
    // Após inicialização, acesse http://localhost:3000/docs para ver a documentação Swagger
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();