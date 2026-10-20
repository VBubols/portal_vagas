import sequelize from '../config/database.js';
import { DataTypes } from 'sequelize';
import {
  NIVEIS, MODALIDADES, LOCALIZACOES, GRAUS, SITUACOES_FORMACAO, NIVEIS_IDIOMA, TIPOS_LINK,
} from '../constants/enums.js';

// Currículo 1:1 com o usuário. As listas (experiência, formação etc.) são tabelas filhas.
// As associações (cascata, skills N:N) ficam em models/index.js, para evitar import circular.

const id = { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true };

export const Curriculo = sequelize.define(
  'Curriculo',
  {
    id,
    usuarioId: { type: DataTypes.UUID, allowNull: false, unique: true },
    nomeCompleto: { type: DataTypes.STRING(100), allowNull: false },
    titulo: { type: DataTypes.STRING(80), allowNull: false },
    resumo: { type: DataTypes.STRING(600), allowNull: true },
    emailContato: { type: DataTypes.STRING(254), allowNull: false },
    telefone: { type: DataTypes.STRING(11), allowNull: false }, // só dígitos (DDD + número)
    // Usados pelo match
    nivel: { type: DataTypes.ENUM(...NIVEIS), allowNull: false },
    modalidades: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      allowNull: false,
      defaultValue: [],
      validate: {
        valores(v) {
          if (!v.length || !v.every((m) => MODALIDADES.includes(m))) {
            throw new Error('Modalidades inválidas');
          }
        },
      },
    },
    cidade: { type: DataTypes.STRING(100), allowNull: false },
    uf: { type: DataTypes.STRING(13), allowNull: false, validate: { isIn: [LOCALIZACOES] } },
  },
  { tableName: 'curriculo', underscored: true, timestamps: true },
);

export const CurriculoLocal = sequelize.define(
  'CurriculoLocal',
  {
    id,
    curriculoId: { type: DataTypes.UUID, allowNull: false },
    cidade: { type: DataTypes.STRING(100), allowNull: true },
    uf: { type: DataTypes.STRING(13), allowNull: false, validate: { isIn: [LOCALIZACOES] } },
  },
  { tableName: 'curriculo_local', underscored: true, timestamps: false },
);

export const Experiencia = sequelize.define(
  'Experiencia',
  {
    id,
    curriculoId: { type: DataTypes.UUID, allowNull: false },
    empresa: { type: DataTypes.STRING(100), allowNull: false },
    cargo: { type: DataTypes.STRING(100), allowNull: false },
    cidade: { type: DataTypes.STRING(100), allowNull: true }, // só informativo, fora do match
    uf: { type: DataTypes.STRING(13), allowNull: true, validate: { isIn: [LOCALIZACOES] } },
    inicio: { type: DataTypes.DATEONLY, allowNull: false },
    fim: { type: DataTypes.DATEONLY, allowNull: true }, // nulo quando atual = true
    atual: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    descricao: { type: DataTypes.STRING(500), allowNull: true },
  },
  { tableName: 'experiencia', underscored: true, timestamps: false },
);

export const Formacao = sequelize.define(
  'Formacao',
  {
    id,
    curriculoId: { type: DataTypes.UUID, allowNull: false },
    instituicao: { type: DataTypes.STRING(100), allowNull: false },
    curso: { type: DataTypes.STRING(100), allowNull: false },
    grau: { type: DataTypes.ENUM(...GRAUS), allowNull: true },
    situacao: { type: DataTypes.ENUM(...SITUACOES_FORMACAO), allowNull: false },
    inicio: { type: DataTypes.DATEONLY, allowNull: true },
    fim: { type: DataTypes.DATEONLY, allowNull: true }, // conclusão ou previsão
  },
  { tableName: 'formacao', underscored: true, timestamps: false },
);

export const Curso = sequelize.define(
  'Curso',
  {
    id,
    curriculoId: { type: DataTypes.UUID, allowNull: false },
    nome: { type: DataTypes.STRING(100), allowNull: false },
    instituicao: { type: DataTypes.STRING(100), allowNull: true },
    cargaHoraria: { type: DataTypes.INTEGER, allowNull: true },
    conclusao: { type: DataTypes.DATEONLY, allowNull: true },
  },
  { tableName: 'curso', underscored: true, timestamps: false },
);

export const Idioma = sequelize.define(
  'Idioma',
  {
    id,
    curriculoId: { type: DataTypes.UUID, allowNull: false },
    idioma: { type: DataTypes.STRING(50), allowNull: false },
    nivel: { type: DataTypes.ENUM(...NIVEIS_IDIOMA), allowNull: false },
  },
  { tableName: 'idioma', underscored: true, timestamps: false },
);

export const Link = sequelize.define(
  'Link',
  {
    id,
    curriculoId: { type: DataTypes.UUID, allowNull: false },
    tipo: { type: DataTypes.ENUM(...TIPOS_LINK), allowNull: false },
    url: { type: DataTypes.STRING(200), allowNull: false },
  },
  { tableName: 'link', underscored: true, timestamps: false },
);

export const Projeto = sequelize.define(
  'Projeto',
  {
    id,
    curriculoId: { type: DataTypes.UUID, allowNull: false },
    nome: { type: DataTypes.STRING(80), allowNull: false },
    descricao: { type: DataTypes.STRING(400), allowNull: true },
    url: { type: DataTypes.STRING(200), allowNull: true },
    tecnologias: { type: DataTypes.ARRAY(DataTypes.STRING), allowNull: false, defaultValue: [] }, // só exibição
  },
  { tableName: 'projeto', underscored: true, timestamps: false },
);

export const CurriculoSkill = sequelize.define(
  'CurriculoSkill',
  {
    curriculoId: { type: DataTypes.UUID, primaryKey: true },
    skillId: { type: DataTypes.UUID, primaryKey: true },
  },
  { tableName: 'curriculo_skill', underscored: true, timestamps: false },
);

export default Curriculo;