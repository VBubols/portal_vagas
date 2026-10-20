// PROVISÓRIO (pessoa 3): contém os campos que a pessoa 4 lê no match e na busca.
import sequelize from '../config/database.js';
import { DataTypes } from 'sequelize';
import {
  NIVEIS, MODALIDADES, UFS, CONTRATACOES, ORIGENS_VAGA,
} from '../constants/enums.js';

export const Vaga = sequelize.define(
  'Vaga',
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    origem: { type: DataTypes.ENUM(...ORIGENS_VAGA), allowNull: false },
    githubIssueId: { type: DataTypes.BIGINT, unique: true },
    titulo: { type: DataTypes.STRING, allowNull: false },
    empresa: DataTypes.STRING,
    descricao: DataTypes.TEXT,
    link: { type: DataTypes.STRING, allowNull: false },
    // Os campos abaixo podem ser nulos: nem toda issue traz a label correspondente.
    nivel: DataTypes.ENUM(...NIVEIS),
    modalidade: DataTypes.ENUM(...MODALIDADES),
    contratacao: DataTypes.ENUM(...CONTRATACOES),
    stack: DataTypes.STRING,
    cidade: DataTypes.STRING,
    uf: DataTypes.ENUM(...UFS),
    cidadeNormalizada: DataTypes.STRING,
    ativa: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
    oculta: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    publicadaEm: DataTypes.DATE,
  },
  { tableName: 'vaga', underscored: true, timestamps: true },
);

export const VagaSkill = sequelize.define(
  'VagaSkill',
  {
    vagaId: { type: DataTypes.UUID, primaryKey: true },
    skillId: { type: DataTypes.UUID, primaryKey: true },
  },
  { tableName: 'vaga_skill', underscored: true, timestamps: false },
);

export default Vaga;
