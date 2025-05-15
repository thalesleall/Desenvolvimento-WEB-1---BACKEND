"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// src/server.ts
const fastify_1 = __importDefault(require("fastify"));
const dotenv_1 = __importDefault(require("dotenv"));
const mongo_1 = __importDefault(require("./plugins/mongo"));
const product_route_1 = __importDefault(require("./routes/product.route"));
dotenv_1.default.config();
const fastify = (0, fastify_1.default)({ logger: true });
const swagger = require('@fastify/swagger');
const swaggerUI = require('@fastify/swagger-ui');
fastify.register(swagger, {
    swagger: {
        info: {
            title: 'Minha API',
            description: 'Documentação da API com Swagger',
            version: '1.0.0'
        },
        host: 'localhost:3000',
        schemes: ['http'],
        consumes: ['application/json'],
        produces: ['application/json'],
    }
});
fastify.register(swaggerUI, {
    routePrefix: '/docs',
    uiConfig: {
        docExpansion: 'full',
        deepLinking: false
    },
    staticCSP: true,
    transformSpecification: (swaggerObject, request, reply) => {
        return swaggerObject;
    },
    transformSpecificationClone: true
});
// 1. Registrar Plugins Essenciais
fastify.register(mongo_1.default);
// 2. Registrar Módulos de Rotas
// GARANTA QUE ESTA LINHA SÓ APARECE UMA VEZ E TEM O PREFIXO
fastify.register(product_route_1.default, { prefix: '/products' });
// 3. Definir Rotas Globais (como a raiz)
// GARANTA QUE ESTA DEFINIÇÃO SÓ APARECE UMA VEZ
fastify.get('/', async (request, reply) => {
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
    return { pong: 'pong' };
});
// REMOVA QUALQUER OUTRA fastify.get('/') QUE POSSA ESTAR AQUI
// Função para iniciar o servidor
const start = async () => {
    try {
        const port = parseInt(process.env.PORT || '3000', 10);
        await fastify.listen({ port: port, host: '0.0.0.0' });
    }
    catch (err) {
        fastify.log.error(err);
        process.exit(1);
    }
};
start();
