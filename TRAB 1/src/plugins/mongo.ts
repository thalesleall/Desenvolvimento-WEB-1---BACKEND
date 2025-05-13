import { FastifyInstance, FastifyPluginOptions } from 'fastify';
import fp from 'fastify-plugin';
import { MongoClient, Db } from 'mongodb';

// Estender a interface do FastifyInstance para adicionar os decoradores
declare module 'fastify' {
  interface FastifyInstance {
    mongo: {
      client: MongoClient;
      db: Db;
    }
  }
}

// Opções do Plugin (opcional, caso queira passar configurações)
// interface MongoPluginOptions extends FastifyPluginOptions {
//   // Adicione opções personalizadas aqui se necessário
// }

async function mongoPlugin(fastify: FastifyInstance, options: FastifyPluginOptions) {
  const mongoUri = process.env.MONGODB_URI;
  // Opcional: Pegar o nome do banco de dados do .env ou usar um padrão
  // const dbName = process.env.MONGODB_DB_NAME || 'defaultDbName'; // Descomente se quiser definir aqui

  if (!mongoUri) {
    throw new Error('MONGODB_URI must be defined in your environment variables');
  }

  const client = new MongoClient(mongoUri); // Removido useNewUrlParser e useUnifiedTopology, pois são padrão agora

  try {
    fastify.log.info('Connecting to MongoDB...');
    await client.connect();
    fastify.log.info('MongoDB connected successfully!');

    // O método client.db() sem argumentos usa o banco de dados especificado na URI
    // Se a URI não especificar um banco de dados (ex: /?retryWrites...),
    // você precisará especificar um nome aqui: client.db('seuBancoDeDados')
    // Ou pegar do .env como mostrado acima.
    const db = client.db(); // Tenta usar o DB da URI

    // Decorar a instância do Fastify para tornar o client e o db acessíveis
    fastify.decorate('mongo', { client, db });

    // Adicionar um hook para fechar a conexão quando o Fastify fechar
    fastify.addHook('onClose', async (instance) => {
      fastify.log.info('Closing MongoDB connection...');
      await client.close();
      fastify.log.info('MongoDB connection closed.');
    });

  } catch (err) {
    fastify.log.error('Failed to connect to MongoDB', err);
    // Re-lançar o erro ou tratar de outra forma para impedir que o servidor inicie
    // se a conexão com o banco de dados for crítica.
    throw err;
  }
}

// Exportar o plugin envolvido com fastify-plugin
// O 'skip-override' garante que, se este plugin for registrado várias vezes,
// ele não tente redefinir os decoradores, e o name ajuda no gráfico de dependências.
export default fp(mongoPlugin, {
  name: 'fastify-mongodb',
  // fastify: '4.x' // Opcional: Especifique a versão do Fastify compatível
});