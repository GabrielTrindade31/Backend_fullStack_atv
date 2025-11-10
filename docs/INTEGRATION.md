# Guia de Integração do Backend de Cadastro

Este documento descreve como consumir o serviço de autenticação da equipe de Cadastro. A API atua como provedor de identidade e
SSO para os demais times, oferecendo cadastro local, login interno e via Google, emissão e rotação de tokens e exposição dos
metadados de permissão exigidos pelo barema do projeto.

## URL base

```
https://<seu-dominio-ou-url-do-backend>
```

Todos os endpoints descritos abaixo estão sob o prefixo `/auth`.

## Preparando o banco de dados

Antes de subir o servidor, execute:

```bash
npm run db:init
```

O script cria/ajusta as tabelas `users` e `refresh_tokens`, migra perfis antigos (`user` → `client`, `backlog` → `admin`) e aplica
as restrições necessárias para que os tokens de atualização funcionem corretamente.

## Tokens e cabeçalhos

A API trabalha com dois tokens:

- **Access token** (JWT, expira em 15 minutos): enviado no header `Authorization: Bearer <token>` em todas as rotas protegidas.
- **Refresh token** (opaco, expira em 30 dias): deve ser armazenado com segurança pelo cliente e enviado em `/auth/refresh` ou `/auth/logout`.

Os refresh tokens são one-time: a cada chamada em `/auth/refresh` o token anterior é revogado e um novo é emitido.

## Endpoints principais

### `POST /auth/register`
Cria um usuário local com e-mail e senha.

**Body JSON**
```json
{
  "email": "davih.user@example.com",
  "password": "Davih@123",
  "confirmPassword": "Davih@123",
  "name": "Usuário Padrão",
  "dateOfBirth": "1995-05-20",
  "role": "client"
}
```

> A senha deve ter ao menos 8 caracteres, com letras maiúsculas e minúsculas, número e caractere especial.
> Para compatibilidade com integrações antigas, o backend também aceita `user` (mapeado para `client`) e `backlog` (mapeado para `admin`).

**Resposta 201**
```json
{
  "accessToken": "<jwt>",
  "refreshToken": "<uuid>.<opaque-token>",
  "user": {
    "id": "<uuid>",
    "email": "davih.user@example.com",
    "name": "Usuário Padrão",
    "dateOfBirth": "1995-05-20",
    "googleId": null,
    "role": "client",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  },
  "permissions": [
    "auth:register",
    "auth:login",
    "auth:google",
    "auth:refresh",
    "auth:token:validate",
    "sso:session:introspect",
    "client:dashboard:access",
    "client:shop:access",
    "client:shop:checkout",
    "client:finance:access",
    "client:engagement:access",
    "profile:self:read",
    "profile:self:update"
  ]
}
```

**Erros comuns**
- `400 Dados inválidos.` – validações de campo ou e-mail duplicado.

### `POST /auth/login`
Login com e-mail e senha. O corpo é igual ao do registro (sem `confirmPassword`, `name`, `role`). A resposta repete o formato acima.

### `POST /auth/google`
Recebe um `idToken` do Google Identity, sincroniza (ou cria na primeira chamada) o usuário e devolve o mesmo payload de sessão dos outros logins. Na coleção do Insomnia incluída no repositório, procure pela requisição **POST Login/Registrar via Google** para validar este fluxo.

```json
{
  "idToken": "token-retornado-pelo-google"
}
```

### `POST /auth/refresh`
Rotaciona um refresh token válido e gera um novo par de tokens.

```json
{
  "refreshToken": "<uuid>.<opaque-token>"
}
```

**Resposta 200** – Igual ao payload de sessão dos endpoints de login.

**Erros**
- `400 Dados inválidos.` – corpo ausente ou mal formatado.
- `401` – token inexistente, revogado ou expirado.

### `POST /auth/logout`
Revoga explicitamente um refresh token.

```json
{
  "refreshToken": "<uuid>.<opaque-token>"
}
```

**Resposta 204** – Sem corpo.

### `GET /auth/me`
Retorna o usuário autenticado e suas permissões, útil para montar dashboards específicos de cliente ou admin.

**Headers**
```
Authorization: Bearer <access-token>
```

**Resposta 200**
```json
{
  "user": { /* ... */ },
  "permissions": [ /* ... */ ]
}
```

### `POST /auth/validate`
Introspecção de access tokens. Pode ser consumido por outros backends que não conseguem validar JWT localmente.

```json
{
  "token": "<access-token>"
}
```

**Resposta 200**
```json
{
  "valid": true,
  "user": { /* ... */ },
  "permissions": [ /* ... */ ],
  "token": {
    "subject": "<uuid-do-usuário>",
    "email": "davih.user@example.com",
    "role": "client"
  }
}
```

**Erros**
- `400` – token não informado.
- `401` – token inválido.
- `404` – usuário removido/indisponível.

### `GET /auth/users`
Lista todos os usuários para o backoffice. Requer usuário autenticado com perfil `admin`.

**Resposta 200**
```json
{
  "users": [
    { "id": "...", "role": "client", ... }
  ]
}
```

### `GET /auth/users/:id`
Retorna o perfil e as permissões de um usuário específico. Admins podem consultar qualquer conta; clientes podem consultar apenas o próprio ID.

## Perfis e permissões

| Perfil | Descrição | Permissões adicionais |
| ------ | --------- | --------------------- |
| `client` | Usuário final da plataforma. Pode navegar na loja, contratar financiamentos e acompanhar pontos. | `client:dashboard:access`, `client:shop:*`, `client:finance:access`, `client:engagement:access`, `profile:self:*` |
| `admin` | Operadores de backoffice. Não podem comprar/financiar, mas possuem visão e edição global. | `admin:backoffice:access`, `admin:users:*`, `admin:products:manage`, `admin:finance:overview`, `analytics:global:read` |

Todos os perfis recebem o conjunto base (`auth:*`, `sso:session:introspect`). Outros serviços devem usar essas permissões para aplicar as regras do desafio (ex.: bloquear admins em rotas de compra ou direcionar clientes ao dashboard).

## Boas práticas para os outros times

- Armazene o refresh token com segurança (cookie httpOnly ou storage seguro) e sempre rotacione via `/auth/refresh` ao iniciar a aplicação.
- Consulte `/auth/validate` ou decodifique o JWT internamente antes de liberar rotas críticas.
- Utilize `role` e o array de `permissions` retornados para decidir redirecionamentos (cliente → dashboard, admin → backoffice).
- Em caso de dúvida sobre consistência de tokens, faça logout forçado enviando o refresh token para `/auth/logout`.

Com isso, o backend de Cadastro oferece um núcleo SSO completo para suportar os demais microserviços do ecossistema.
