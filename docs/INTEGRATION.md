# Guia de Integração do Frontend

Este documento descreve como um frontend (ou outro backend) pode consumir o serviço de autenticação hospedado neste projeto.

## URL base

```
https://<seu-dominio-ou-url-do-vercel>
```

O backend expõe os endpoints abaixo sob o prefixo `/auth`.

## Formato de autenticação

Os tokens JWT retornados pelos endpoints de login devem ser enviados no header `Authorization` com o formato:

```
Authorization: Bearer <token>
```

## Endpoints

### `POST /auth/register`
Cria um usuário local com e-mail e senha.

**Body JSON**
```json
{
  "email": "usuario@example.com",
  "password": "Senha@Forte123",
  "confirmPassword": "Senha@Forte123",
  "name": "Nome do Usuário",
  "dateOfBirth": "1995-05-20"
}
```

> A senha deve conter pelo menos 8 caracteres, incluindo letras maiúsculas, minúsculas, números e caractere especial.

**Resposta 201**
```json
{
  "token": "<jwt>",
  "user": {
    "id": "<uuid>",
    "email": "usuario@example.com",
    "name": "Nome do Usuário",
    "dateOfBirth": "1995-05-20",
    "googleId": null,
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

**Possíveis erros**

- `400 Dados inválidos.` — Quando o e-mail já existe, as senhas não coincidem ou algum campo não atende às regras de validação.
- O payload de erro pode conter o campo `issues` com os detalhes de validação retornados pelo Zod.

### `POST /auth/login`
Realiza login via e-mail e senha.

**Body JSON**
```json
{
  "email": "usuario@example.com",
  "password": "SenhaForte123"
}
```

**Resposta 200** – mesmo formato do endpoint de registro.

**Possíveis erros**

- `401 Credenciais inválidas.`

### `POST /auth/google`
Realiza login com um token de ID do Google (obtido via Google Identity Services). O backend valida o token, cria o usuário caso não exista e devolve o JWT local.

**Body JSON**
```json
{
  "idToken": "token-retornado-pelo-google"
}
```

**Resposta 200** – mesmo formato dos endpoints anteriores.

### `GET /auth/me`
Retorna o perfil do usuário autenticado.

**Headers**
```
Authorization: Bearer <jwt>
```

**Resposta 200**
```json
{
  "user": {
    "id": "<uuid>",
    "email": "usuario@example.com",
    "name": "Nome do Usuário",
    "dateOfBirth": "1995-05-20",
    "googleId": null,
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

### `POST /auth/validate`
Valida um token JWT sem acessar recursos protegidos.

**Body JSON**
```json
{
  "token": "<jwt>"
}
```

**Resposta 200**
```json
{
  "valid": true,
  "user": {
    "id": "<uuid>",
    "email": "usuario@example.com",
    "name": "Nome do Usuário",
    "dateOfBirth": "1995-05-20",
    "googleId": null,
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  },
  "permissions": [
    "auth:register",
    "auth:login",
    "auth:token:validate",
    "profile:read"
  ]
}
```

**Resposta 401** (token inválido)
```json
{
  "valid": false,
  "message": "Token inválido."
}
```

**Resposta 404** (usuário não encontrado)
```json
{
  "valid": false,
  "message": "Usuário não encontrado."
}
```

## Fluxo do login com Google

1. No frontend, use a Google Identity Services SDK para obter um `idToken` do usuário autenticado.
2. Envie o token para `POST /auth/google`.
3. Receba o JWT local e os dados do usuário para armazenar no estado da aplicação.

Certifique-se de configurar a variável de ambiente `GOOGLE_CLIENT_ID` com o mesmo client ID utilizado no frontend.

## Variáveis de ambiente necessárias no frontend

Para consumir o backend, o frontend precisa conhecer apenas a URL base dos endpoints e, no caso de login com Google, usar o mesmo Client ID configurado no backend.

## Tratamento de erros

Todos os endpoints retornam erros no formato:

```json
{
  "message": "Descrição do erro"
}
```

Algumas validações retornam o campo adicional `issues` com detalhes do problema de validação.
