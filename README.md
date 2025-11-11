# Mini-Projeto Fullstack - Backend

API REST desenvolvida em Node.js com TypeScript, Express e PostgreSQL para atuar como **provedor central de autenticação** da plataforma. Além das credenciais locais, a API permite login com Google, gerenciamento de tokens de acesso e refresh com rotatividade segura, introspecção de tokens para outros backends e validação de permissões (usuário `customer` x `admin`).

O projeto mantém o CRUD autenticado de **tarefas** como módulo de exemplo e inclui documentação via Swagger acessível em `/docs`.

## Sumário

- [Tecnologias](#tecnologias)
- [Arquitetura de pastas](#arquitetura-de-pastas)
- [Configuração](#configuração)
- [Configuração do PostgreSQL](#configuração-do-postgresql)
- [Execução local](#execução-local)
- [Execução no GitHub Codespaces](#execução-no-github-codespaces)
- [Scripts de requisição](#scripts-de-requisição)
- [Boas práticas implementadas](#boas-práticas-implementadas)
- [Hospedagem e vídeo](#hospedagem-e-vídeo)
- [Deploy na Vercel](#deploy-na-vercel)

## Tecnologias

- Node.js & TypeScript
- Express
- PostgreSQL & `pg`
- JWT (`jsonwebtoken`)
- Hash de senha com `bcryptjs`
- Validações com `zod`
- Logs estruturados com `winston`

## Arquitetura de pastas

```
src/
├── app.ts
├── config/
├── controllers/
├── database/
├── errors/
├── middlewares/
├── models/
├── routes/
├── services/
└── utils/
requests/
```

Cada camada possui responsabilidade única e isolada, facilitando a manutenção e evolução.

## Configuração

1. (Opcional, mas recomendado) Suba o PostgreSQL local com Docker Compose:

   ```bash
docker compose up -d postgres
   ```

   > Caso prefira utilizar um serviço gerenciado (Neon, Supabase, Render, Railway, etc.), consulte a seção [Configuração do PostgreSQL](#configuração-do-postgresql).

2. Copie o arquivo `.env.example` para `.env` e ajuste as variáveis de ambiente:

   ```bash
   cp .env.example .env
   ```

3. Preencha o `.env` com as variáveis obrigatórias. Para o ambiente compartilhado em Neon e login com Google já configurados no projeto, utilize os valores abaixo:

   ```env
   PORT=3333
   NODE_ENV=development
   DATABASE_URL=postgresql://neondb_owner:npg_8FmGL9ShYJCk@ep-old-tooth-acehkb32-pooler.sa-east-1.aws.neon.tech/neondb?sslmode=require
   POSTGRES_SSL=require
   JWT_SECRET=altere-esta-chave-em-producao
   JWT_ACCESS_EXPIRES_IN_MIN=15
   REFRESH_TOKEN_EXPIRES_IN_DAYS=7
   GOOGLE_CLIENT_ID=1053185903831-lt44jeufu4rb52u35agpoi76qvi368k2.apps.googleusercontent.com
   ```

   > Gere uma nova chave forte para `JWT_SECRET` antes de publicar em produção (`openssl rand -base64 32`).

4. Instale as dependências:

   ```bash
   npm install
   ```

## Configuração do PostgreSQL

O repositório inclui um guia completo em [`docs/postgresql.md`](docs/postgresql.md) com três abordagens principais:

- **Docker Compose local** — execute `docker compose up -d postgres` para subir um banco pronto para uso.
- **Instalação local do PostgreSQL** — passo a passo para configurar usuário, senha e banco manualmente.
- **Serviços gerenciados (nuvem)** — orientações para utilizar provedores como Neon, Supabase, Render ou Railway.

Escolha a opção que melhor se adequa ao seu cenário e preencha `DATABASE_URL`/`DATABASE_URL_PROD` conforme indicado.

> Após conectar-se ao banco, rode o comando abaixo a partir da raiz do projeto para criar as tabelas e extensões necessárias:
>
> ```bash
> cat sql/schema.sql | docker compose exec -T postgres psql -U mini_projeto -d mini_projeto_fullstack
> ```
>
> Se você estiver utilizando um `psql` instalado localmente (em vez de entrar pelo contêiner), ainda pode usar `\i sql/schema.sql` diretamente no prompt do banco.
>
> Para serviços externos como o Neon, utilize o `psql` do host com a string de conexão completa:
>
> ```bash
> psql "postgresql://usuario:senha@host:porta/base?sslmode=require" -f sql/schema.sql
> ```
>
> Substitua a URL pelo valor entregue pelo provedor. O parâmetro `sslmode=require` já vem embutido em plataformas como a Neon e garante que a conexão TLS seja aceita.
>
> Para um banco criado na **Neon**, o comando ficará parecido com:
>
> ```bash
> psql "postgresql://neondb_owner:SEU_TOKEN@ep-exemplo-pooler.sa-east-1.aws.neon.tech/neondb?sslmode=require" -f sql/schema.sql
> ```
>
> Basta ajustar `SEU_TOKEN` e o subdomínio (`ep-exemplo`) com os valores reais fornecidos pelo painel.
>
> Viu a mensagem `psql: command not found`? Instale o cliente antes de rodar os comandos acima:
>
> - **Debian/Ubuntu (e Codespaces):** `sudo apt-get update && sudo apt-get install -y postgresql-client`
> - **macOS com Homebrew:** `brew install libpq && brew link --force libpq`
> - **Windows:** utilize o instalador oficial do PostgreSQL selecionando *Command Line Tools* ou instale o pacote "psql" pelo StackBuilder.
>
> Se instalar o cliente não for uma opção, você pode rodar o comando a partir de um contêiner efêmero: `cat sql/schema.sql | docker run --rm -i postgres:16-alpine psql "postgresql://usuario:senha@host:porta/base?sslmode=require"`.
>
> Para a Neon, ficaria assim:
>
> ```bash
> cat sql/schema.sql | docker run --rm -i postgres:16-alpine psql "postgresql://neondb_owner:SEU_TOKEN@ep-exemplo-pooler.sa-east-1.aws.neon.tech/neondb?sslmode=require"
> ```
>
> Altere `SEU_TOKEN` e `ep-exemplo` para refletir sua string de conexão real.

## Execução local

1. Certifique-se de que o PostgreSQL esteja ativo (via `docker compose up -d postgres` ou serviço gerenciado equivalente).
2. Inicie o servidor em modo desenvolvimento:

   ```bash
   npm run dev
   ```

O servidor sobe na porta definida em `PORT` (padrão `3333`). As rotas principais são:

- `POST /auth/register`
- `POST /auth/login`
- `POST /auth/login/google`
- `POST /auth/token/refresh`
- `POST /auth/logout`
- `POST /auth/token/introspect`
- `GET /auth/me` *(requer `Authorization: Bearer <accessToken>`)*
- `GET /protected` *(requer `Authorization: Bearer <accessToken>`)*
- CRUD de tarefas autenticadas em `/tasks`

Todos os endpoints de tarefas exigem autenticação via JWT.

### Estrutura da entidade `Task`

Cada tarefa criada pertence exclusivamente ao usuário autenticado e possui os seguintes campos:

| Campo       | Tipo                    | Obrigatório | Descrição |
|-------------|-------------------------|-------------|-----------|
| `title`     | `string`                | Sim         | Título da tarefa (mínimo 3 caracteres). |
| `description` | `string`             | Não         | Texto livre para detalhamento (máx. 500 caracteres). |
| `status`    | `"pending" \| "in_progress" \| "completed"` | Não (default `pending`) | Estado atual da tarefa. |
| `dueDate`   | `string (ISO 8601)`     | Não         | Data limite. Envie `null` em PATCH/PUT para remover. |
| `createdAt`/`updatedAt` | `Date`      | Automático  | Campos de auditoria gerenciados pelo PostgreSQL. |

Requisições de usuários diferentes nunca acessam dados entre si — o serviço retorna **403** quando detecta tentativa de acesso a tarefas de outro usuário.

Para encerrar os serviços locais, utilize `Ctrl+C` no terminal da API e `docker compose down` para desligar o banco.

## Execução no GitHub Codespaces

1. Crie o Codespace a partir deste repositório selecionando o template padrão de Node.js.
2. Copie o arquivo `.env.example` para `.env` e substitua os valores conforme a seção [Configuração](#configuração) (o projeto já está preparado para usar o banco Neon compartilhado, não é necessário subir Docker).
3. Instale as dependências, aplique o schema no banco remoto e inicie o servidor:

   ```bash
   npm install
   psql "postgresql://neondb_owner:npg_8FmGL9ShYJCk@ep-old-tooth-acehkb32-pooler.sa-east-1.aws.neon.tech/neondb?sslmode=require" -f sql/schema.sql
   npm run dev
   ```

   > Caso o comando `psql` não esteja disponível, instale o cliente com `sudo apt-get update && sudo apt-get install -y postgresql-client` antes de executá-lo.

4. Utilize a aba **Ports** para expor a porta `3333` e acesse a URL pública fornecida pelo Codespace para testar os endpoints (os scripts em [`requests/`](requests/) também funcionam ajustando `BASE_URL`).

## Scripts de requisição

A pasta [`requests/`](requests/) contém arquivos `.sh` com exemplos de requisições utilizando `curl`. Execute-os conforme necessário:

```bash
bash requests/register_success.sh
bash requests/login_success.sh
# ...
```

Os scripts aceitam variáveis de ambiente (`BASE_URL`, `EMAIL`, `PASSWORD`, `TOKEN`, etc.) para reutilização em ambientes locais ou hospedados.

Além dos arquivos `.sh`, disponibilizamos `requests/requests.yaml` que pode ser importado diretamente no Insomnia/Postman. A coleção inclui exemplos de sucesso e erros para:

- Cadastro e login;
- Rotas protegidas sem token e com token inválido;
- CRUD completo de tarefas (criar, listar com filtros, detalhar, atualizar por PUT/PATCH e remover);
- Casos negativos: requisição mal formatada, token ausente/inválido e simulação de tentativa de acesso a tarefa de outro usuário.

Antes de executar as requisições de tarefas configure, no Insomnia/Postman, os seguintes valores no ambiente da coleção:

- `base_url`: URL local ou hospedada da API;
- `token`: token JWT do usuário principal;
- `token_outro_usuario`: token JWT de um usuário diferente (para simular a resposta 403);
- `task_id`: ID de uma tarefa criada pelo usuário principal (usado em GET/PUT/PATCH/DELETE);
- `task_id_outro_usuario`: ID de uma tarefa pertencente a outro usuário (para o cenário 403).

## Boas práticas implementadas

- Estrutura em camadas seguindo o padrão solicitado.
- Conexão com PostgreSQL configurável para ambientes local e produção.
- Validações semânticas para cadastro e login (tamanho mínimo, formato de e-mail, política de senhas forte).
- Hash de senha com `bcrypt` e campo `password` não selecionável.
- Tratamento centralizado de erros e respostas com status HTTP adequados.
- Logs de requisições e de eventos importantes (sucesso/erro) utilizando Winston.
- Scripts de exemplo para todos os cenários exigidos.

## Hospedagem e vídeo

- **Link da aplicação hospedada:** <!-- Adicione aqui o link após publicar -->
- **Vídeo demonstrativo:** <!-- Adicione aqui o link do vídeo (até 2 minutos) -->

## Deploy na Vercel

1. (Opcional) Instale a CLI da Vercel (localmente ou no Codespace):

   ```bash
   npm install -g vercel
   ```

   > Se o repositório estiver conectado ao GitHub, você pode iniciar o deploy diretamente pelo painel da Vercel sem executar comandos no workspace. A CLI é útil apenas quando quiser disparar deploys ou gerenciar variáveis via terminal.

2. Autentique-se e associe o projeto:

   ```bash
   vercel login
   vercel link
   ```

3. No painel da Vercel, configure o projeto como **Serverless Function** com runtime `@vercel/node` (isso é feito automaticamente ao detectar o arquivo [`vercel.json`](vercel.json)). Em **General → Project Settings** defina:

   | Campo                | Valor                                                                 |
   | -------------------- | --------------------------------------------------------------------- |
   | Root Directory       | `./` (ou selecione a raiz do repositório)                             |
   | Framework Preset     | `Other`                                                               |

   Em seguida, na seção **Build & Output Settings** configure exatamente como a tabela abaixo (não há etapa de build dedicada porque o handler em [`api/index.ts`](api/index.ts) é empacotado automaticamente pelo runtime `@vercel/node`):

   | Campo             | Valor                                  |
   | ----------------- | -------------------------------------- |
   | Build Command     | deixar o toggle **desligado**          |
   | Install Command   | `npm install` *(padrão da Vercel)*     |
   | Output Directory  | deixar em branco                       |

   > **Não configure `npm run build`.** O runtime da Vercel transpila o projeto automaticamente quando encontra o handler TypeScript, então qualquer comando manual de build pode (e deve) permanecer vazio.

4. Configure as variáveis de ambiente no painel da Vercel ou via CLI. Para um banco hospedado na Neon, por exemplo, os valores ficam:

   | Nome               | Exemplo de valor                                             | Observação |
   | ------------------ | ------------------------------------------------------------ | ---------- |
   | `DATABASE_URL_PROD`| `postgresql://neondb_owner:***@ep-foo.sa-east-1.aws.neon.tech/neondb?sslmode=require` | String de conexão completa do banco gerenciado. |
   | `POSTGRES_SSL`     | `true`                                                       | Mantém TLS obrigatório em produção. |
   | `JWT_SECRET`       | `openssl rand -base64 32` *(valor forte gerado por você)*     | Necessário para assinar tokens. |
   | `NODE_ENV`         | `production`                                                 | Força o uso de `DATABASE_URL_PROD` e otimizações. |

   > **Dica:** no Codespaces você pode importar as variáveis locais com `vercel env pull` e publicá-las com `vercel env push`. Caso prefira configurar pelo painel (como na captura enviada), adicione cada chave na tabela de *Environment Variables* clicando em **Add More** e preenchendo o valor correspondente.

   Se desejar usar o mesmo banco em previews, replique essas variáveis no escopo `Preview` ou aponte `DATABASE_URL` diretamente para a mesma URL.

   > Com o projeto conectado ao GitHub, basta clicar em **Deploy** no dashboard — nenhuma etapa adicional precisa ser rodada manualmente no Codespace. Use o comando abaixo apenas se preferir subir pelo terminal.

5. Faça o deploy (primeiro um preview, depois produção):

   ```bash
   vercel --prod
   ```

O arquivo [`vercel.json`](vercel.json) direciona todas as requisições para o handler serverless em [`api/index.ts`](api/index.ts), que reutiliza a mesma aplicação Express do ambiente local. Após o deploy, atualize a seção [Hospedagem e vídeo](#hospedagem-e-vídeo) com a URL final e grave a demonstração solicitada.

Atualize esta seção após realizar o deploy (ex.: Vercel, Render) e gravar o vídeo demostrando as funcionalidades exigidas.
