# Deploy: Supabase + Vercel

O portal em produção tem três partes:

| Parte | Onde | O que é |
|---|---|---|
| Banco | Supabase | Postgres gerenciado |
| API | Vercel, projeto 1 (pasta `backend`) | O Express vira uma função da Vercel |
| Front | Vercel, projeto 2 (pasta `frontend`) | O build do Vite, servido como site estático |

Os dois projetos da Vercel usam o mesmo repositório, cada um com a sua pasta. A primeira vez leva uns 40 minutos.

## Antes de começar

- Conta no [Supabase](https://supabase.com) e na [Vercel](https://vercel.com), as duas entrando com o GitHub de quem é dono do repositório.
- No computador: Node 22 (`nvm use`), `npm install` feito dentro de `backend/` e o `openssl` (já vem no Ubuntu).
- Um token do GitHub para a sincronização de vagas: um *fine-grained token* com acesso só de leitura a repositórios públicos e data de validade.

## 0. Levar a dev para a main

A Vercel publica a branch `main`. Ela tem um README antigo que conflita com o da `dev`, então primeiro a `dev` incorpora a `main` mantendo os próprios arquivos:

```bash
git checkout dev && git pull
git merge -s ours origin/main -m "chore: incorpora a main na dev mantendo o README da dev"
git push
```

Depois, no GitHub, abra um PR de `dev` para `main` e faça o merge. Ele entra sem conflito.

## 1. Supabase: criar o banco

1. **New project**.
   - **Name:** `portal-vagas`.
   - **Database Password:** use só letras e números. Caractere especial na senha precisa ser codificado na URL de conexão e costuma dar erro. Guarde a senha.
   - **Region:** South America (São Paulo). A API roda em São Paulo (definido no `backend/vercel.json`), e banco e API na mesma região deixam cada consulta muito mais rápida. Isso pesa na sincronização de vagas, que faz milhares de consultas.
2. Com o projeto criado, clique em **Connect**, no topo do painel, e escolha o método **Transaction pooler**. Copie a string, que tem este formato:
   ```
   postgresql://postgres.<ref>:[YOUR-PASSWORD]@aws-<n>-sa-east-1.pooler.supabase.com:6543/postgres
   ```
   Troque `[YOUR-PASSWORD]` pela senha. Essa é a `DATABASE_URL`. A porta 6543 é a do pooler, que aguenta as várias conexões curtas de uma função serverless. O SSL é ligado pelo próprio backend, então não precisa acrescentar nada na URL.
3. **Desligue a Data API.** Procure por **Data API** no painel do projeto e desligue **Enable Data API**. O Supabase expõe as tabelas do schema `public` por uma API REST própria, e as nossas tabelas, criadas pelo Sequelize, não têm RLS. Com ela ligada, quem tivesse a chave pública do projeto poderia ler a tabela `usuario`. O portal não usa essa API: todo acesso passa pelo nosso backend.

## 2. Criar as tabelas e os dados iniciais

Isso roda uma vez, do teu computador, apontando para o Supabase. Na Vercel a API não cria tabelas sozinha.

```bash
cd backend
SUPA='postgresql://postgres.<ref>:<senha>@aws-<n>-sa-east-1.pooler.supabase.com:6543/postgres'

DATABASE_URL="$SUPA" npm run seed:skills
DATABASE_URL="$SUPA" ADMIN_EMAIL='admin@portalvagas.dev' ADMIN_SENHA='<senha-forte>' npm run seed
```

A saída esperada é `Skills: 67 criadas, 0 já existiam.` e `Admin criado: admin@portalvagas.dev`. No Supabase, em **Table Editor**, aparecem 13 tabelas.

Por que assim:

- O `seed:skills` cria todas as tabelas que faltam e depois as skills.
- A URL vai numa variável sem `export`, então o `npm run dev` continua usando o banco local do `.env`.
- O admin de produção é uma conta só de admin, separada das contas de candidato. A senha dele é a que você passar em `ADMIN_SENHA`.

## 3. Gerar os segredos de produção

```bash
openssl rand -hex 32   # JWT_SECRET
openssl rand -hex 32   # CPF_CHAVE_CRIPTO
openssl rand -hex 32   # CPF_CHAVE_HASH
```

Gere valores novos, diferentes dos do `.env` local, e guarde num lugar seguro. **Nunca troque as chaves do CPF depois que houver usuários cadastrados:** os CPFs já gravados ficam ilegíveis. Trocar o `JWT_SECRET` só desloga todo mundo.

## 4. Vercel: publicar a API

1. **Add New → Project** e importe `VBubols/portal_vagas`.
2. **Project Name:** `portal-vagas-api`. Ele vira o endereço `https://portal-vagas-api.vercel.app`. Se o nome estiver ocupado, a Vercel usa outro: anote o endereço final.
3. **Root Directory:** `backend`. **Framework Preset:** Express. A Vercel costuma detectar sozinha; se aparecer *Other*, troque para Express.
4. **Environment Variables:**

   | Variável | Valor |
   |---|---|
   | `DATABASE_URL` | A string do passo 1 |
   | `JWT_SECRET` | Gerado no passo 3 |
   | `JWT_EXPIRES_IN` | `1h` |
   | `CPF_CHAVE_CRIPTO` | Gerado no passo 3 |
   | `CPF_CHAVE_HASH` | Gerado no passo 3 |
   | `GITHUB_TOKEN` | O token fine-grained |

   Não precisa de `PORT`, das `DB_*` nem das `ADMIN_*`. O `CORS_ORIGINS` entra no passo 6, quando o endereço do front existir.
5. **Deploy.**
6. Abra `https://portal-vagas-api.vercel.app/docs`: a documentação do Swagger tem que aparecer.

## 5. Vercel: publicar o front

1. **Add New → Project** e importe o mesmo repositório de novo.
2. **Project Name:** `portal-vagas`. **Root Directory:** `frontend`. **Framework Preset:** Vite (detectado sozinho).
3. **Environment Variables:** `VITE_API_URL` = endereço da API do passo 4, **sem barra no fim**. Exemplo: `https://portal-vagas-api.vercel.app`.
4. **Deploy** e anote o endereço do site.

O valor de `VITE_API_URL` vai para dentro do build. Se mudar, faça um novo deploy do front.

## 6. Liberar o front no CORS

1. No projeto da API: **Settings → Environment Variables**, crie `CORS_ORIGINS` com o endereço do front, com `https://` e sem barra no fim. Exemplo: `https://portal-vagas.vercel.app`.
2. Em **Deployments**, abra o menu (⋯) do último deploy e clique em **Redeploy**. Variável nova só vale para deploys feitos depois dela.

## 7. Primeira carga de vagas

Entre no site com o admin do passo 2, abra **Admin** e clique em **Sincronizar vagas**.

Se a sincronização passar de 5 minutos, a Vercel corta a requisição e devolve 504. Nesse caso, rode pelo terminal, que não tem limite de tempo:

```bash
cd backend
DATABASE_URL="$SUPA" npm run vagas:sincronizar
```

O script usa o `GITHUB_TOKEN` do teu `.env` local.

## 8. Conferir

- [ ] Criar uma conta nova pelo site
- [ ] Preencher o currículo com skills e salvar
- [ ] As vagas recomendadas aparecem com a % de compatibilidade
- [ ] O detalhe de uma vaga mostra as skills que tem e as que faltam
- [ ] O PDF do currículo baixa
- [ ] Recarregar a página (F5) em `/vagas` não dá 404
- [ ] Admin: ocultar e reexibir uma vaga
- [ ] `/docs` da API abre

## Se algo der errado

Os erros da API ficam em **Logs**, no projeto da API na Vercel.

| Sintoma | Causa provável | O que fazer |
|---|---|---|
| Console do navegador com erro de CORS | `CORS_ORIGINS` diferente do endereço do front, ou a API não foi republicada | Confira `https://` e a falta de barra no fim, e faça Redeploy da API |
| O front chama `localhost:3000` | `VITE_API_URL` não existia no build | Crie a variável no projeto do front e faça Redeploy |
| 404 ao recarregar uma página do site | Root Directory do front errado, sem o `frontend/vercel.json` | Root Directory precisa ser `frontend` |
| Log: `Variáveis de ambiente ausentes` | Falta alguma variável do passo 4 | Crie a variável e faça Redeploy |
| Log: `Tenant or user not found` ou `password authentication failed` | URL de conexão errada | O usuário é `postgres.<ref>`, não só `postgres`. Copie de novo a string do Transaction pooler |
| Log: `relation "..." does not exist` | As tabelas não foram criadas | Rode o passo 2 |
| 504 ao sincronizar | A sincronização passou de 5 minutos | Use o `npm run vagas:sincronizar` do passo 7 |
| "Muitas tentativas de login" | 3 senhas erradas para o mesmo e-mail em 15 minutos | Espere 15 minutos ou aumente `LIMITE_LOGIN_FALHAS` |
| O site não carrega dados depois de dias parado | O Supabase gratuito pausa o projeto depois de uma semana sem uso | Reative o projeto no painel do Supabase |

## Depois do deploy

- **Push na `main`:** a Vercel republica os dois projetos sozinha.
- **Push em outra branch:** a Vercel cria um deploy de preview com outro endereço. A API não libera esse endereço no CORS, então o preview do front só funciona se você acrescentar o endereço dele em `CORS_ORIGINS`.
- **Model novo:** rode o `seed:skills` do passo 2 de novo, que cria as tabelas que faltam. Ele **não** altera colunas de tabelas que já existem: coluna nova numa tabela existente precisa de um `ALTER TABLE` no **SQL Editor** do Supabase.
- **Limites de requisição:** dá para ajustar sem mexer no código, pelas variáveis `LIMITE_REQUISICOES` (padrão 1000), `LIMITE_CADASTROS` (padrão 30) e `LIMITE_LOGIN_FALHAS` (padrão 3), todas por IP a cada 15 minutos. O de login conta por IP e e-mail.
