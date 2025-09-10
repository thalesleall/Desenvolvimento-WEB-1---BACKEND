// product.route.ts - Rotas para CRUD de produtos
// Este arquivo define todas as rotas relacionadas a produtos (criar, listar, buscar, atualizar, deletar).

import { FastifyInstance, FastifyPluginOptions, FastifyRequest, FastifyReply } from 'fastify';
import fp from 'fastify-plugin';
import moment from 'moment';
import { WithId, Collection, ObjectId } from 'mongodb';
import { Product } from '../interfaces/product.interface';

// --- Tipos auxiliares para requisições ---
// Payload para criar produto (sem _id e DataCadastro)
type CreateProductPayload = Omit<Product, '_id' | 'DataCadastro'>;
type CreateProductRequest = FastifyRequest<{ Body: CreateProductPayload }>;
// Payload para atualizar produto (todos os campos opcionais)
type UpdateProductPayload = Partial<Omit<Product, '_id' | 'DataCadastro'>>;
type UpdateProductRequest = FastifyRequest<{ Params: { id: string }; Body: UpdateProductPayload }>;
// Requisições com parâmetro :id ou :identifier
type RequestWithIdParam = FastifyRequest<{ Params: { id: string } }>;
type RequestWithIdentifierParam = FastifyRequest<{ Params: { identifier: string } }>;

// --- Schemas para validação e documentação Swagger ---
// Schema de criação de produto
const createProductSchema = {
    body: {
        type: 'object',
        required: ['Nome', 'Descrição', 'Cor', 'Peso', 'Tipo', 'Preço'],
        properties: {
            Nome: { type: 'string', minLength: 1 },
            Descrição: { type: 'string' },
            Cor: { type: 'string' },
            Peso: { type: 'string' },
            Tipo: { type: 'string' },
            Preço: { type: 'number', minimum: 0 },
        },
        additionalProperties: false,
    },
    response: {
        201: {
            type: 'object',
            properties: {
                _id: { type: 'string' },
                Nome: { type: 'string' },
                Descrição: { type: 'string' },
                Cor: { type: 'string' },
                Peso: { type: 'string' },
                Tipo: { type: 'string' },
                Preço: { type: 'number' },
                DataCadastro: { type: 'string', format: 'date-time' },
            }
        }
    }
};
// Schema para parâmetro :id
const idParamSchema = {
    params: {
        type: 'object',
        required: ['id'],
        properties: {
            id: {
                type: 'string',
                pattern: '^[0-9a-fA-F]{24}$'
            }
        }
    }
};
// Schema para parâmetro :identifier
const identifierParamSchema = {
    params: {
        type: 'object',
        required: ['identifier'],
        properties: {
            identifier: { type: 'string', minLength: 1 }
        }
    }
}
// Schema para atualização de produto
const updateProductSchema = {
    ...idParamSchema,
    body: {
        type: 'object',
        properties: {
            Nome: { type: 'string', minLength: 1 },
            Descrição: { type: 'string' },
            Cor: { type: 'string' },
            Peso: { type: 'string' },
            Tipo: { type: 'string' },
            Preço: { type: 'number', minimum: 0 },
        },
        additionalProperties: false,
        minProperties: 1
    },
    response: {
        200: {
            type: 'object',
            properties: {
                 _id: { type: 'string' },
                Nome: { type: 'string' },
                Descrição: { type: 'string' },
                Cor: { type: 'string' },
                Peso: { type: 'string' },
                Tipo: { type: 'string' },
                Preço: { type: 'number' },
                DataCadastro: { type: 'string', format: 'date-time' },
            }
        },
        404: {
             type: 'object',
             properties: { error: { type: 'string' }}
        }
    }
};
// Schema para resposta de busca de produto
const productResponseSchema = {
    type: 'object',
    properties: {
        _id: { type: 'string' },
        Nome: { type: 'string' },
        Descrição: { type: 'string' },
        Cor: { type: 'string' },
        Peso: { type: 'string' },
        Tipo: { type: 'string' },
        Preço: { type: 'number' },
        DataCadastro: { type: 'string', format: 'date-time' },
    }
};

/**
 * Plugin de rotas de produtos.
 *
 * Rotas disponíveis:
 *   POST   /newproduct      - Cria um novo produto
 *   GET    /products        - Lista todos os produtos
 *   GET    /:identifier     - Busca produto por ID ou Nome
 *   PUT    /:id             - Atualiza produto por ID
 *   DELETE /:id             - Remove produto por ID
 *
 * Exemplos de uso estão na documentação Swagger em /docs
 */
async function productRoutes(fastify: FastifyInstance, options: FastifyPluginOptions) {
    // Coleção de produtos do MongoDB
    const productsCollection: Collection<Product> = fastify.mongo.db.collection('products');

    // -------- Rota para Criar Novo Produto (POST /newproduct) --------
    fastify.post('/newproduct', { schema: createProductSchema }, async (request: CreateProductRequest, reply: FastifyReply) => {
        try {
            const productData = request.body;

            // Usar Product diretamente, mas omitindo _id antes da inserção
            const newProductData: Omit<Product, '_id'> = {
                ...productData,
                Preço: Number(productData.Preço),
                DataCadastro: moment().toDate(), // Data atual
            };

            const result = await productsCollection.insertOne(newProductData);

            // Construir o produto criado completo para retorno
            const createdProduct: Product = {
                _id: result.insertedId, // Adiciona o _id retornado
                ...newProductData // Adiciona os outros dados
            };

            reply.code(201).send(createdProduct);

        } catch (error) {
            request.log.error(error, 'Erro ao criar produto');
            reply.code(500).send({ error: 'Erro interno do servidor ao criar produto' });
        }
    });

    // -------- Rota para Listar Todos os Produtos (GET /products) --------
    fastify.get('/products', { schema: { response: { 200: { type: 'array', items: productResponseSchema } } } }, async (request: FastifyRequest, reply: FastifyReply) => {
        try {
            // find().toArray() retorna WithId<Document>[], que é compatível com Product[] se os campos baterem
            const products = await productsCollection.find({}).toArray();
            reply.send(products);
        } catch (error) {
            request.log.error(error, 'Erro ao buscar produtos');
            reply.code(500).send({ error: 'Erro interno do servidor ao buscar produtos' });
        }
    });

    // -------- Rota para Buscar Produto por ID ou Nome (GET /:identifier) --------
    fastify.get('/:identifier', { schema: { ...identifierParamSchema, response: { 200: productResponseSchema, 404: { type: 'object', properties: { error: {type: 'string'} }} } } }, async (request: RequestWithIdentifierParam, reply: FastifyReply) => {
        const { identifier } = request.params;
        let product: Product | null = null;

        try {
            // Tenta buscar por ObjectId se o identificador for um formato válido
            if (ObjectId.isValid(identifier)) {
                 request.log.info(`Tentando buscar produto por ID: ${identifier}`);
                product = await productsCollection.findOne({ _id: new ObjectId(identifier) });
            }

            // Se não encontrou por ID (ou não era um ID válido), tenta buscar por Nome
            if (!product) {
                 request.log.info(`Não encontrado por ID, tentando buscar produto por Nome: ${identifier}`);
                // Busca por Nome (case-sensitive por padrão)
                product = await productsCollection.findOne({ Nome: identifier });
                // Para busca case-insensitive:
                // product = await productsCollection.findOne({ Nome: { $regex: `^${identifier}$`, $options: 'i' } });
            }

            if (!product) {
                request.log.warn(`Produto não encontrado com identificador: ${identifier}`);
                return reply.code(404).send({ error: 'Produto não encontrado' });
            }

            request.log.info(`Produto encontrado: ${product._id}`);
            reply.send(product);

        } catch (error) {
            request.log.error(error, `Erro ao buscar produto com identificador: ${identifier}`);
            reply.code(500).send({ error: 'Erro interno do servidor ao buscar produto' });
        }
    });


    // -------- Rota para Atualizar Produto por ID (PUT /:id) --------
    fastify.put('/:id', { schema: updateProductSchema }, async (request: UpdateProductRequest, reply: FastifyReply) => {
        const { id } = request.params;
        const updateDataFromBody = request.body; // Renomeado para clareza

        try {
            const objectId = new ObjectId(id);

            // Inicializa o objeto que será usado no $set
            const updatePayload: UpdateProductPayload = {};

            // Itera sobre as chaves permitidas em UpdateProductPayload
            // (Nome, Descrição, Cor, Peso, Tipo, Preço)
            (Object.keys(updateDataFromBody) as Array<keyof UpdateProductPayload>).forEach(key => {
                // Verifica se a chave realmente existe no corpo da requisição
                // e se o valor não é undefined (o schema deve cuidar de tipos errados)
                if (updateDataFromBody[key] !== undefined) {
                    // Se a chave for 'Preço', converte para número
                    if (key === 'Preço') {
                        const priceValue = Number(updateDataFromBody[key]);
                        if (!isNaN(priceValue)) {
                            updatePayload[key] = priceValue;
                        } else {
                            // Lida com Preço inválido - pode logar, ignorar, ou retornar erro
                            request.log.warn(`Valor de Preço inválido fornecido para ${key}: ${updateDataFromBody[key]}`);
                        }
                    } else {
                        // Para outras chaves, atribui diretamente
                        // O tipo de updateDataFromBody[key] já deve ser compatível com updatePayload[key]
                        updatePayload[key] = updateDataFromBody[key] as any; // Usar 'as any' aqui é um "escape hatch"
                                                                           // O ideal seria não precisar, mas se o erro persistir,
                                                                           // pode ser uma questão de complexidade de tipos.
                                                                           // Vamos tentar sem 'as any' primeiro.
                        // TENTATIVA SEM 'as any':
                        // updatePayload[key] = updateDataFromBody[key];
                    }
                }
            });


            if (Object.keys(updatePayload).length === 0) {
                return reply.code(400).send({ error: 'Nenhum campo válido fornecido para atualização ou campos inválidos.' });
            }

            const result = await productsCollection.updateOne(
                { _id: objectId },
                { $set: updatePayload } // Passa o objeto construído para $set
            );

            if (result.matchedCount === 0) {
                return reply.code(404).send({ error: 'Produto não encontrado para atualização.' });
            }

            if (result.modifiedCount === 0 && result.matchedCount === 1) {
                 request.log.info(`Produto ${id} encontrado, mas nenhum campo foi modificado.`);
            } else {
                 request.log.info(`Produto ${id} atualizado com sucesso.`);
            }

            const updatedProduct = await productsCollection.findOne({ _id: objectId });
             if (!updatedProduct) {
                  return reply.code(404).send({ error: 'Produto não encontrado após a atualização.' });
             }

            reply.send(updatedProduct);

        } catch (error) {
            request.log.error(error, `Erro ao atualizar produto com ID: ${id}`);
            reply.code(500).send({ error: 'Erro interno do servidor ao atualizar produto' });
        }
    });

    // -------- Rota para Deletar Produto por ID (DELETE /:id) --------
    fastify.delete('/:id', { schema: { ...idParamSchema, response: { 200: { type: 'object', properties: { message: { type: 'string'}}}, 404: { type: 'object', properties: { error: { type: 'string' }}} } } }, async (request: RequestWithIdParam, reply: FastifyReply) => {
        const { id } = request.params;

        // O schema já valida o formato do ID
        // if (!ObjectId.isValid(id)) {
        //     return reply.code(400).send({ error: 'ID inválido fornecido.' });
        // }

        try {
            const objectId = new ObjectId(id);
            const result = await productsCollection.deleteOne({ _id: objectId });

            if (result.deletedCount === 0) {
                return reply.code(404).send({ error: 'Produto não encontrado para exclusão.' });
            }

            request.log.info(`Produto ${id} excluído com sucesso.`);
            // Retorna 200 OK com uma mensagem em vez de 204 No Content para dar feedback
            reply.send({ message: 'Produto excluído com sucesso.' });

        } catch (error) {
            request.log.error(error, `Erro ao excluir produto com ID: ${id}`);
            reply.code(500).send({ error: 'Erro interno do servidor ao excluir produto' });
        }
    });

}

// Exporta o plugin de rotas usando fastify-plugin
export default fp(productRoutes);