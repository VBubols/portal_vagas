# Portal de Vagas: User Flows

Diagramas em Mermaid, renderizados direto pelo GitHub. Escopo completo em [mvp.md](./mvp.md).

## 1. Usuário (jornada principal)

Do cadastro até o redirecionamento para a vaga, passando pelo CV, pelo match e pela exportação do PDF.

```mermaid
flowchart TD
    A["Landing page"] --> B{"Já tem conta?"}
    B -->|Não| C["Cadastro<br/>nome, e-mail e senha"]
    B -->|Sim| D["Login"]
    D --> E{"Credenciais válidas?"}
    E -->|Não| D
    E -->|Sim| H
    C --> F["Formulário do CV completo"]
    F --> G{"Campos obrigatórios<br/>preenchidos?"}
    G -->|Não| F
    G -->|Sim| H["Vagas recomendadas<br/>ordenadas por % de match"]
    H --> I{"Existem vagas<br/>compatíveis?"}
    I -->|Não| J["Estado vazio<br/>sugere ajustar filtros ou o CV"]
    I -->|Sim| L["Detalhe da vaga<br/>% de match, skills que tem e que faltam"]
    H --> K["Busca e filtros<br/>texto, nível, modalidade e stack"]
    K --> H
    J --> K
    J --> O
    L --> M["Candidatar-se"]
    M --> N["Redireciona para o link externo da vaga"]
    L -->|Voltar| H
    H --> O["Meu CV"]
    O --> P["Editar CV<br/>match é recalculado"]
    P --> O
    O --> Q["Exportar PDF compatível com ATS"]
```

## 2. Admin

Vagas importadas do GitHub não são editáveis, porque a sincronização sobrescreveria a edição. O admin só pode ocultá-las.

```mermaid
flowchart TD
    A["Login"] --> B["Painel do admin"]
    B --> C["Gerenciar vagas"]
    B --> D["Gerenciar usuários"]
    C --> E["Lista de vagas<br/>filtro por origem: GitHub ou interna"]
    E --> F["Cadastrar vaga interna<br/>título, empresa, descrição, nível,<br/>modalidade, localização, skills e link"]
    E --> G{"Origem da vaga?"}
    G -->|Interna| H["Editar ou remover"]
    G -->|GitHub| I["Ocultar ou reexibir"]
    D --> J["Lista de usuários"]
    J --> K["Desativar ou reativar usuário"]
```

## 3. Sistema: sincronização das vagas do GitHub

Fluxo sem interação do usuário. Mostra como as vagas externas entram normalizadas no modelo híbrido.

```mermaid
flowchart TD
    A["Rotina agendada"] --> B["Busca issues dos repositórios<br/>via API do GitHub"]
    B --> C{"Issue aberta?"}
    C -->|Não| D["Marca a vaga como inativa"]
    C -->|Sim| E{"Vaga já existe?<br/>pelo id da issue"}
    E -->|Não| F["Cria vaga com origem GitHub"]
    E -->|Sim| G["Atualiza a vaga"]
    F --> H["Mapeia labels<br/>nível, contratação, modalidade e stack"]
    G --> H
    H --> I["Busca no texto da descrição<br/>as skills cadastradas"]
    I --> J["Salva a vaga normalizada"]
```

## Telas para o protótipo

**Usuário:** landing page, cadastro, login, formulário do CV, vagas recomendadas (com busca e filtros), detalhe da vaga e Meu CV (edição e exportação).

**Admin:** login (o mesmo do usuário, com redirecionamento pelo papel), painel, lista de vagas, formulário de vaga interna e lista de usuários.
