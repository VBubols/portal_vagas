// Script temporário: valida a integração e o mapeamento antes do model Vaga existir.
// Rodar de dentro de backend/: node scripts/testarGithub.js
import 'dotenv/config';
import { fontesVagas } from '../src/config/fontesVagas.js';
import { listarIssuesAbertas } from '../src/services/github.service.js';
import { aplicarMapeamento } from '../src/services/mapeamentoLabels.service.js';

for (const fonte of fontesVagas) {
  const issues = await listarIssuesAbertas(fonte);
  const mapeadas = issues.map((issue) => ({ issue, ...aplicarMapeamento(issue.fonte, issue.labels) }));
  const importadas = mapeadas.filter((v) => !v.descartar);

  const contar = (filtro) => importadas.filter(filtro).length;
  const temNivel = (...niveis) => (v) => v.niveis.some((n) => niveis.includes(n));

  console.log(`\n${fonte.owner}/${fonte.repo}`);
  console.table({
    'Abertas no GitHub': issues.length,
    'Descartadas (Avisos/Stale)': mapeadas.length - importadas.length,
    'Importadas': importadas.length,
    'Estágio ou Júnior': contar(temNivel('estagio', 'junior')),
    'Pleno, Sênior ou Especialista': contar(temNivel('pleno', 'senior', 'especialista')),
    'Sem label de nível': contar((v) => v.niveis.length === 0),
    'Sem label de skill': contar((v) => v.skills.length === 0),
  });

  const exemplo = importadas[0];
  if (exemplo) {
    const { issue, descartar, ...campos } = exemplo;
    console.log(`Exemplo: ${issue.titulo}`, campos);
  }
}