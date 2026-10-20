// Valores padronizados compartilhados por vagas, CV, mapeamento de labels e match.
// No banco vai sempre o valor ('junior'); o rótulo ('Júnior') é só para exibição.
// Uso: z.enum(NIVEIS) nos schemas Zod e DataTypes.ENUM(...NIVEIS) nos models.
// Qualquer mudança aqui afeta CV, vagas, mapeamento e match ao mesmo tempo.

// Vaga e CV

// Em ordem crescente de experiência, então o match pode comparar pelo índice.
export const NIVEIS = ['estagio', 'junior', 'pleno', 'senior', 'especialista'];

export const MODALIDADES = ['remoto', 'hibrido', 'presencial'];

export const CONTRATACOES = ['clt', 'pj', 'estagio', 'freelance', 'temporario', 'outro'];

export const ORIGENS_VAGA = ['github', 'interna'];

// Localização

export const NOMES_UF = {
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

// Lista de siglas, para DataTypes.ENUM(...UFS) e z.enum(UFS).
export const UFS = Object.keys(NOMES_UF);

export const LOCALIZACAO_INTERNACIONAL = 'internacional';

// UFs + exterior, usado pelo mapeamento de labels das vagas.
export const LOCALIZACOES = [...UFS, LOCALIZACAO_INTERNACIONAL];

// Currículo

export const GRAUS = ['tecnico', 'tecnologo', 'graduacao', 'pos_graduacao', 'mestrado', 'doutorado'];
export const SITUACOES_FORMACAO = ['concluido', 'cursando', 'trancado'];
export const NIVEIS_IDIOMA = ['basico', 'intermediario', 'avancado', 'fluente', 'nativo'];
export const TIPOS_LINK = ['github', 'linkedin', 'portfolio', 'outro'];

// Rótulos para exibição

export const ROTULOS = {
  niveis: {
    estagio: 'Estágio',
    junior: 'Júnior',
    pleno: 'Pleno',
    senior: 'Sênior',
    especialista: 'Especialista',
  },
  modalidades: { remoto: 'Remoto', hibrido: 'Híbrido', presencial: 'Presencial' },
  contratacoes: {
    clt: 'CLT',
    pj: 'PJ',
    estagio: 'Estágio',
    freelance: 'Freelance',
    temporario: 'Temporário',
    outro: 'Outro',
  },
  localizacoes: { ...NOMES_UF, [LOCALIZACAO_INTERNACIONAL]: 'Exterior' },
};
