import { Op } from 'sequelize';
import sequelize from '../config/database.js';
import { Vaga, Skill } from '../models/index.js';
import { fontesVagas } from '../config/fontesVagas.js';
import { listarIssuesAbertas } from './github.service.js';
import { montarVaga, criarIndiceSkills, extrairSkills } from './extracaoVaga.service.js';
import { AppError } from '../utils/AppError.js';

let emAndamento = false;

// Busca as issues abertas de todas as fontes, grava as vagas e inativa as que
// sumiram. Devolve um resumo do que aconteceu.
export async function sincronizarVagas() {
  if (emAndamento) throw new AppError(409, 'Já existe uma sincronização em andamento');
  emAndamento = true;
  try {
    return await executar();
  } finally {
    emAndamento = false;
  }
}

async function executar() {
  const inicio = Date.now();
  const skills = await Skill.findAll({ attributes: ['id', 'nome', 'aliases'] });
  const indice = criarIndiceSkills(skills);

  const resumo = {
    fontes: [],
    criadas: 0,
    atualizadas: 0,
    inalteradas: 0,
    inativadas: 0,
    descartadas: 0,
    skillsNaoEncontradas: new Set(),
    erros: [],
  };

  for (const fonte of fontesVagas) {
    resumo.fontes.push(await sincronizarFonte(fonte, indice, resumo));
  }

  return {
    ...resumo,
    skillsNaoEncontradas: [...resumo.skillsNaoEncontradas].sort(),
    duracaoMs: Date.now() - inicio,
  };
}

async function sincronizarFonte({ owner, repo }, indice, resumo) {
  const fonte = `${owner}/${repo}`;

  let issues;
  try {
    issues = await listarIssuesAbertas({ owner, repo });
  } catch (erro) {
    // Sem a lista completa não dá para saber o que fechou: nada desta fonte é inativado.
    resumo.erros.push(`${fonte}: falha ao buscar as issues (${erro.message})`);
    return { fonte, issues: 0, ok: false };
  }

  const idsAbertos = [];
  for (const issue of issues) {
    const montada = montarVaga(issue);
    if (!montada) {
      resumo.descartadas += 1;
      continue;
    }
    idsAbertos.push(issue.githubId);

    try {
      const { ids, naoEncontradas } = extrairSkills(
        { labels: montada.skillsDasLabels, titulo: issue.titulo, descricao: issue.descricao },
        indice,
      );
      naoEncontradas.forEach((nome) => resumo.skillsNaoEncontradas.add(nome));
      resumo[await gravarVaga(montada.vaga, ids)] += 1;
    } catch (erro) {
      resumo.erros.push(`${issue.url}: ${erro.message}`);
    }
  }

  // Vagas desta fonte que não vieram na lista de abertas foram fechadas no GitHub.
  // Lista vazia é suspeita (falha silenciosa): nesse caso nada é inativado.
  if (idsAbertos.length > 0) {
    const [inativadas] = await Vaga.update(
      { ativa: false },
      { where: { origem: 'github', fonte, ativa: true, githubIssueId: { [Op.notIn]: idsAbertos } } },
    );
    resumo.inativadas += inativadas;
  }

  return { fonte, issues: issues.length, ok: true };
}

// Cria ou atualiza a vaga pelo githubIssueId e acerta as skills dela.
// Devolve 'criadas', 'atualizadas' ou 'inalteradas', a chave do resumo.
async function gravarVaga(dados, skillIds) {
  return sequelize.transaction(async (transaction) => {
    const existente = await Vaga.findOne({ where: { githubIssueId: dados.githubIssueId }, transaction });

    if (!existente) {
      const vaga = await Vaga.create(dados, { transaction });
      await vaga.setSkills(skillIds, { transaction });
      return 'criadas';
    }

    // githubIssueId fica de fora: o Postgres devolve BIGINT como texto, e a
    // comparação com o número marcaria toda vaga como alterada.
    const { githubIssueId, publicadaEm, ...campos } = dados;
    existente.set({ ...campos, publicadaEm: publicadaEm ? new Date(publicadaEm) : null });
    const camposMudaram = existente.changed() !== false;
    if (camposMudaram) await existente.save({ transaction });

    const atuais = await existente.getSkills({ attributes: ['id'], joinTableAttributes: [], transaction });
    const skillsMudaram = atuais.map((s) => s.id).sort().join() !== [...skillIds].sort().join();
    if (skillsMudaram) await existente.setSkills(skillIds, { transaction });

    return camposMudaram || skillsMudaram ? 'atualizadas' : 'inalteradas';
  });
}
