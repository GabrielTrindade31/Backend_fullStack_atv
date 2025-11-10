# Backend Express + PostgreSQL

API de autenticação inspirada na arquitetura do projeto de referência. Fornece registro local, login com senha ou Google, emissão de JWTs e refresh tokens rotativos. Toda a API segue resposta em JSON e pode ser exercitada facilmente via Insomnia ou cURL.

## Recursos principais

- Porta fixa `4000` e conexão PostgreSQL lida a partir de `DATABASE_URL`.
- Registro de usuários locais com papéis `client` ou `admin`.
- Login com senha ou com Google Identity (ID Token).
- Access token (JWT) curto + refresh token opaco com rotação automática.
- Validação de token (`POST /auth/validate`) para outros serviços.
- Listagem de usuários restrita a admins.

## Tecnologias

- Node.js + Express
- TypeScript
- PostgreSQL (`pg`)
- JWT (`jsonwebtoken`)
- Zod para validação
- Google Identity Services (`google-auth-library`)

## Configuração

1. Crie um arquivo `.env` com as variáveis:
   ```env
   DATABASE_URL=postgres://usuario:senha@host:5432/db
   JWT_SECRET=chave-super-secreta
   GOOGLE_CLIENT_ID=seu-client-id.apps.googleusercontent.com
   PORT=4000 # opcional, 4000 por padrão
   JWT_EXPIRES_IN=15m # opcional
   REFRESH_TOKEN_DAYS=7 # opcional
   ```

2. Instale as dependências:
   ```bash
   npm install
   ```

3. Inicialize as tabelas (opcional, executado automaticamente ao subir o servidor):
   ```bash
   npm run db:init
   ```

4. Rode em desenvolvimento:
   ```bash
   npm run dev
   ```

5. Build/produção:
   ```bash
   npm run build
   npm start
   ```

## Estrutura de pastas

```
src/
  app.ts                    # Configuração do Express
  server.ts                 # Bootstrap do servidor
  config/                   # Variáveis de ambiente e banco de dados
  core/                     # Erros e utilitários HTTP
  lib/                      # Helpers (JWT, senha, tokens)
  middlewares/              # Autenticação, autorização e erros
  modules/
    auth/                   # Regras e rotas de autenticação
    health/                 # Rota de healthcheck
  scripts/                  # Utilitários (ex.: init-db)
  types/                    # Tipagens globais
```

## Endpoints

- `GET /health` — Healthcheck.
- `POST /auth/register` — Criação de usuário local.
- `POST /auth/login` — Login com e-mail/senha.
- `POST /auth/google` — Login social com Google (ID token).
- `POST /auth/refresh` — Renova o access token.
- `POST /auth/logout` — Revoga o refresh token informado.
- `GET /auth/me` — Perfil do usuário autenticado.
- `POST /auth/validate` — Introspecção de access token.
- `GET /auth/users` — Lista usuários (somente admins).
- `GET /auth/users/:id` — Perfil por ID (admin ou o próprio usuário).

Todas as respostas seguem JSON. Use header `Authorization: Bearer <access_token>` nas rotas protegidas.

## Banco de dados

A aplicação cria automaticamente as tabelas `users` e `refresh_tokens` e garante a extensão `uuid-ossp`. Refresh tokens são salvos com hash SHA-256 e expiram conforme `REFRESH_TOKEN_DAYS`.

## Testes

Ainda não há testes automatizados. Recomenda-se criar coleções no Insomnia/Postman para validar os fluxos de autenticação.
