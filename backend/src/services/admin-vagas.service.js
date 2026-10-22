import { Op } from 'sequelize';
import sequelize from '../config/database.js';
import { Vaga, Skill } from '../models/index.js';
import { AppError } from '../utils/AppError.js';
import { normalizarTexto } from '../utils/texto.js';
import { escaparLike } from '../utils/like.js';
import { montarPaginacao } from '../utils/paginacao.js';
import { obterVaga } from './vaga.service.js';

async function validarSkills(ids, transaction) {
  const encontradas = await Skill.count({ where: { id: ids }, transaction });
  if (encontradas !== ids.length) {
    throw new AppError(400, 'Dados inválidos', [
      { campo: 'skills', mensagem: 'Uma ou mais skills não existem' },
    ]);
  }
}

// Lista explícita: nem chamadas internas conseguem alterar origem, ids,
// publicação ou visibilidade por meio dos dados do formulário.
function paraModel(dados) {
  const cidade = dados.cidade || null;
  return {
    titulo: dados.titulo,
    empresa: dados.empresa,
    descricao: dados.descricao ?? null,
    link: dados.link,
    nivel: dados.nivel,
    modalidade: dados.modalidade,
    contratacao: dados.contratacao ?? null,
    stack: dados.stack,
    cidade,
    uf: dados.uf ?? null,
    cidadeNormalizada: cidade ? normalizarTexto(cidade) : null,
  };
}

async function buscarOuFalhar(id, transaction, somenteInterna = false) {
  const vaga = await Vaga.findByPk(id, { transaction, lock: transaction.LOCK.UPDATE });
  if (!vaga) throw new AppError(404, 'Vaga não encontrada');
  if (somenteInterna && vaga.origem !== 'interna') {
    throw new AppError(400, 'Vagas do GitHub são atualizadas pela sincronização. Use ocultar.');
  }
  return vaga;
}

async function respostaDaVaga(id, transaction) {
  // Reutiliza exatamente o formato do detalhe público, inclusive nas edições
  // de vagas ocultas/inativas, sem reexibi-las ao candidato.
  const resultado = await obterVaga({
    id,
    curriculo: null,
    incluirIndisponiveis: true,
    transaction,
  });
  if (!resultado) throw new AppError(404, 'Vaga não encontrada');
  return resultado.vaga;
}

export async function criarVagaInterna(dados) {
  return sequelize.transaction(async (transaction) => {
    await validarSkills(dados.skills, transaction);
    const vaga = await Vaga.create(
      {
        ...paraModel(dados),
        origem: 'interna',
        fonte: null,
        githubIssueId: null,
        publicadaEm: new Date(),
      },
      { transaction },
    );
    await vaga.setSkills(dados.skills, { transaction });
    return respostaDaVaga(vaga.id, transaction);
  });
}

export async function editarVagaInterna(id, dados) {
  return sequelize.transaction(async (transaction) => {
    const vaga = await buscarOuFalhar(id, transaction, true);
    await validarSkills(dados.skills, transaction);
    await vaga.update(paraModel(dados), { transaction });
    await vaga.setSkills(dados.skills, { transaction });
    return respostaDaVaga(id, transaction);
  });
}

export async function removerVagaInterna(id) {
  return sequelize.transaction(async (transaction) => {
    const vaga = await buscarOuFalhar(id, transaction, true);
    // O relacionamento vaga_skill já usa exclusão em cascata no Sequelize.
    await vaga.destroy({ transaction });
  });
}

export async function alterarOcultacao(id, oculta) {
  return sequelize.transaction(async (transaction) => {
    const vaga = await buscarOuFalhar(id, transaction);
    // Repetir ocultar/reexibir deve continuar retornando sucesso. A existência
    // é verificada pela consulta, não pela quantidade de linhas alteradas.
    await vaga.update({ oculta }, { transaction });
    return { id: vaga.id, oculta: vaga.oculta };
  });
}

export async function listarVagasAdmin({ busca, origem, ativa, oculta, pagina, limite }) {
  const where = {};
  if (origem !== undefined) where.origem = origem;
  if (ativa !== undefined) where.ativa = ativa;
  if (oculta !== undefined) where.oculta = oculta;
  if (busca) {
    const padrao = `%${escaparLike(busca)}%`;
    where[Op.or] = [{ titulo: { [Op.iLike]: padrao } }, { empresa: { [Op.iLike]: padrao } }];
  }
  const { rows, count } = await Vaga.findAndCountAll({
    where,
    attributes: [
      'id',
      'origem',
      'titulo',
      'empresa',
      'nivel',
      'modalidade',
      'contratacao',
      'stack',
      'cidade',
      'uf',
      'publicadaEm',
      'ativa',
      'oculta',
      'descricao',
      'link',
    ],
    include: [
      { model: Skill, as: 'skills', attributes: ['id', 'nome'], through: { attributes: [] } },
    ],
    distinct: true, // o JOIN de skills não deve multiplicar o total de vagas
    order: [
      ['createdAt', 'DESC'],
      ['id', 'ASC'],
    ],
    limit: limite,
    offset: (pagina - 1) * limite,
  });
  return {
    dados: rows.map((vaga) => vaga.get({ plain: true })),
    paginacao: montarPaginacao({ pagina, limite, total: count }),
  };
}
