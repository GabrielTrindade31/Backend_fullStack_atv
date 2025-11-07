# Backend de Autenticação

Este projeto fornece um backend em Node.js/Express focado em autenticação para múltiplos clientes. Ele suporta cadastro local com e-mail e senha, login via Google e emissão de tokens JWT que podem ser reutilizados por outros serviços.

## Tecnologias principais

- Node.js + Express
- PostgreSQL (Neon/Vercel Postgres)
- JWT para autenticação stateless
- Zod para validação de dados
- Google Identity para login social

## Configuração do ambiente

1. Crie um arquivo `.env` baseado em `.env.example` e preencha as variáveis:
   - `DATABASE_URL`: string de conexão fornecida pela Neon.
   - `JWT_SECRET`: chave secreta segura para assinar os tokens.
   - `GOOGLE_CLIENT_ID`: Client ID do OAuth 2.0 configurado na Google Cloud.
   - `PORT` (opcional): porta usada pelo servidor HTTP.

2. Instale as dependências (necessita acesso ao NPM):

   ```bash
   npm install
   ```

3. Execute a aplicação em modo desenvolvimento:

   ```bash
   npm run dev
   ```

   O servidor inicializa as tabelas necessárias automaticamente.

4. Para build de produção:

   ```bash
   npm run build
   npm start
   ```

## Estrutura de pastas

```
src/
  app.ts            # Inicialização do Express
  server.ts         # Bootstrap do servidor
  config/           # Configurações de ambiente e banco
  routes/           # Rotas HTTP
  services/         # Regras de negócio de autenticação
  middlewares/      # Middlewares (ex.: validação de JWT)
  utils/            # Funções auxiliares (JWT, senha, validações)
  types/            # Tipos compartilhados
```

## Banco de dados

Na primeira execução, o backend cria automaticamente a tabela `users` com colunas para e-mail, senha hash, nome, data de nascimento e id do Google. Caso precise aplicar migrações adicionais, utilize um gerenciador de migrações de sua preferência.

## Integração com frontends

Consulte o arquivo [`docs/INTEGRATION.md`](docs/INTEGRATION.md) para detalhes de endpoints, payloads e respostas esperadas.

## Scripts úteis

- `npm run dev`: inicia o servidor em modo de desenvolvimento com recarregamento.
- `npm run build`: compila o código TypeScript para a pasta `dist`.
- `npm start`: executa a versão compilada.

## Testes

Atualmente não há testes automatizados definidos. Recomenda-se adicionar testes de integração/end-to-end que validem o fluxo de login e proteção de rotas.
