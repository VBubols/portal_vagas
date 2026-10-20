# Portal de Vagas

Portal agregador de vagas de tecnologia, no estilo Indeed, focado em quem está começando a carreira. O candidato preenche o currículo uma única vez, recebe vagas ordenadas por compatibilidade com o seu perfil, vê quais requisitos atende e quais faltam, e exporta o currículo em PDF compatível com ATS.

> **Status:** em desenvolvimento inicial. O backend tem autenticação e gestão de conta do usuário. O restante do escopo do MVP está planejado (ver [Roadmap](#roadmap)).

## Problema

Pessoas em início de carreira em tecnologia têm dificuldade para encontrar vagas aderentes ao seu perfil. As vagas existem, mas são difíceis de encontrar e filtrar, e o currículo muitas vezes não está adequado ao que a vaga pede.

## Solução

- **Vagas agregadas** de repositórios da comunidade no GitHub, normalizadas em um único modelo.
- **Currículo estruturado**, preenchido uma vez e reaproveitado em qualquer candidatura.
- **Match por compatibilidade**: vagas ordenadas pela % de skills que o candidato atende.
- **Exportação em PDF compatível com ATS**, gerado a partir dos dados do formulário.

## Perfis de acesso

| Perfil              | Responsabilidades                                                                                      |
| ------------------- | ------------------------------------------------------------------------------------------------------ |
| Usuário (candidato) | Preenche e exporta o CV, recebe vagas recomendadas, busca e filtra vagas, acessa o link de candidatura |
| Admin               | Gerencia usuários e vagas, incluindo o cadastro de vagas internas                                      |

## Escopo do MVP

### Vagas

- **Fontes:** issues dos repositórios `frontendbr/vagas` e `backend-br/vagas`, importadas pela API REST do GitHub, ampliadas com os repositórios por stack e região. Somar fontes compensa o baixo volume de vagas júnior em cada repositório.
- **Mapeamento de labels:** uma tabela por fonte traduz as labels de cada repositório ("Júnior", "Junior", "Jr") para valores padronizados de nível, tipo de contratação, modalidade e stack.
- **Modelo híbrido:** uma única tabela de vagas com campo de origem (`github` ou `interna`) e link de candidatura, para que empresas entrem no futuro sem retrabalho.
- **Skills da vaga:** identificadas pelas labels do GitHub e pela busca, no texto da descrição, das skills cadastradas.
- **Candidatura por link externo:** o usuário é redirecionado para a página da vaga.
- **Busca e filtros:** por texto, nível, modalidade e stack.

### Currículo

- **Formulário estruturado (estilo Gupy):** contato, resumo, experiências, formação, cursos, skills, nível, modalidade, localização, idiomas e links (GitHub, LinkedIn, portfólio).
- **Skills como tags normalizadas:** tabela única com autocomplete, usada no CV e nas vagas.
- **Exportação em PDF compatível com ATS.**

### Match

1. **Filtros eliminatórios:** a vaga só é recomendada se nível, modalidade e localização forem compatíveis com o CV. Vagas remotas servem para qualquer localização.
2. **Pontuação:** `skills da vaga que o usuário tem ÷ total de skills da vaga × 100`.
3. **Ordenação:** maior compatibilidade primeiro.
4. **Exibição:** o card mostra a %; o detalhe mostra as skills que o usuário tem e as que faltam.

### Admin

- Gerencia usuários (listar, desativar, reativar).
- Cadastra, edita e remove vagas internas, e oculta vagas importadas do GitHub (que não são editáveis, pois a sincronização sobrescreveria a edição).

Detalhes em [mvp/mvp.md](./mvp/mvp.md) e diagramas dos fluxos em [mvp/user-flows.md](./mvp/user-flows.md).

## Stack

| Camada         | Tecnologia                          |
| -------------- | ----------------------------------- |
| Runtime        | Node.js (ES Modules)                |
| API            | Express 5                           |
| Banco de dados | PostgreSQL + Sequelize              |
| Autenticação   | JWT (`jsonwebtoken`) e `bcryptjs`   |
| Validação      | Zod                                 |
| Segurança      | Helmet, CORS e `express-rate-limit` |
| PDF            | PDFKit                              |
| Documentação   | Swagger (OpenAPI 3) via `swagger-jsdoc` |
| Testes         | `node:test` (runner nativo do Node) |

## Estrutura do projeto

```
portal_vagas/
├── backend/
│   ├── .env.example
│   ├── package.json
│   ├── src/
│   │   ├── app.js              # entrada da aplicação
│   │   ├── config/             # database, cors, helmet, rate limit e swagger
│   │   ├── constants/          # enums compartilhados (nível, modalidade, UF...)
│   │   ├── controllers/        # auth, usuário, vagas e PDF do currículo
│   │   ├── middlewares/        # autenticação JWT e validação com Zod
│   │   ├── models/             # modelos Sequelize e associações (index.js)
│   │   ├── routes/             # rotas da API (com a documentação @openapi)
│   │   ├── schemas/            # schemas de validação (Zod)
│   │   ├── seeds/              # carga inicial (skills)
│   │   ├── services/           # regras de negócio: match, busca de vagas e PDF
│   │   └── utils/              # normalização de texto, LIKE seguro e paginação
│   └── tests/                  # testes automatizados
├── mvp/
│   ├── mvp.md                  # escopo do MVP
│   └── user-flows.md           # fluxos em Mermaid
├── LICENSE
└── README.md
```

## Como rodar

### Pré-requisitos

- Node.js 20 ou superior
- PostgreSQL em execução, com um banco criado para a aplicação

### Instalação

```bash
git clone <url-do-repositorio>
cd portal_vagas/backend
npm install
cp .env.example .env
```

Preencha o `.env`:

| Variável         | Descrição                            |
| ---------------- | ------------------------------------ |
| `PORT`           | Porta da API                         |
| `DB_HOST`        | Host do PostgreSQL                   |
| `DB_PORT`        | Porta do PostgreSQL                  |
| `DB_USER`        | Usuário do banco                     |
| `DB_PASSWORD`    | Senha do banco                       |
| `DB_NAME`        | Nome do banco                        |
| `JWT_SECRET`     | Segredo usado para assinar os tokens |
| `JWT_EXPIRES_IN` | Validade do token (ex.: `1h`)        |

### Skills iniciais

```bash
npm run seed:skills   # idempotente; cria as tabelas que faltarem e as skills ainda não cadastradas
```

### Testes

```bash
npm test
```

Cobrem as regras de match, os schemas de validação e a geração do PDF. Não precisam de banco.

### Execução

```bash
npm run dev     # desenvolvimento, com nodemon
npm start       # produção
```

> **Atenção:** o `sequelize.sync()` está comentado em `src/app.js`, então as tabelas não são criadas automaticamente. Habilite o trecho comentado na primeira execução para criar o schema.

## API

Requisições autenticadas usam o header `Authorization: Bearer <token>`. O CORS aceita as origens `localhost:5173` (frontend em Vite) e `localhost:3000`.

### Autenticação

| Método | Rota             | Descrição                                 |
| ------ | ---------------- | ----------------------------------------- |
| `POST` | `/auth/cadastro` | Cria uma conta (`nome`, `email`, `senha`) |
| `POST` | `/auth/login`    | Retorna o token JWT (`email`, `senha`)    |

### Usuário (requer autenticação)

| Método   | Rota              | Descrição                                  |
| -------- | ----------------- | ------------------------------------------ |
| `GET`    | `/usuario/perfil` | Retorna os dados do usuário logado         |
| `POST`   | `/usuario/perfil` | Atualiza `nome` e/ou `email`               |
| `POST`   | `/usuario/senha`  | Troca a senha (`senhaAntiga`, `novaSenha`) |
| `DELETE` | `/usuario/conta`  | Desativa a conta (exclusão lógica)         |

### Skills (requer autenticação)

| Método | Rota                    | Descrição                                              |
| ------ | ----------------------- | ------------------------------------------------------ |
| `GET`  | `/skills?busca=&limit=` | Autocomplete de skills (`[{ id, nome }]`), máx. 20     |

### Vagas (requer autenticação)

| Método | Rota                  | Descrição                                                                 |
| ------ | --------------------- | ------------------------------------------------------------------------- |
| `GET`  | `/vagas`              | Busca com filtros e paginação. Traz `compatibilidade` se o usuário tem CV |
| `GET`  | `/vagas/recomendadas` | Vagas compatíveis com o CV, ordenadas por % de match                      |
| `GET`  | `/vagas/:id`          | Detalhe da vaga com o match: skills que o usuário tem e as que faltam     |

Filtros (em `/vagas` e `/vagas/recomendadas`): `q` (texto), `nivel`, `modalidade`, `stack`, `pagina` (padrão 1) e `limite` (padrão 20, máximo 50). Os filtros de lista aceitam `?nivel=junior,estagio` ou o parâmetro repetido. A resposta de lista é `{ dados, paginacao: { pagina, limite, total, totalPaginas } }`.

A busca por texto exige que cada palavra apareça no título, na empresa, na descrição ou nas skills da vaga (nome ou alias: `js` encontra vagas de JavaScript). Só aparecem vagas ativas e não ocultas.

### Currículo (requer autenticação)

| Método | Rota             | Descrição                                          |
| ------ | ---------------- | -------------------------------------------------- |
| `GET`  | `/curriculo/pdf` | Exporta o currículo do usuário em PDF compatível com ATS |

### Como funciona o match

1. **Filtros eliminatórios:** nível igual ao do CV; modalidade entre as aceitas pelo CV; localização na cidade do CV ou em um dos locais aceitos (vaga remota serve para qualquer lugar).
2. **Dado ausente não elimina:** se a vaga não informa nível, modalidade ou local, o critério fica `null` e a vaga continua elegível. Muitas issues do GitHub não trazem todas as labels.
3. **Pontuação:** `skills da vaga que o usuário tem ÷ total de skills da vaga × 100`, arredondada. Vaga sem skills cadastradas fica com `compatibilidade: null`.
4. **Ordenação:** maior % primeiro; vagas sem % no fim; empate pela vaga mais recente.

### PDF compatível com ATS

Coluna única, texto real e selecionável, fonte padrão (Helvetica), sem tabelas, imagens ou ícones, títulos de seção convencionais em português, datas em `MM/AAAA` e seções vazias omitidas. Caracteres fora do Latin-1 (como emojis) são removidos para não quebrar a fonte.

### Documentação interativa

Com a API no ar, acesse `GET /docs` (Swagger UI) ou `GET /docs.json` (especificação OpenAPI).

Para documentar uma rota, escreva um bloco `@openapi` em YAML logo acima dela, no arquivo em `src/routes/` (modelo em `routes/vaga.routes.js`). Schemas e parâmetros reaproveitáveis ficam em `components`, em `src/config/swagger.js`.

### Limites de requisição

Janela de 15 minutos por IP: 100 requisições no total, 10 nas rotas de cadastro e perfil e 3 no login.

## Licença

Distribuído sob a licença MIT. Veja [LICENSE](./LICENSE).
