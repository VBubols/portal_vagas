# Portal de Vagas

Portal agregador de vagas de tecnologia, no estilo Indeed, focado em quem está começando a carreira. O candidato preenche o currículo uma única vez, recebe vagas ordenadas por compatibilidade com o seu perfil, vê quais requisitos atende e quais faltam, e exporta o currículo em PDF compatível com ATS.

> **Status:** backend em desenvolvimento. Já funcionam autenticação, gestão de conta, administração de usuários, skills, **CRUD do currículo**, exportação em PDF, busca/recomendação de vagas com match e a documentação Swagger. Ainda falta a rotina que importa as vagas do GitHub para o banco, a gestão de vagas pelo admin e o frontend (ver [Status e roadmap](#status-e-roadmap)).

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

## Status e roadmap

| Área | Situação | Detalhe |
| --- | --- | --- |
| Autenticação e conta | Pronto | Cadastro, login (JWT), perfil, troca de senha e desativação. CPF salvo cifrado (AES-256-GCM) e com hash para unicidade |
| Administração de usuários | Pronto | Listar, desativar e reativar (perfil `admin`) |
| Skills | Pronto | Tabela única, seed inicial e autocomplete |
| **Currículo (CRUD)** | **Pronto** | `POST`, `GET` e `PUT /curriculo`, com validação Zod e gravação em transação |
| Exportação do currículo em PDF | Pronto | `GET /curriculo/pdf`, compatível com ATS |
| Vagas: busca, recomendação e detalhe | Pronto | Filtros, paginação e match por compatibilidade |
| Documentação da API | Pronto | Swagger em `/docs`, com todas as rotas documentadas |
| Integração com o GitHub | Parcial | Leitura das issues e mapeamento de labels prontos e validados por script. **Falta a rotina de sincronização que grava as vagas no banco**: hoje nada cria registros em `vaga`, então as rotas de vagas devolvem listas vazias até essa etapa existir |
| Admin: gestão de vagas | Pendente | Cadastrar, editar e remover vagas internas e ocultar vagas importadas |
| Frontend | Fora deste repositório | O CORS já está preparado para o Vite em `localhost:5173` |

Pendências técnicas conhecidas:

- O `sequelize.sync()` cria as tabelas que faltam, mas **não altera** tabelas existentes. Não há migrations: mudou um model, é preciso recriar ou alterar a tabela à mão.
- `usuario.controller.js` ainda não usa `usuario.service.js` (que já tem a validação de e-mail/CPF repetidos e a serialização com CPF mascarado). Hoje `POST /usuario/perfil` persiste só `nome` e `email`.
- A exportação em PDF carrega o currículo com uma função própria (`carregarCurriculoCompleto`), parecida com a do `curriculo.service.js`. Dá para unificar depois.

Funcionalidades fora do MVP (empresas, importação de CV em PDF, match semântico etc.) estão em [mvp/mvp.md](./mvp/mvp.md).

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
│   ├── scripts/                # scripts manuais de apoio (GitHub e labels)
│   ├── src/
│   │   ├── app.js              # entrada da aplicação
│   │   ├── config/             # database, cors, helmet, rate limit, swagger, fontes e mapeamento de labels
│   │   ├── constants/          # enums compartilhados (nível, modalidade, UF, grau...) e limites do currículo
│   │   ├── controllers/        # auth, usuário, admin, skills, vagas, currículo e PDF
│   │   ├── middlewares/        # autenticação JWT, autorização por papel, validação com Zod e erros
│   │   ├── models/             # modelos Sequelize e associações (index.js)
│   │   ├── routes/             # rotas da API (com a documentação @openapi)
│   │   ├── schemas/            # schemas de validação (Zod)
│   │   ├── seeds/              # carga inicial (admin e skills)
│   │   ├── services/           # regras de negócio: auth, currículo, match, vagas, PDF e GitHub
│   │   └── utils/              # cripto, CPF, normalização de texto, serializadores, LIKE seguro e paginação
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

| Variável            | Obrigatória | Descrição                                                                 |
| ------------------- | ----------- | ------------------------------------------------------------------------- |
| `PORT`              | Sim         | Porta da API                                                              |
| `DB_HOST`           | Sim         | Host do PostgreSQL                                                        |
| `DB_PORT`           | Sim         | Porta do PostgreSQL                                                       |
| `DB_USER`           | Sim         | Usuário do banco                                                          |
| `DB_PASSWORD`       | Sim         | Senha do banco                                                            |
| `DB_NAME`           | Sim         | Nome do banco                                                             |
| `JWT_SECRET`        | Sim         | Segredo usado para assinar os tokens                                      |
| `JWT_EXPIRES_IN`    | Não         | Validade do token (padrão `1h`)                                           |
| `CPF_CHAVE_CRIPTO`  | Sim         | Chave que cifra o CPF: 64 caracteres hexadecimais                         |
| `CPF_CHAVE_HASH`    | Sim         | Chave do hash do CPF: 64 caracteres hexadecimais, **diferente** da anterior |
| `ADMIN_EMAIL`, `ADMIN_SENHA` | Só no seed | Credenciais do primeiro admin (`ADMIN_NOME` e `ADMIN_SOBRENOME` são opcionais) |
| `GITHUB_TOKEN`      | Não         | Sem ele a API do GitHub limita a 60 requisições por hora                  |

A API não sobe se alguma variável obrigatória estiver ausente ou se as chaves do CPF forem inválidas. Para gerar uma chave:

```bash
openssl rand -hex 32
```

### Carga inicial

```bash
npm run seed:skills   # idempotente; cria as tabelas que faltarem e as skills ainda não cadastradas
npm run seed          # cria o primeiro admin a partir de ADMIN_EMAIL e ADMIN_SENHA (idempotente)
```

### Testes

```bash
npm test
```

Cobrem as regras de match, os schemas de validação (vagas e currículo), o serializador do currículo e a geração do PDF. Não precisam de banco.

### Execução

```bash
npm run dev     # desenvolvimento, com nodemon
npm start       # produção
```

Ao subir, a API roda `sequelize.sync()` e cria as tabelas que ainda não existem. Ele não altera tabelas já criadas (veja as [pendências técnicas](#status-e-roadmap)).

## API

Requisições autenticadas usam o header `Authorization: Bearer <token>`. O CORS aceita as origens `localhost:5173` (frontend em Vite) e `localhost:3000`.

### Autenticação

| Método | Rota             | Descrição                                                                                       |
| ------ | ---------------- | ----------------------------------------------------------------------------------------------- |
| `POST` | `/auth/cadastro` | Cria uma conta (`nome`, `sobrenome`, `email`, `senha`, `cpf`, `telefoneCelular`, `dataNascimento`, `paisOrigem`; `telefoneFixo` é opcional) |
| `POST` | `/auth/login`    | Retorna o token JWT e o usuário (`email`, `senha`)                                              |

Os erros de validação de corpo respondem `400` com `{ mensagem, detalhes: [{ campo, mensagem }] }`.

### Usuário (requer autenticação)

| Método   | Rota              | Descrição                                  |
| -------- | ----------------- | ------------------------------------------ |
| `GET`    | `/usuario/perfil` | Retorna os dados do usuário logado         |
| `POST`   | `/usuario/perfil` | Atualiza `nome` e/ou `email`               |
| `POST`   | `/usuario/senha`  | Troca a senha (`senhaAntiga`, `novaSenha`) |
| `DELETE` | `/usuario/conta`  | Desativa a conta (exclusão lógica)         |

### Admin (requer autenticação e perfil `admin`)

| Método  | Rota                             | Descrição                                          |
| ------- | -------------------------------- | -------------------------------------------------- |
| `GET`   | `/admin/usuarios`                | Lista usuários (`pagina`, `limite`, `busca`)       |
| `PATCH` | `/admin/usuarios/:id/desativar`  | Desativa um usuário (não vale para a própria conta) |
| `PATCH` | `/admin/usuarios/:id/reativar`   | Reativa um usuário                                 |

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

Cada usuário tem no máximo um currículo.

| Método | Rota             | Descrição                                                                 |
| ------ | ---------------- | ------------------------------------------------------------------------- |
| `POST` | `/curriculo`     | Cria o currículo. `201` com o currículo completo; `409` se já existir     |
| `GET`  | `/curriculo`     | Devolve o currículo completo; `404` se ainda não foi preenchido           |
| `PUT`  | `/curriculo`     | Substitui o currículo inteiro; `404` se ainda não existir (não cria)      |
| `GET`  | `/curriculo/pdf` | Exporta o currículo em PDF compatível com ATS                             |

O corpo do `POST` e do `PUT` é o mesmo:

```json
{
  "nomeCompleto": "Maria da Conceição",
  "titulo": "Desenvolvedora Front-end Júnior",
  "emailContato": "maria@exemplo.com",
  "telefone": "(48) 99999-0000",
  "resumo": "Desenvolvedora em início de carreira.",
  "nivel": "junior",
  "modalidades": ["remoto", "hibrido"],
  "cidade": "Palhoça",
  "uf": "SC",
  "locais": [{ "cidade": "Florianópolis", "uf": "SC" }],
  "experiencias": [
    { "empresa": "ACME", "cargo": "Estagiária", "inicio": "2023-01", "atual": true }
  ],
  "formacoes": [
    { "instituicao": "UFSC", "curso": "Sistemas de Informação", "grau": "graduacao",
      "situacao": "cursando", "inicio": "2021-02", "fim": "2025-12" }
  ],
  "cursos": [{ "nome": "React", "cargaHoraria": 40, "conclusao": "2023-05" }],
  "idiomas": [{ "idioma": "Inglês", "nivel": "intermediario" }],
  "links": [{ "tipo": "github", "url": "https://github.com/maria" }],
  "projetos": [{ "nome": "Portal", "tecnologias": ["React", "Node.js"] }],
  "skills": ["<id da skill, obtido em GET /skills>"]
}
```

Regras:

- **Obrigatórios:** `nomeCompleto` (nome e sobrenome), `titulo`, `emailContato`, `telefone`, `resumo`, `nivel`, `modalidades` (ao menos uma), `cidade` e `uf`. São as colunas `NOT NULL` do model. Todas as listas e `skills` são opcionais.
- **Valores fixos:** `nivel`, `modalidades`, `uf`, `grau`, `situacao`, idioma `nivel` e link `tipo` vêm de `src/constants/enums.js`.
- **Telefone:** fixo ou celular, com DDD, com ou sem `+55`. É salvo formatado, como `(48) 99999-0000`.
- **Datas:** `AAAA-MM` (campo de mês do formulário) ou `AAAA-MM-DD`; é sempre gravada como `AAAA-MM-DD` (`AAAA-MM` vira o dia 01) e o PDF mostra `MM/AAAA`. `fim` não pode ser anterior a `inicio`. Em experiência, sem `atual: true` o `fim` é obrigatório; com `atual: true` ele é descartado.
- **Links e projetos:** a URL precisa ser `http://` ou `https://`.
- **Skills:** são ids existentes na tabela `skill`; ids repetidos são unificados e ids inexistentes dão `400`. São opcionais na gravação, mas sem ao menos uma o currículo não entra no match (veja `completude`).
- **Limites:** definidos em `src/constants/curriculo.limites.js` (combinados com o grupo) e usados pela validação e pelo Swagger. Por lista: experiências 10, formações 6, cursos 15, idiomas 6, links 6, locais 5, projetos 6 e skills 30. Textos: nome 100, título 80, resumo 600, descrição de experiência 500, descrição de projeto 400, URL 200.
- **Campos desconhecidos são ignorados:** `id`, `usuarioId` e `cidadeNormalizada` nunca vêm do cliente.
- **`PUT` substitui tudo:** listas ausentes no corpo ficam vazias. A gravação é atômica (transação): se algo falhar, o currículo anterior permanece intacto.
- **Ordem das listas:** o banco não guarda a posição dos itens, então a resposta sai em ordem fixa: experiências e formações da mais recente para a mais antiga, e as demais em ordem alfabética.
- **Resposta:** não traz `usuarioId`, `cidadeNormalizada` nem os ids dos itens das listas (o `PUT` os recria). Traz `completude: { match, pdf }`, que diz se o currículo já tem o necessário para o match (nível, modalidade, cidade, UF e ao menos uma skill) e para o PDF (o anterior, mais resumo e ao menos uma formação). É só informativo: não bloqueia nada.

### Como funciona o match

1. **Filtros eliminatórios:** nível igual ao do CV; modalidade entre as aceitas pelo CV; localização na cidade do CV ou em um dos locais aceitos (vaga remota serve para qualquer lugar).
2. **Dado ausente não elimina:** se a vaga não informa nível, modalidade ou local, o critério fica `null` e a vaga continua elegível. Muitas issues do GitHub não trazem todas as labels.
3. **Pontuação:** `skills da vaga que o usuário tem ÷ total de skills da vaga × 100`, arredondada. Vaga sem skills cadastradas fica com `compatibilidade: null`.
4. **Ordenação:** maior % primeiro; vagas sem % no fim; empate pela vaga mais recente.

### PDF compatível com ATS

Coluna única, texto real e selecionável, fonte padrão (Helvetica), sem tabelas, imagens ou ícones, títulos de seção convencionais em português, datas em `MM/AAAA` e seções vazias omitidas. Caracteres fora do Latin-1 (como emojis) são removidos para não quebrar a fonte.

### Documentação interativa

Com a API no ar, acesse `GET /docs` (Swagger UI) ou `GET /docs.json` (especificação OpenAPI).

Todas as rotas da API estão documentadas, agrupadas por tag: Autenticação, Usuário, Admin, Skills, Vagas e Currículo. Cada bloco traz parâmetros, corpo, respostas e erros possíveis.

Cada pessoa documenta as próprias rotas: escreva um bloco `@openapi` em YAML logo acima da rota, no arquivo em `src/routes/` (modelo em `routes/vaga.routes.js`). Schemas e parâmetros usados em mais de uma rota ficam em `components`, em `src/config/swagger.js`. Dica: descrição que começa com crase precisa de aspas no YAML, senão o `swagger-jsdoc` descarta a rota inteira.

### Limites de requisição

Janela de 15 minutos por IP: 100 requisições no total, 10 no cadastro e 3 tentativas de login que falham (logins bem-sucedidos não contam).

## Licença

Distribuído sob a licença MIT. Veja [LICENSE](./LICENSE).
