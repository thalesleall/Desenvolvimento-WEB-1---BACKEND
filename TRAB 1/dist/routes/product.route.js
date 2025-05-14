"use strict";
// src/routes/product.routes.ts
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fastify_plugin_1 = __importDefault(require("fastify-plugin"));
const moment_1 = __importDefault(require("moment"));
// Adicionar ObjectId e Collection
const mongodb_1 = require("mongodb");
// --- Schemas ---
// Schema de Criação (igual ao anterior)
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
    // Resposta 201 pode ser mais completa, incluindo todos os campos do Product
    response: {
        201: {
            type: 'object',
            properties: {
                _id: { type: 'string' }, // ObjectId é serializado como string
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
// Schema para parâmetros :id (validação de que é uma string com 24 chars hex)
const idParamSchema = {
    params: {
        type: 'object',
        required: ['id'],
        properties: {
            id: {
                type: 'string',
                pattern: '^[0-9a-fA-F]{24}$' // Regex para validar formato de ObjectId
            }
        }
    }
};
// Schema para parâmetros :identifier (apenas valida que é string)
const identifierParamSchema = {
    params: {
        type: 'object',
        required: ['identifier'],
        properties: {
            identifier: { type: 'string', minLength: 1 }
        }
    }
};
// Schema para o corpo da requisição de Atualização (PUT)
// Similar ao de criação, mas nenhum campo é obrigatório no body
// e não permitimos atualizar _id ou DataCadastro
const updateProductSchema = {
    ...idParamSchema, // Inclui a validação do parâmetro :id
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
        additionalProperties: false, // Não permitir outros campos
        minProperties: 1 // Exigir que pelo menos uma propriedade seja enviada para atualização
    },
    response: {
        200: {
            type: 'object', // Retorna o objeto atualizado
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
            properties: { error: { type: 'string' } }
        }
    }
};
// Schema para resposta de busca (GET por id/nome e GET todos)
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
// --- Plugin de Rotas ---
async function productRoutes(fastify, options) {
    // Usar Collection<Product> para facilitar o manuseio dos tipos com _id
    const productsCollection = fastify.mongo.db.collection('products');
    // -------- Rota para Criar Novo Produto (POST /) --------
    // Note que o caminho é '/' porque o prefixo '/products' será adicionado no server.ts
    // Mudei de /newproduct para / para seguir o padrão REST
    fastify.post('/newproduct', { schema: createProductSchema }, async (request, reply) => {
        try {
            const productData = request.body;
            // Usar Product diretamente, mas omitindo _id antes da inserção
            const newProductData = {
                ...productData,
                Preço: Number(productData.Preço),
                DataCadastro: (0, moment_1.default)().toDate(), // Data atual
            };
            const result = await productsCollection.insertOne(newProductData);
            // Construir o produto criado completo para retorno
            const createdProduct = {
                _id: result.insertedId, // Adiciona o _id retornado
                ...newProductData // Adiciona os outros dados
            };
            reply.code(201).send(createdProduct);
        }
        catch (error) {
            request.log.error(error, 'Erro ao criar produto');
            reply.code(500).send({ error: 'Erro interno do servidor ao criar produto' });
        }
    });
    // -------- Rota para Listar Todos os Produtos (GET /) --------
    // Este também usa '/' relativo ao prefixo /products
    // Mudei de /products para /
    fastify.get('/products', { schema: { response: { 200: { type: 'array', items: productResponseSchema } } } }, async (request, reply) => {
        try {
            // find().toArray() retorna WithId<Document>[], que é compatível com Product[] se os campos baterem
            const products = await productsCollection.find({}).toArray();
            reply.send(products);
        }
        catch (error) {
            request.log.error(error, 'Erro ao buscar produtos');
            reply.code(500).send({ error: 'Erro interno do servidor ao buscar produtos' });
        }
    });
    // -------- Rota para Buscar Produto por ID ou Nome (GET /:identifier) --------
    fastify.get('/:identifier', { schema: { ...identifierParamSchema, response: { 200: productResponseSchema, 404: { type: 'object', properties: { error: { type: 'string' } } } } } }, async (request, reply) => {
        const { identifier } = request.params;
        let product = null;
        try {
            // Tenta buscar por ObjectId se o identificador for um formato válido
            if (mongodb_1.ObjectId.isValid(identifier)) {
                request.log.info(`Tentando buscar produto por ID: ${identifier}`);
                product = await productsCollection.findOne({ _id: new mongodb_1.ObjectId(identifier) });
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
        }
        catch (error) {
            request.log.error(error, `Erro ao buscar produto com identificador: ${identifier}`);
            reply.code(500).send({ error: 'Erro interno do servidor ao buscar produto' });
        }
    });
    // -------- Rota para Atualizar Produto por ID (PUT /:id) --------
    // src/routes/product.routes.ts
    // ... (restante do código como antes)
    // -------- Rota para Atualizar Produto por ID (PUT /:id) --------
    fastify.put('/:id', { schema: updateProductSchema }, async (request, reply) => {
        const { id } = request.params;
        const updateDataFromBody = request.body; // Renomeado para clareza
        try {
            const objectId = new mongodb_1.ObjectId(id);
            // Inicializa o objeto que será usado no $set
            const updatePayload = {};
            // Itera sobre as chaves permitidas em UpdateProductPayload
            // (Nome, Descrição, Cor, Peso, Tipo, Preço)
            Object.keys(updateDataFromBody).forEach(key => {
                // Verifica se a chave realmente existe no corpo da requisição
                // e se o valor não é undefined (o schema deve cuidar de tipos errados)
                if (updateDataFromBody[key] !== undefined) {
                    // Se a chave for 'Preço', converte para número
                    if (key === 'Preço') {
                        const priceValue = Number(updateDataFromBody[key]);
                        if (!isNaN(priceValue)) {
                            updatePayload[key] = priceValue;
                        }
                        else {
                            // Lida com Preço inválido - pode logar, ignorar, ou retornar erro
                            request.log.warn(`Valor de Preço inválido fornecido para ${key}: ${updateDataFromBody[key]}`);
                        }
                    }
                    else {
                        // Para outras chaves, atribui diretamente
                        // O tipo de updateDataFromBody[key] já deve ser compatível com updatePayload[key]
                        updatePayload[key] = updateDataFromBody[key]; // Usar 'as any' aqui é um "escape hatch"
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
            const result = await productsCollection.updateOne({ _id: objectId }, { $set: updatePayload } // Passa o objeto construído para $set
            );
            if (result.matchedCount === 0) {
                return reply.code(404).send({ error: 'Produto não encontrado para atualização.' });
            }
            if (result.modifiedCount === 0 && result.matchedCount === 1) {
                request.log.info(`Produto ${id} encontrado, mas nenhum campo foi modificado.`);
            }
            else {
                request.log.info(`Produto ${id} atualizado com sucesso.`);
            }
            const updatedProduct = await productsCollection.findOne({ _id: objectId });
            if (!updatedProduct) {
                return reply.code(404).send({ error: 'Produto não encontrado após a atualização.' });
            }
            reply.send(updatedProduct);
        }
        catch (error) {
            request.log.error(error, `Erro ao atualizar produto com ID: ${id}`);
            reply.code(500).send({ error: 'Erro interno do servidor ao atualizar produto' });
        }
    });
    // ... (restante do código)
    // -------- Rota para Deletar Produto por ID (DELETE /:id) --------
    fastify.delete('/:id', { schema: { ...idParamSchema, response: { 200: { type: 'object', properties: { message: { type: 'string' } } }, 404: { type: 'object', properties: { error: { type: 'string' } } } } } }, async (request, reply) => {
        const { id } = request.params;
        // O schema já valida o formato do ID
        // if (!ObjectId.isValid(id)) {
        //     return reply.code(400).send({ error: 'ID inválido fornecido.' });
        // }
        try {
            const objectId = new mongodb_1.ObjectId(id);
            const result = await productsCollection.deleteOne({ _id: objectId });
            if (result.deletedCount === 0) {
                return reply.code(404).send({ error: 'Produto não encontrado para exclusão.' });
            }
            request.log.info(`Produto ${id} excluído com sucesso.`);
            // Retorna 200 OK com uma mensagem em vez de 204 No Content para dar feedback
            reply.send({ message: 'Produto excluído com sucesso.' });
        }
        catch (error) {
            request.log.error(error, `Erro ao excluir produto com ID: ${id}`);
            reply.code(500).send({ error: 'Erro interno do servidor ao excluir produto' });
        }
    });
} // Fim da função productRoutes
exports.default = (0, fastify_plugin_1.default)(productRoutes);
