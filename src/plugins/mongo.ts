// mongo.ts - Plugin para integração com MongoDB usando Fastify
// Este plugin adiciona o client e o db do MongoDB à instância do Fastify.

import { FastifyInstance, FastifyPluginOptions } from 'fastify';
import fp from 'fastify-plugin';
import { MongoClient, Db } from 'mongodb';

// Estende a interface do FastifyInstance para incluir o decorador 'mongo'
declare module 'fastify' {
  interface FastifyInstance {
    mongo: {
      client: MongoClient;
      db: Db;
    }
  }
}

/**
 * Plugin para conectar ao MongoDB e decorar o FastifyInstance.
 *
 * Como usar:
 *   fastify.register(mongoPlugin)
 *   // Depois, acesse via fastify.mongo.client ou fastify.mongo.db
 *
 * O URI do MongoDB deve estar definido em MONGODB_URI no .env
 */
async function mongoPlugin(fastify: FastifyInstance, options: FastifyPluginOptions) {
  const mongoUri = process.env.MONGODB_URI;

  if (!mongoUri) {
    throw new Error('MONGODB_URI must be defined in your environment variables');
  }

  const client = new MongoClient(mongoUri);

  try {
    fastify.log.info('Connecting to MongoDB...');
    await client.connect();
    fastify.log.info('MongoDB connected successfully!');

    // Usa o banco de dados especificado na URI
    const db = client.db();

    // Decora a instância do Fastify para acesso global
    fastify.decorate('mongo', { client, db });

    // Fecha a conexão ao encerrar o servidor
    fastify.addHook('onClose', async (instance) => {
      fastify.log.info('Closing MongoDB connection...');
      await client.close();
      fastify.log.info('MongoDB connection closed.');
    });

  } catch (err) {
    fastify.log.error('Failed to connect to MongoDB', err);
    throw err;
  }
}

// Exporta o plugin usando fastify-plugin
export default fp(mongoPlugin, {
  name: 'fastify-mongodb',
});