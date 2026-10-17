import sequelize from '../config/database.js';
import { DataTypes } from 'sequelize';
import { normalizarTexto } from '../utils/texto.js';

// Tabela única de skills, usada pelo currículo e pelas vagas (N:N nos dois lados).
// nome: forma canônica exibida ao usuário (ex.: "Node.js").
// aliases: outras grafias aceitas (ex.: "node", "nodejs").
// nomeNormalizado e busca são calculados automaticamente (não preencher à mão).
export const Skill = sequelize.define(
  'Skill',
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    nome: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    nomeNormalizado: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    aliases: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      allowNull: false,
      defaultValue: [],
    },
    // nome + aliases normalizados, separados por espaço; é nesta coluna que o autocomplete procura.
    busca: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
  },
  {
    tableName: 'skill',
    timestamps: true,
    hooks: {
      beforeValidate(skill) {
        skill.nomeNormalizado = normalizarTexto(skill.nome);
        const aliases = skill.aliases ?? [];
        skill.busca = [skill.nome, ...aliases].map(normalizarTexto).join(' ');
      },
    },
  },
);

export default Skill;