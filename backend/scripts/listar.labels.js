// scripts/listarLabels.js
import 'dotenv/config';
import { Octokit } from 'octokit';
import { fontesVagas } from '../src/config/fontesVagas.js';

const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN || undefined });

for (const { owner, repo } of fontesVagas) {
  const labels = await octokit.paginate(octokit.rest.issues.listLabelsForRepo, {
    owner, repo, per_page: 100,
  });
  console.log(`\n${owner}/${repo}: ${labels.length} labels`);
  console.table(labels.map((l) => ({ nome: l.name, descricao: l.description ?? '' })));
}