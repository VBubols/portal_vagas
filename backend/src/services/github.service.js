import { Octokit } from 'octokit';

// Sem token funciona, mas o limite cai de 5.000 para 60 requisições por hora.
const octokit = new Octokit({
  auth: process.env.GITHUB_TOKEN || undefined, // chave vazia no .env não vira token inválido
  userAgent: 'portal-vagas',
});

// A API devolve dezenas de campos por issue. Aqui fica só o que a sincronização usa.
function mapearIssue(issue, fonte) {
  return {
    githubId: issue.id, // único no GitHub inteiro; o "number" só é único dentro do repositório
    numero: issue.number,
    fonte: `${fonte.owner}/${fonte.repo}`,
    titulo: issue.title,
    descricao: issue.body ?? '',
    labels: issue.labels.map((label) =>
      typeof label === 'string'
        ? { nome: label, descricao: '' }
        : { nome: label.name, descricao: label.description ?? '' },
    ),
    url: issue.html_url,
    criadaEm: issue.created_at,
    atualizadaEm: issue.updated_at,
  };
}

// Busca todas as issues abertas de um repositório, página por página.
// Pull requests também vêm nesse endpoint, por isso o filtro.
export async function listarIssuesAbertas(fonte) {
  return octokit.paginate(
    octokit.rest.issues.listForRepo,
    { owner: fonte.owner, repo: fonte.repo, state: 'open', per_page: 100 },
    (response) =>
      response.data
        .filter((issue) => !issue.pull_request)
        .map((issue) => mapearIssue(issue, fonte)),
  );
}