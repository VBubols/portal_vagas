// scripts/listar.titulos.js
import 'dotenv/config';
import { fontesVagas } from '../src/config/fontesVagas.js';
import { listarIssuesAbertas } from '../src/services/github.service.js';
import { aplicarMapeamento } from '../src/services/mapeamentoLabels.service.js';

for (const fonte of fontesVagas) {
  const issues = await listarIssuesAbertas(fonte);
  console.log(`\n## ${fonte.owner}/${fonte.repo}`);
  for (const issue of issues) {
    const m = aplicarMapeamento(issue.fonte, issue.labels);
    if (m.descartar) continue;
    const resolvido = [m.niveis, m.modalidades, m.localizacoes]
      .map((campo) => campo.join('/') || '-')
      .join(' | ');
    console.log(`${resolvido} || ${issue.titulo}`);
  }
}