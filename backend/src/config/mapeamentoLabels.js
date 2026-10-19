import { UFS, LOCALIZACAO_INTERNACIONAL } from '../constants/enums.js';

// Traduz as labels de cada repositório para os valores de src/constants/enums.js.
// Regras, aplicadas label por label em src/services/mapeamentoLabels.service.js:
//   1. está em descartarVaga: a issue não é importada
//   2. está em campos: preenche niveis, modalidades, contratacoes ou localizacoes
//   3. está em ignorar: nada acontece
//   4. qualquer outra: vira candidata a skill, casada depois com a tabela Skill
// A comparação ignora maiúsculas, acentos e emoji: 'Brasilia' e 'Brasília' são a mesma label.
// Toda fonte de src/config/fontesVagas.js precisa ter uma entrada aqui.

const nivel = (valor) => ({ campo: 'niveis', valor });
const modalidade = (valor) => ({ campo: 'modalidades', valor });
const contratacao = (valor) => ({ campo: 'contratacoes', valor });
const localizacao = (valor) => ({ campo: 'localizacoes', valor });

// Uma label por estado, com o mesmo nome da UF: 'Santa Catarina' -> 'SC'.
const labelsDeEstado = Object.fromEntries(
  Object.entries(UFS).map(([uf, nome]) => [nome, localizacao(uf)]),
);

export const mapeamentoLabels = {
  'backend-br/vagas': {
    campos: {
      'Estagiário': nivel('estagio'),
      'Júnior': nivel('junior'),
      'Pleno': nivel('pleno'),
      'Sênior': nivel('senior'),
      'Especialista': nivel('especialista'),

      'Remoto': modalidade('remoto'),
      'Híbrido': modalidade('hibrido'),
      'Presencial': modalidade('presencial'),

      'CLT': contratacao('clt'),
      'PJ': contratacao('pj'),
      'Freelance': contratacao('freelance'),
      'Contrato': contratacao('outro'), // não deixa claro se é CLT ou PJ
    },
    // Sem labels de localização: ela sai dos colchetes do título.
    descartarVaga: ['Stale'], // "[USO INTERNO] Vagas que serão fechadas"
    ignorar: [],
    // As demais (Python, Docker, PostgreSQL...) são skills.
  },

  'frontendbr/vagas': {
    campos: {
      'Estágio': nivel('estagio'),
      'Júnior': nivel('junior'),
      'Pleno': nivel('pleno'),
      'Sênior': nivel('senior'),
      'Especialista': nivel('especialista'),

      'Remoto': modalidade('remoto'),
      'Híbrido': modalidade('hibrido'),
      'Alocado': modalidade('presencial'),

      'CLT': contratacao('clt'),
      'PJ': contratacao('pj'),
      'Freela': contratacao('freelance'),

      ...labelsDeEstado,
      'Brasilia': localizacao('DF'),
      'Exterior': localizacao(LOCALIZACAO_INTERNACIONAL),
    },
    descartarVaga: ['⚠️ Avisos', 'Stale'], // Avisos são comunicados dos mantenedores, não vagas
    ignorar: ['Falta de informações', 'Pendente de informações'],
    // Sem labels de stack: as skills saem só da descrição.
  },
};