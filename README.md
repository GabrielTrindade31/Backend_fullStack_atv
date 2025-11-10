# Backend de Autenticação & SSO

Backend oficial da equipe de Cadastro para o ecossistema multi-times da atividade. O serviço centraliza cadastro, autenticação e
single sign-on (SSO) para os módulos de Loja, Financiamento, Backoffice e Engajamento, garantindo consistência de permissões e
rotas protegidas em todos os microserviços.

## Funcionalidades principais

- Cadastro local com validação robusta de senha e papel (`client` ou `admin`).
- Login interno e via Google Identity Services.
- Emissão de **access tokens** (JWT de 15 minutos) e **refresh tokens** opacos (30 dias) com rotação automática.
- Endpoint de introspecção de token para outros backends (`POST /auth/validate`).
- Mapeamento de permissões alinhado ao barema do projeto (clientes x admins).
- Rotas administrativas para consulta de usuários (`GET /auth/users` e `GET /auth/users/:id`).
- Documentação Swagger disponível em `/api-docs`.

## Tecnologias principais

- Node.js + Express
- TypeScript
- PostgreSQL (Neon/Vercel Postgres)
- JWT para autenticação stateless
- Zod para validação de dados
- Swagger UI + swagger-jsdoc
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

   Se preferir inicializar manualmente (por exemplo em pipelines ou ambientes serverless), rode:

   ```bash
   npm run db:init
   ```

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

Na primeira execução, o backend cria ou ajusta as tabelas `users` e `refresh_tokens`, migra perfis legados (`user` → `client`, `backlog` → `admin`) e aplica a constraint que limita os valores de `role`. Caso precise aplicar migrações adicionais, utilize um gerenciador de migrações de sua preferência. Você pode forçar a criação/ajuste das tabelas executando `npm run db:init`.

## Integração com frontends

Consulte o arquivo [`docs/INTEGRATION.md`](docs/INTEGRATION.md) para detalhes de endpoints, payloads e respostas esperadas.

## Scripts úteis

- `npm run dev`: inicia o servidor em modo de desenvolvimento com recarregamento.
- `npm run build`: compila o código TypeScript para a pasta `dist`.
- `npm start`: executa a versão compilada.
- `npm run db:init`: prepara o banco de dados garantindo a existência da tabela `users` com a coluna de `role`.

## Testes

Atualmente não há testes automatizados definidos. Recomenda-se adicionar testes de integração/end-to-end que validem o fluxo de login e proteção de rotas.
