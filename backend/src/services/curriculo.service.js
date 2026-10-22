import sequelize from '../config/database.js';
import {
  Curriculo, CurriculoLocal, Experiencia, Formacao, Curso, Idioma, Link, Projeto, Skill,
} from '../models/index.js';
import { AppError } from '../utils/AppError.js';
import { normalizarTexto } from '../utils/texto.js';
import { serializarCurriculo } from '../utils/serializarCurriculo.js';

// Chave no corpo da requisição -> model da tabela filha.
const FILHAS = [
  ['locais', CurriculoLocal],
  ['experiencias', Experiencia],
  ['formacoes', Formacao],
  ['cursos', Curso],
  ['idiomas', Idioma],
  ['links', Link],
  ['projetos', Projeto],
];

const MSG_NAO_ENCONTRADO = 'Currículo não encontrado. Preencha seu currículo antes de continuar.';

// Colunas da própria tabela curriculo (as filhas e as skills são tratadas à parte).
function camposDoCurriculo(dados) {
  const {
    nomeCompleto, titulo, emailContato, telefone, resumo, nivel, modalidades, cidade, uf,
  } = dados;
  return {
    nomeCompleto,
    titulo,
    emailContato,
    telefone,
    resumo,
    nivel,
    modalidades,
    cidade,
    uf,
    // Mesma normalização usada no match; nunca vem do cliente.
    cidadeNormalizada: normalizarTexto(cidade),
  };
}

// O índice único de curriculo_local é (curriculo, cidade normalizada, uf): dois locais
// que só diferem por acento ou caixa ("Palhoça" e "palhoca") viram um só.
function linhasDeLocais(locais) {
  const porChave = new Map();
  for (const { cidade, uf } of locais) {
    const cidadeNormalizada = normalizarTexto(cidade);
    const chave = `${cidadeNormalizada}|${uf}`;
    if (!porChave.has(chave)) porChave.set(chave, { cidade, uf, cidadeNormalizada });
  }
  return [...porChave.values()];
}

async function validarSkills(ids) {
  if (!ids.length) return;
  const existentes = new Set((await Skill.findAll({ where: { id: ids }, attributes: ['id'] })).map((s) => s.id));
  const inexistentes = ids.filter((id) => !existentes.has(id));
  if (inexistentes.length) {
    throw new AppError(
      400,
      'Dados inválidos',
      inexistentes.map((id) => ({ campo: 'skills', mensagem: `Skill não encontrada: ${id}` })),
    );
  }
}

async function gravarFilhasESkills(curriculo, dados, transaction) {
  for (const [chave, model] of FILHAS) {
    const itens = chave === 'locais' ? linhasDeLocais(dados.locais) : dados[chave];
    if (itens.length) {
      await model.bulkCreate(
        itens.map((item) => ({ ...item, curriculoId: curriculo.id })),
        { transaction },
      );
    }
  }
  await curriculo.setSkills(dados.skills, { transaction });
}

// Currículo completo em objeto simples, ou null se o usuário ainda não tem um.
async function carregar(usuarioId) {
  const curriculo = await Curriculo.findOne({
    where: { usuarioId },
    include: [
      { model: Skill, as: 'skills', attributes: ['id', 'nome'], through: { attributes: [] } },
      // `separate` evita o produto cartesiano entre as tabelas filhas
      ...FILHAS.map(([as, model]) => ({ model, as, separate: true })),
    ],
  });
  return curriculo ? curriculo.get({ plain: true }) : null;
}

export async function obterCurriculo(usuarioId) {
  const curriculo = await carregar(usuarioId);
  if (!curriculo) throw new AppError(404, MSG_NAO_ENCONTRADO);
  return serializarCurriculo(curriculo);
}

export async function criarCurriculo(usuarioId, dados) {
  const jaTem = await Curriculo.findOne({ where: { usuarioId }, attributes: ['id'] });
  if (jaTem) {
    throw new AppError(409, 'Você já possui um currículo. Use PUT /curriculo para atualizá-lo.');
  }
  await validarSkills(dados.skills);

  // Tudo ou nada: se qualquer tabela falhar, nada fica gravado pela metade.
  // Duas requisições simultâneas passam pela checagem acima, mas a segunda esbarra
  // no índice único de usuario_id (vira 409 no middleware de erros).
  await sequelize.transaction(async (transaction) => {
    const curriculo = await Curriculo.create({ ...camposDoCurriculo(dados), usuarioId }, { transaction });
    await gravarFilhasESkills(curriculo, dados, transaction);
  });

  return obterCurriculo(usuarioId);
}

// PUT: substitui o currículo inteiro. As tabelas filhas são apagadas e recriadas
// a partir do corpo, o que é mais simples e seguro do que comparar item a item.
export async function substituirCurriculo(usuarioId, dados) {
  await validarSkills(dados.skills);

  await sequelize.transaction(async (transaction) => {
    // Trava a linha: dois PUTs simultâneos não se misturam (apagar + inserir intercalados).
    const curriculo = await Curriculo.findOne({
      where: { usuarioId },
      transaction,
      lock: transaction.LOCK.UPDATE,
    });
    if (!curriculo) throw new AppError(404, MSG_NAO_ENCONTRADO);

    curriculo.set(camposDoCurriculo(dados));
    // Se só as listas mudaram, o Sequelize não enxergaria alteração e deixaria
    // updatedAt como estava.
    curriculo.changed('updatedAt', true);
    await curriculo.save({ transaction });

    for (const [, model] of FILHAS) {
      await model.destroy({ where: { curriculoId: curriculo.id }, transaction });
    }
    await gravarFilhasESkills(curriculo, dados, transaction);
  });

  return obterCurriculo(usuarioId);
}
