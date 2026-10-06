# Portal de Vagas: Escopo do MVP

## Problema

Pessoas em início de carreira em tecnologia têm dificuldade para encontrar vagas aderentes ao seu perfil. As vagas existem, mas são difíceis de encontrar e filtrar, e o currículo muitas vezes não está adequado ao que a vaga pede.

## Solução

Portal agregador de vagas de tecnologia no estilo Indeed, focado em quem tem pouca experiência. O usuário preenche o currículo uma única vez, recebe vagas ordenadas por compatibilidade com o seu perfil, vê quais requisitos atende e quais faltam, e exporta o currículo em PDF compatível com ATS.

## Perfis de acesso

| Perfil | Responsabilidades |
| --- | --- |
| Usuário (candidato) | Preenche e exporta o CV, recebe vagas recomendadas, busca e filtra vagas, acessa o link de candidatura |
| Admin | Gerencia usuários e vagas, incluindo o cadastro de vagas internas |

## Funcionalidades do MVP

### Vagas

1. **Fontes:** repositórios de vagas da comunidade no GitHub, importados pela API REST do GitHub (endpoint de Issues). A base inicial é `frontendbr/vagas` e `backend-br/vagas`, ampliada com os repositórios por stack e região listados no README do frontendbr (React/React Native, Node.js, Python, QA, .NET, Go, entre outros). Somar fontes compensa o baixo volume de vagas júnior em cada repositório. As labels das issues já trazem nível, tipo de contratação, modalidade e stack.
2. **Tabela de mapeamento de labels:** cada repositório nomeia as labels do seu jeito ("Júnior", "Junior", "Jr"). Uma tabela de mapeamento por fonte traduz essas labels para os valores padronizados do modelo (nível, tipo de contratação, modalidade e stack).
3. **Modelo híbrido:** uma única tabela de vagas com campo de origem (`github` ou `interna`) e link de candidatura. Empresas entram no futuro sem retrabalho.
4. **Skills da vaga:** identificadas pelas labels do GitHub e pela busca, no texto da descrição, das skills cadastradas no sistema.
5. **Candidatura por link externo:** o usuário é redirecionado para a página da vaga.
6. **Busca e filtros:** por texto, nível, modalidade e stack.

### Currículo

1. **Formulário estruturado (estilo Gupy):** o CV completo é preenchido de uma vez no cadastro: contato, resumo, experiências, formação, cursos, skills, nível, modalidade, localização, idiomas e links (GitHub, LinkedIn, portfólio).
2. **Skills como tags normalizadas:** uma tabela única de skills, com autocomplete, usada tanto no CV quanto nas vagas.
3. **Exportação em PDF compatível com ATS:** gerado a partir dos dados do formulário. O usuário preenche uma vez e reaproveita em qualquer candidatura.

### Match

1. **Filtros eliminatórios:** a vaga só é recomendada se nível, modalidade e localização forem compatíveis com o CV. Vagas remotas são compatíveis com qualquer localização.
2. **Pontuação:** % de compatibilidade = skills da vaga que o usuário tem ÷ total de skills da vaga × 100.
3. **Ordenação:** maior compatibilidade primeiro.
4. **Exibição:** o card da vaga mostra a %. O detalhe mostra as skills que o usuário tem e as que faltam.

### Admin

1. Gerencia usuários (listar, desativar, reativar).
2. Gerencia vagas: cadastra, edita e remove vagas internas, e oculta vagas importadas do GitHub.

## Fora do MVP (próximas fases)

1. **Papel Empresa:** login e cadastro próprio de vagas.
2. **Segurança:** JWT, Bcrypt, Zod, rate limit e CORS.
3. **Importação de CV em PDF.**
4. **Match semântico com embeddings.**
5. **CV adaptado por vaga:** reordena o CV destacando as skills que a vaga pede, sem inventar nada.
6. **Acompanhamento de candidaturas:** após o redirecionamento, perguntar "Você se candidatou?" e registrar a resposta em "Minhas candidaturas".

## User flows

Ver [user-flows.md](./user-flows.md).
