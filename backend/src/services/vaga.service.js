import { Op, literal } from 'sequelize';
import sequelize from '../config/database.js';
import {
  Vaga, VagaSkill, Skill, Curriculo, CurriculoLocal,
} from '../models/index.js';
import { escaparLike } from '../utils/like.js';
import { normalizarTexto } from '../utils/texto.js';
import { montarMatch, avaliarCriterios, calcularCompatibilidade, ordenarPorCompatibilidade } from './match.service.js';

// Colunas dos cards de lista. `descricao` e `link` ficam de fora: são pesados
// e só o detalhe da vaga precisa deles.
const ATRIBUTOS_LISTA = [
  'id', 'origem', 'titulo', 'empresa', 'nivel', 'modalidade',
  'contratacao', 'stack', 'cidade', 'uf', 'publicadaEm',
];

const INCLUDE_SKILLS = {
  model: Skill, as: 'skills', attributes: ['id', 'nome'], through: { attributes: [] },
};

const plano = (instancia) => instancia.get({ plain: true });

// Nome real da coluna no banco (independe de a pessoa 3 usar underscored ou não).
const coluna = (model, atributo) => model.rawAttributes[atributo].field;

// EXISTS: a vaga tem alguma skill cujo nome ou alias contém o termo.
// Usa a coluna `busca` do Skill (nome + aliases já normalizados), então
// "js" e "nodejs" encontram as vagas de JavaScript e Node.js.
function vagaTemSkillComTermo(termo) {
  const padrao = sequelize.escape(`%${escaparLike(normalizarTexto(termo))}%`);
  return literal(`EXISTS (
    SELECT 1 FROM "${VagaSkill.getTableName()}" AS vs
    INNER JOIN "${Skill.getTableName()}" AS s ON s."id" = vs."${coluna(VagaSkill, 'skillId')}"
    WHERE vs."${coluna(VagaSkill, 'vagaId')}" = "Vaga"."id"
    AND s."${coluna(Skill, 'busca')}" ILIKE ${padrao}
  )`);
}

// Só vagas visíveis ao candidato + filtros da busca. Cada palavra do texto
// precisa aparecer em título, empresa, descrição ou nas skills da vaga.
function montarWhere({ q, nivel, modalidade, stack } = {}) {
  const condicoes = [{ ativa: true }, { oculta: false }];

  if (nivel?.length) condicoes.push({ nivel: { [Op.in]: nivel } });
  if (modalidade?.length) condicoes.push({ modalidade: { [Op.in]: modalidade } });
  if (stack?.length) condicoes.push({ stack: { [Op.in]: stack } });

  const termos = q ? q.split(/\s+/).filter(Boolean) : [];
  for (const termo of termos) {
    const padrao = `%${escaparLike(termo)}%`;
    condicoes.push({
      [Op.or]: [
        { titulo: { [Op.iLike]: padrao } },
        { empresa: { [Op.iLike]: padrao } },
        { descricao: { [Op.iLike]: padrao } },
        // termo só de símbolos some na normalização: aí não há skill a procurar
        ...(normalizarTexto(termo) ? [vagaTemSkillComTermo(termo)] : []),
      ],
    });
  }
  return { [Op.and]: condicoes };
}

export async function carregarCurriculoParaMatch(usuarioId) {
  const curriculo = await Curriculo.findOne({
    where: { usuarioId },
    attributes: ['id', 'nivel', 'modalidades', 'cidade', 'uf', 'cidadeNormalizada'],
    include: [
      INCLUDE_SKILLS,
      { model: CurriculoLocal, as: 'locais', attributes: ['cidade', 'uf', 'cidadeNormalizada'] },
    ],
  });
  return curriculo ? plano(curriculo) : null;
}

function ordemRecentes() {
  const campo = `"Vaga"."${coluna(Vaga, 'publicadaEm')}"`;
  return [literal(`${campo} DESC NULLS LAST`), ['id', 'ASC']];
}

// GET /vagas: busca geral. Se a pessoa tem CV, cada card traz a %.
export async function listarVagas({ filtros, pagina, limite, curriculo }) {
  const where = montarWhere(filtros);

  const { rows, count } = await Vaga.findAndCountAll({
    where,
    attributes: ATRIBUTOS_LISTA,
    order: ordemRecentes(),
    limit: limite,
    offset: (pagina - 1) * limite,
  });

  // Skills em uma segunda consulta, só para as vagas da página
  // (evita o JOIN multiplicar linhas dentro do LIMIT).
  const ids = rows.map((v) => v.id);
  const comSkills = ids.length
    ? await Vaga.findAll({ where: { id: ids }, attributes: ['id'], include: [INCLUDE_SKILLS] })
    : [];
  const skillsPorVaga = new Map(comSkills.map((v) => [v.id, plano(v).skills]));

  const itens = rows.map((linha) => {
    const vaga = { ...plano(linha), skills: skillsPorVaga.get(linha.id) ?? [] };
    vaga.compatibilidade = curriculo
      ? calcularCompatibilidade(curriculo.skills, vaga.skills).compatibilidade
      : null;
    return vaga;
  });

  return { itens, total: count };
}

// GET /vagas/recomendadas: filtros eliminatórios do CV + filtros da busca,
// ordenado por compatibilidade. A paginação é em memória porque a ordem
// depende de um cálculo que o banco não faz.
export async function recomendarVagas({ filtros, pagina, limite, curriculo }) {
  const where = montarWhere(filtros);

  // Pré-filtro no banco (reduz o volume): vaga com nível/modalidade igual ao
  // do CV ou sem essa informação. A decisão final é de avaliarCriterios().
  const preFiltro = [where];
  if (curriculo.nivel) {
    preFiltro.push({ [Op.or]: [{ nivel: curriculo.nivel }, { nivel: null }] });
  }
  if (curriculo.modalidades?.length) {
    preFiltro.push({
      [Op.or]: [{ modalidade: { [Op.in]: curriculo.modalidades } }, { modalidade: null }],
    });
  }

  const candidatas = await Vaga.findAll({
    where: { [Op.and]: preFiltro },
    attributes: ATRIBUTOS_LISTA.concat('cidadeNormalizada'),
    include: [INCLUDE_SKILLS],
  });

  const compativeis = [];
  for (const linha of candidatas) {
    const vaga = plano(linha);
    if (!avaliarCriterios(curriculo, vaga).elegivel) continue;

    const { cidadeNormalizada, ...card } = vaga;
    card.compatibilidade = calcularCompatibilidade(curriculo.skills, vaga.skills).compatibilidade;
    compativeis.push(card);
  }

  const ordenadas = ordenarPorCompatibilidade(compativeis);
  const inicio = (pagina - 1) * limite;
  return { itens: ordenadas.slice(inicio, inicio + limite), total: ordenadas.length };
}

// GET /vagas/:id: vaga completa + match detalhado (se a pessoa tem CV).
// incluirIndisponiveis é opção interna usada após autenticação/autorização do
// admin. As rotas públicas não a recebem do cliente e mantêm o filtro padrão.
export async function obterVaga({ id, curriculo, incluirIndisponiveis = false, transaction }) {
  const linha = await Vaga.findOne({
    where: incluirIndisponiveis ? { id } : { id, ativa: true, oculta: false },
    attributes: { exclude: ['githubIssueId', 'ativa', 'oculta'] },
    include: [INCLUDE_SKILLS],
    transaction,
  });
  if (!linha) return null;

  const { cidadeNormalizada, ...vaga } = plano(linha);
  const match = curriculo ? montarMatch(curriculo, { ...vaga, cidadeNormalizada }) : null;
  return { vaga, match };
}
