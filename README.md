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

## Estrutura do projeto

```
portal_vagas/
├── backend/
│   ├── .env.example
│   ├── package.json
│   └── src/
│       ├── app.js              # entrada da aplicação
│       ├── config/             # database, cors, helmet e rate limit
│       ├── controllers/        # auth e usuário
│       ├── middlewares/        # autenticação JWT e validação com Zod
│       ├── models/             # modelos Sequelize
│       ├── routes/             # rotas da API
│       └── schemas/            # schemas de validação (Zod)
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

### Limites de requisição

Janela de 15 minutos por IP: 100 requisições no total, 10 nas rotas de cadastro e perfil e 3 no login.

## Licença

Distribuído sob a licença MIT. Veja [LICENSE](./LICENSE).
