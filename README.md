# TRAB 1 - API de Produtos Fastify + MongoDB

## Descrição
API RESTful para cadastro, consulta, atualização e remoção de produtos, utilizando Fastify, MongoDB e TypeScript.

## Instalação
1. Clone o repositório:
   ```powershell
   git clone <url-do-repositorio>
   cd "TRAB 1"
   ```
2. Instale as dependências:
   ```powershell
   npm install
   ```
3. Crie um arquivo `.env` na raiz com a string de conexão do MongoDB:
   ```env
   MONGODB_URI=mongodb://localhost:27017/sua-base
   PORT=3000
   ```

## Uso
- Para rodar em modo desenvolvimento:
  ```powershell
  npm run dev
  ```
- Para buildar e rodar em produção:
  ```powershell
  npm run build
  npm start
  ```

## Documentação da API
Acesse [http://localhost:3000/documentação](http://localhost:3000/documentação) após iniciar o servidor para ver a documentação Swagger interativa.

## Exemplos de Requisições
### Criar Produto
```http
POST /products/newproduct
Content-Type: application/json
{
  "Nome": "Caneta",
  "Descrição": "Caneta azul",
  "Cor": "Azul",
  "Peso": "20g",
  "Tipo": "Escrita",
  "Preço": 2.5
}
```

### Listar Produtos
```http
GET /products/products
```

### Buscar Produto por ID ou Nome
```http
GET /products/{identifier}
```

### Atualizar Produto
```http
PUT /products/{id}
Content-Type: application/json
{
  "Preço": 3.0
}
```

### Deletar Produto
```http
DELETE /products/{id}
```

## Estrutura do Projeto
- `src/app.ts`: Monta a aplicação Fastify.
- `src/server.ts`: Inicializa o servidor e configura plugins/rotas.
- `src/plugins/`: Plugins customizados (MongoDB, segurança).
- `src/routes/`: Rotas da API.
- `src/interfaces/`: Tipos TypeScript.
- `src/config/`: Configurações de ambiente.

---

> Para dúvidas, consulte os comentários nos arquivos fonte ou a documentação Swagger.

Autor: Thales Leal 24740
