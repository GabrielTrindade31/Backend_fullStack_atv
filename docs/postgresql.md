# Guia de configuração do PostgreSQL

Este guia apresenta diferentes formas de obter a string de conexão necessária para preencher o arquivo `.env` e executar o projeto.

## 1. Docker Compose local

A maneira mais simples de levantar um banco PostgreSQL localmente é utilizar o `docker-compose.yml` fornecido no repositório.

1. Certifique-se de ter o Docker e o Docker Compose instalados.
2. No diretório do projeto, execute:

   ```bash
docker compose up -d postgres
   ```

3. O serviço cria automaticamente o banco `mini_projeto_fullstack` com usuário e senha `mini_projeto` (confira o arquivo `docker-compose.yml`).
4. Copie a string de conexão e preencha o `.env`:

   ```env
DATABASE_URL=postgresql://mini_projeto:mini_projeto@localhost:5432/mini_projeto_fullstack
POSTGRES_SSL=false
   ```

> Para desligar o banco: `docker compose down`.

## 2. Instalação local do PostgreSQL

Caso prefira instalar o PostgreSQL nativamente (Windows, macOS ou Linux):

1. Baixe o instalador oficial em [https://www.postgresql.org/download/](https://www.postgresql.org/download/).
2. Durante a instalação, defina usuário, senha e porta. Anote essas informações.
3. Crie um banco de dados (por exemplo, `mini_projeto_fullstack`).
4. Monte a string de conexão no formato:

   ```env
DATABASE_URL=postgresql://SEU_USUARIO:SUA_SENHA@localhost:5432/mini_projeto_fullstack
POSTGRES_SSL=false
   ```

## 3. Serviços gerenciados (nuvem)

Também é possível utilizar um provedor em nuvem para não precisar instalar nada localmente. Algumas opções com planos gratuitos:

- [Neon](https://neon.tech)
- [Supabase](https://supabase.com)
- [Render PostgreSQL](https://render.com)
- [Railway](https://railway.app)

O processo geral é:

1. Crie uma conta e um projeto/banco PostgreSQL.
2. Gere um usuário com permissões de leitura/escrita.
3. Copie a string de conexão fornecida (normalmente no formato `postgresql://usuario:senha@host:porta/base`).
4. Preencha o `.env`:

   ```env
DATABASE_URL=postgresql://usuario:senha@host:porta/base
POSTGRES_SSL=true
   ```

   Para a Neon, por exemplo, você verá algo semelhante a:

   ```env
DATABASE_URL=postgresql://neondb_owner:sua_senha@ep-xxxxx-pooler.sa-east-1.aws.neon.tech/neondb?sslmode=require
POSTGRES_SSL=true
   ```

   Utilize o valor completo mostrado no painel deles; ele já inclui `sslmode=require`, que garante a negociação TLS obrigatória.

> A variável `POSTGRES_SSL` habilita TLS quando necessário (muitos provedores exigem). Para ambientes locais, mantenha `false`.

## 4. Estrutura de tabelas

Com a string configurada, execute a aplicação (via `npm run dev`) para que as migrations sejam aplicadas? **Não há migrations automáticas.** Crie as tabelas manualmente antes de iniciar o servidor. Seguem scripts de referência:

Para aplicar o schema rapidamente quando estiver utilizando o banco que roda dentro do contêiner Docker, execute o comando abaixo **no terminal do host** (no diretório raiz do projeto):

```bash
cat sql/schema.sql | docker compose exec -T postgres psql -U mini_projeto -d mini_projeto_fullstack
```

O `cat` roda no host e envia o conteúdo do arquivo para o `psql` dentro do contêiner, evitando o erro “`sql/schema.sql: No such file or directory`”.

Se você estiver com o `psql` instalado localmente (ou conectado a um provedor externo) e tiver acesso direto ao arquivo, também pode usar uma das abordagens abaixo:

- carregar o arquivo interativamente:

  ```sql
  \i sql/schema.sql
  ```

- ou apontar a string de conexão completa direto no terminal do host (ideal para serviços como o Neon):

  ```bash
  psql "postgresql://usuario:senha@host:porta/base?sslmode=require" -f sql/schema.sql
  ```

  > Substitua `usuario`, `senha`, `host`, `porta` e `base` pelos valores fornecidos pelo provedor. No exemplo da Neon, a URL recomendada costuma terminar com `-pooler`.

  Para quem está utilizando **Neon** (como nas credenciais geradas pelos templates da Vercel), o comando completo fica semelhante a:

  ```bash
  psql "postgresql://neondb_owner:SEU_TOKEN@ep-exemplo-pooler.sa-east-1.aws.neon.tech/neondb?sslmode=require" -f sql/schema.sql
  ```

  Basta substituir `SEU_TOKEN` e o subdomínio `ep-exemplo` pelos valores reais disponibilizados no painel da Neon.

> **E se o comando `psql` não existir?** Instale o cliente antes de executar os exemplos acima.
>
> - **Debian/Ubuntu (inclui GitHub Codespaces):** `sudo apt-get update && sudo apt-get install -y postgresql-client`
> - **macOS com Homebrew:** `brew install libpq` seguido de `brew link --force libpq`
> - **Windows:** use o instalador oficial do PostgreSQL e marque a opção *Command Line Tools* ou instale o pacote "psql" disponível no [StackBuilder](https://www.postgresql.org/download/windows/).
>
> Se você não puder instalar nada no host, execute o cliente a partir de um contêiner efêmero:
>
> ```bash
> cat sql/schema.sql | docker run --rm -i postgres:16-alpine psql "postgresql://usuario:senha@host:porta/base?sslmode=require"
> ```
>
> Para a Neon, o comando ficaria, por exemplo:
>
> ```bash
> cat sql/schema.sql | docker run --rm -i postgres:16-alpine psql "postgresql://neondb_owner:SEU_TOKEN@ep-exemplo-pooler.sa-east-1.aws.neon.tech/neondb?sslmode=require"
> ```
>
> O `docker run` baixa a imagem oficial do PostgreSQL, executa o `psql` com a string informada e encerra automaticamente após aplicar o schema.

O arquivo [`sql/schema.sql`](../sql/schema.sql) contém todas as instruções necessárias:

```sql
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  status VARCHAR(50) NOT NULL DEFAULT 'pending',
  due_date TIMESTAMPTZ,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tasks_user_id ON tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
```

> **Dica:** se você estiver em um provedor que não permite instalar a extensão `uuid-ossp`, habilite `pgcrypto` (`CREATE EXTENSION IF NOT EXISTS "pgcrypto";`) e troque `uuid_generate_v4()` por `gen_random_uuid()` no arquivo antes de executá-lo.

## 5. Variáveis de ambiente

Após escolher a estratégia, copie `.env.example` para `.env` e ajuste as variáveis:

```bash
cp .env.example .env
```

Edite o arquivo resultante informando `DATABASE_URL`, `DATABASE_URL_PROD` (se for fazer deploy) e um `JWT_SECRET` seguro. Lembre-se de ativar `POSTGRES_SSL=true` ao usar provedores externos.

Com isso o backend estará pronto para conectar-se ao PostgreSQL.
