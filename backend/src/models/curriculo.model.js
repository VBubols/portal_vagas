// PROVISÓRIO (pessoa 2): currículo e tabelas filhas, conforme o diagrama.
import sequelize from '../config/database.js';
import { DataTypes } from 'sequelize';
import {
  NIVEIS, MODALIDADES, UFS, GRAUS, SITUACOES_FORMACAO, NIVEIS_IDIOMA, TIPOS_LINK,
} from '../constants/enums.js';

const id = () => ({ type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true });
const opcoes = (tableName) => ({ tableName, underscored: true, timestamps: false });

export const Curriculo = sequelize.define(
  'Curriculo',
  {
    id: id(),
    usuarioId: { type: DataTypes.UUID, allowNull: false, unique: true },
    nomeCompleto: { type: DataTypes.STRING, allowNull: false },
    titulo: { type: DataTypes.STRING, allowNull: false },
    emailContato: { type: DataTypes.STRING, allowNull: false },
    telefone: { type: DataTypes.STRING, allowNull: false },
    resumo: { type: DataTypes.TEXT, allowNull: false },
    nivel: { type: DataTypes.ENUM(...NIVEIS), allowNull: false },
    modalidades: { type: DataTypes.ARRAY(DataTypes.ENUM(...MODALIDADES)), allowNull: false },
    cidade: { type: DataTypes.STRING, allowNull: false },
    uf: { type: DataTypes.ENUM(...UFS), allowNull: false },
    cidadeNormalizada: { type: DataTypes.STRING, allowNull: false },
  },
  { tableName: 'curriculo', underscored: true, timestamps: true },
);

export const CurriculoLocal = sequelize.define(
  'CurriculoLocal',
  {
    id: id(),
    curriculoId: { type: DataTypes.UUID, allowNull: false },
    cidade: { type: DataTypes.STRING, allowNull: false },
    uf: { type: DataTypes.ENUM(...UFS), allowNull: false },
    cidadeNormalizada: { type: DataTypes.STRING, allowNull: false },
  },
  {
    ...opcoes('curriculo_local'),
    indexes: [{ unique: true, fields: ['curriculo_id', 'cidade_normalizada', 'uf'] }],
  },
);

export const Experiencia = sequelize.define(
  'Experiencia',
  {
    id: id(),
    curriculoId: { type: DataTypes.UUID, allowNull: false },
    empresa: { type: DataTypes.STRING, allowNull: false },
    cargo: { type: DataTypes.STRING, allowNull: false },
    cidade: DataTypes.STRING,
    uf: DataTypes.ENUM(...UFS),
    inicio: { type: DataTypes.DATEONLY, allowNull: false },
    fim: DataTypes.DATEONLY,
    atual: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    descricao: DataTypes.TEXT,
  },
  opcoes('experiencia'),
);

export const Formacao = sequelize.define(
  'Formacao',
  {
    id: id(),
    curriculoId: { type: DataTypes.UUID, allowNull: false },
    instituicao: { type: DataTypes.STRING, allowNull: false },
    curso: { type: DataTypes.STRING, allowNull: false },
    grau: { type: DataTypes.ENUM(...GRAUS), allowNull: false },
    situacao: { type: DataTypes.ENUM(...SITUACOES_FORMACAO), allowNull: false },
    inicio: DataTypes.DATEONLY,
    fim: DataTypes.DATEONLY,
  },
  opcoes('formacao'),
);

export const Curso = sequelize.define(
  'Curso',
  {
    id: id(),
    curriculoId: { type: DataTypes.UUID, allowNull: false },
    nome: { type: DataTypes.STRING, allowNull: false },
    instituicao: DataTypes.STRING,
    cargaHoraria: DataTypes.INTEGER,
    conclusao: DataTypes.DATEONLY,
  },
  opcoes('curso'),
);

export const Idioma = sequelize.define(
  'Idioma',
  {
    id: id(),
    curriculoId: { type: DataTypes.UUID, allowNull: false },
    idioma: { type: DataTypes.STRING, allowNull: false },
    nivel: { type: DataTypes.ENUM(...NIVEIS_IDIOMA), allowNull: false },
  },
  opcoes('idioma'),
);

export const Link = sequelize.define(
  'Link',
  {
    id: id(),
    curriculoId: { type: DataTypes.UUID, allowNull: false },
    tipo: { type: DataTypes.ENUM(...TIPOS_LINK), allowNull: false },
    url: { type: DataTypes.STRING, allowNull: false },
  },
  opcoes('link'),
);

export const Projeto = sequelize.define(
  'Projeto',
  {
    id: id(),
    curriculoId: { type: DataTypes.UUID, allowNull: false },
    nome: { type: DataTypes.STRING, allowNull: false },
    descricao: DataTypes.TEXT,
    url: DataTypes.STRING,
    tecnologias: DataTypes.ARRAY(DataTypes.STRING),
  },
  opcoes('projeto'),
);

export const CurriculoSkill = sequelize.define(
  'CurriculoSkill',
  {
    curriculoId: { type: DataTypes.UUID, primaryKey: true },
    skillId: { type: DataTypes.UUID, primaryKey: true },
  },
  opcoes('curriculo_skill'),
);

export default Curriculo;
