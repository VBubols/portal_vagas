import sequelize from '../config/database.js';
import {
  Curriculo, CurriculoLocal, Experiencia, Formacao, Curso, Idioma, Link, Projeto, CurriculoSkill, Skill,
} from '../models/index.js'; // index.js registra as associações
import { AppError } from '../utils/AppError.js';

// [model, alias da associação definida em models/index.js]
const FILHAS = [
  [CurriculoLocal, 'locais'],
  [Experiencia, 'experiencias'],
  [Formacao, 'formacoes'],
  [Curso, 'cursos'],
  [Idioma, 'idiomas'],
  [Link, 'links'],
  [Projeto, 'projetos'],
];

function incluirTudo() {
  return [
    ...FILHAS.map(([model, as]) => ({ model, as, separate: true })), // evita produto cartesiano
    { model: Skill, as: 'skills', attributes: ['id', 'nome'], through: { attributes: [] } },
  ];
}

async function buscar(usuarioId, transaction) {
  return Curriculo.findOne({ where: { usuarioId }, include: incluirTudo(), transaction });
}

const semIds = ({ id, curriculoId, ...resto }) => resto;
// Mais recente primeiro
const porInicioDesc = (a, b) => String(b.inicio ?? '').localeCompare(String(a.inicio ?? ''));

function serializar(cv) {
  const lista = (chave) => cv[chave].map((i) => semIds(i.get({ plain: true })));
  const skills = cv.skills.map((s) => ({ id: s.id, nome: s.nome })).sort((a, b) => a.nome.localeCompare(b.nome));

  const dados = {
    id: cv.id,
    nomeCompleto: cv.nomeCompleto,
    titulo: cv.titulo,
    resumo: cv.resumo ?? null,
    emailContato: cv.emailContato,
    telefone: cv.telefone,
    nivel: cv.nivel,
    modalidades: cv.modalidades,
    cidade: cv.cidade,
    uf: cv.uf,
    locais: lista('locais'),
    experiencias: lista('experiencias').sort(porInicioDesc),
    formacoes: lista('formacoes').sort(porInicioDesc),
    cursos: lista('cursos'),
    idiomas: lista('idiomas'),
    links: lista('links'),
    projetos: lista('projetos'),
    skills,
    createdAt: cv.createdAt,
    updatedAt: cv.updatedAt,
  };

  // match: o que os filtros e a pontuação precisam.
  // pdf: o suficiente para um currículo ATS (experiência e projetos são opcionais).
  const match = Boolean(dados.nivel && dados.modalidades.length && dados.cidade && dados.uf && skills.length);
  const pdf = match && Boolean(dados.nomeCompleto && dados.titulo && dados.resumo && dados.emailContato
    && dados.telefone && dados.formacoes.length);

  return { ...dados, completude: { match, pdf } };
}

async function validarSkills(skillIds, transaction) {
  const existentes = await Skill.count({ where: { id: skillIds }, transaction });
  if (existentes !== skillIds.length) {
    throw new AppError(400, 'Dados inválidos', [{ campo: 'skillIds', mensagem: 'Há skills que não existem' }]);
  }
}

async function gravarFilhas(curriculoId, { skillIds, ...listas }, transaction) {
  for (const [Model, alias] of FILHAS) {
    if (listas[alias].length) {
      await Model.bulkCreate(listas[alias].map((item) => ({ ...item, curriculoId })), { transaction });
    }
  }
  await CurriculoSkill.bulkCreate(skillIds.map((skillId) => ({ curriculoId, skillId })), { transaction });
}

function separar(dados) {
  const { locais, experiencias, formacoes, cursos, idiomas, links, projetos, skillIds, ...principal } = dados;
  return { principal, filhas: { locais, experiencias, formacoes, cursos, idiomas, links, projetos, skillIds } };
}

export async function obterCurriculo(usuarioId) {
  const cv = await buscar(usuarioId);
  if (!cv) throw new AppError(404, 'Currículo não encontrado');
  return serializar(cv);
}

export async function criarCurriculo(usuarioId, dados) {
  if (await Curriculo.findOne({ where: { usuarioId }, attributes: ['id'] })) {
    throw new AppError(409, 'Você já possui um currículo. Use PUT para atualizar');
  }
  const { principal, filhas } = separar(dados);

  return sequelize.transaction(async (t) => {
    await validarSkills(filhas.skillIds, t);
    const cv = await Curriculo.create({ ...principal, usuarioId }, { transaction: t });
    await gravarFilhas(cv.id, filhas, t);
    return serializar(await buscar(usuarioId, t));
  });
}

// Substitui tudo: apaga as filhas e recria, na mesma transação.
export async function atualizarCurriculo(usuarioId, dados) {
  const { principal, filhas } = separar(dados);

  return sequelize.transaction(async (t) => {
    const cv = await Curriculo.findOne({ where: { usuarioId }, transaction: t });
    if (!cv) throw new AppError(404, 'Currículo não encontrado');

    await validarSkills(filhas.skillIds, t);
    await cv.update({ resumo: null, ...principal }, { transaction: t });

    for (const [Model] of FILHAS) await Model.destroy({ where: { curriculoId: cv.id }, transaction: t });
    await CurriculoSkill.destroy({ where: { curriculoId: cv.id }, transaction: t });
    await gravarFilhas(cv.id, filhas, t);

    return serializar(await buscar(usuarioId, t));
  });
}