# Mini-Projeto Fullstack - Backend

API REST desenvolvida em Node.js com TypeScript, Express e PostgreSQL, implementando autenticação baseada em JWT e estrutura em camadas (middlewares, routes, controllers, services, models e database). O projeto contempla validações robustas, hash de senhas com **bcrypt**, logs estruturados e exemplos de requisições via `curl`.

Na evolução desta versão foi adicionado um CRUD completo e autenticado de **tarefas** (to-do list) permitindo criar, listar, buscar por filtros, atualizar (PUT/PATCH) e remover itens associados ao usuário autenticado.

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

3. Configure os valores necessários (veja detalhes em [`docs/postgresql.md`](docs/postgresql.md)):

   ```env
   PORT=3333
   NODE_ENV=development
   DATABASE_URL=postgresql://mini_projeto:mini_projeto@localhost:5432/mini_projeto_fullstack
   DATABASE_URL_PROD= # URI do banco utilizado no deploy
   POSTGRES_SSL=false
   JWT_SECRET=dev-secret-change-me # substitua por uma chave segura em produção
   ```

   > Se estiver utilizando um provedor gerenciado (por exemplo, Neon), substitua `DATABASE_URL` pela URI fornecida pelo serviço e defina `POSTGRES_SSL=true`. O restante das variáveis pode permanecer igual.

   Para gerar uma chave aleatória, execute `openssl rand -base64 32` ou utilize a alternativa descrita na documentação.

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

O servidor sobe na porta definida em `PORT` (padrão `3333`). As rotas disponíveis são:

- `POST /register`
- `POST /login`
- `GET /protected` (necessita header `Authorization: Bearer <token>`)
- `POST /tasks` (cria tarefa)
- `GET /tasks` (lista tarefas com suporte a filtros por `status`, `title` e `dueDate`)
- `GET /tasks/:id`
- `PUT /tasks/:id`
- `PATCH /tasks/:id`
- `DELETE /tasks/:id`

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
2. Copie o arquivo `.env.example` para `.env` e informe as variáveis necessárias (você pode usar Docker ou uma URI de PostgreSQL gerenciada).
3. No terminal do Codespace, instale as dependências e inicie o banco/servidor:

   ```bash
   npm install
   docker compose up -d postgres # ou configure DATABASE_URL com um provedor externo
   npm run dev
   ```

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

1. Instale a CLI da Vercel (localmente ou no Codespace):

   ```bash
   npm install -g vercel
   ```

2. Autentique-se e associe o projeto:

   ```bash
   vercel login
   vercel link
   ```

3. Na aba **Build & Output Settings** do painel, deixe os campos como a tabela abaixo (não há etapa de build dedicada porque o handler em [`api/index.ts`](api/index.ts) é empacotado automaticamente pelo runtime `@vercel/node`):

   | Campo             | Valor                          |
   | ----------------- | ------------------------------ |
   | Build Command     | `None` *(toggle desativado)*   |
   | Install Command   | `npm install` *(padrão da Vercel)* |
   | Output Directory  | `N/A` *(deixe em branco)*      |

   > **Não é necessário configurar `npm run build`.** O runtime da Vercel transpila o projeto automaticamente quando encontra o handler TypeScript, então qualquer comando manual de build pode ser deixado vazio.

4. Configure as variáveis de ambiente no painel da Vercel ou via CLI. Para um banco hospedado na Neon, por exemplo, os valores ficam:

   | Nome               | Exemplo de valor                                             | Observação |
   | ------------------ | ------------------------------------------------------------ | ---------- |
   | `DATABASE_URL_PROD`| `postgresql://neondb_owner:***@ep-foo.sa-east-1.aws.neon.tech/neondb?sslmode=require` | String de conexão completa do banco gerenciado. |
   | `POSTGRES_SSL`     | `true`                                                       | Mantém TLS obrigatório em produção. |
   | `JWT_SECRET`       | `openssl rand -base64 32` *(valor forte gerado por você)*     | Necessário para assinar tokens. |
   | `NODE_ENV`         | `production`                                                 | Força o uso de `DATABASE_URL_PROD` e otimizações. |

   Se desejar usar o mesmo banco em previews, replique essas variáveis no escopo `Preview` ou aponte `DATABASE_URL` diretamente para a mesma URL.

5. Faça o deploy (primeiro um preview, depois produção):

   ```bash
   vercel --prod
   ```

O arquivo [`vercel.json`](vercel.json) direciona todas as requisições para o handler serverless em [`api/index.ts`](api/index.ts), que reutiliza a mesma aplicação Express do ambiente local. Após o deploy, atualize a seção [Hospedagem e vídeo](#hospedagem-e-vídeo) com a URL final e grave a demonstração solicitada.

Atualize esta seção após realizar o deploy (ex.: Vercel, Render) e gravar o vídeo demostrando as funcionalidades exigidas.
