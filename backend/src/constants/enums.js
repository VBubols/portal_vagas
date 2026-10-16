// Valores padronizados compartilhados por vagas, CV, mapeamento de labels e match.
// No banco vai sempre o valor ('junior'); o rótulo ('Júnior') é só para exibição.
// Uso: z.enum(NIVEIS) nos schemas Zod e DataTypes.ENUM(...NIVEIS) nos models.

// Em ordem crescente de experiência, então o match pode comparar pelo índice.
export const NIVEIS = ['estagio', 'junior', 'pleno', 'senior', 'especialista'];

export const MODALIDADES = ['remoto', 'hibrido', 'presencial'];

export const CONTRATACOES = ['clt', 'pj', 'freelance', 'outro'];

export const ORIGENS_VAGA = ['github', 'interna'];

export const UFS = {
  AC: 'Acre',
  AL: 'Alagoas',
  AP: 'Amapá',
  AM: 'Amazonas',
  BA: 'Bahia',
  CE: 'Ceará',
  DF: 'Distrito Federal',
  ES: 'Espírito Santo',
  GO: 'Goiás',
  MA: 'Maranhão',
  MT: 'Mato Grosso',
  MS: 'Mato Grosso do Sul',
  MG: 'Minas Gerais',
  PA: 'Pará',
  PB: 'Paraíba',
  PR: 'Paraná',
  PE: 'Pernambuco',
  PI: 'Piauí',
  RJ: 'Rio de Janeiro',
  RN: 'Rio Grande do Norte',
  RS: 'Rio Grande do Sul',
  RO: 'Rondônia',
  RR: 'Roraima',
  SC: 'Santa Catarina',
  SP: 'São Paulo',
  SE: 'Sergipe',
  TO: 'Tocantins',
};

export const LOCALIZACAO_INTERNACIONAL = 'internacional';

export const LOCALIZACOES = [...Object.keys(UFS), LOCALIZACAO_INTERNACIONAL];

export const ROTULOS = {
  niveis: {
    estagio: 'Estágio',
    junior: 'Júnior',
    pleno: 'Pleno',
    senior: 'Sênior',
    especialista: 'Especialista',
  },
  modalidades: { remoto: 'Remoto', hibrido: 'Híbrido', presencial: 'Presencial' },
  contratacoes: { clt: 'CLT', pj: 'PJ', freelance: 'Freelance', outro: 'Outro' },
  localizacoes: { ...UFS, [LOCALIZACAO_INTERNACIONAL]: 'Exterior' },
};