// Valores compartilhados entre CV (pessoa 2) e Vaga (pessoa 3).
// Nível e modalidade PRECISAM ser idênticos nos dois lados, senão o match
// (pessoa 4) compara coisas diferentes. Qualquer mudança aqui afeta os três.

export const NIVEIS = ['estagio', 'junior', 'pleno', 'senior'];

export const MODALIDADES = ['remoto', 'hibrido', 'presencial'];

export const UFS = [
  'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS', 'MG', 'PA',
  'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO',
];

export const CONTRATACOES = ['clt', 'pj', 'estagio', 'freelancer', 'temporario', 'outro'];

export const ORIGENS_VAGA = ['github', 'interna'];

export const GRAUS = ['tecnico', 'tecnologo', 'graduacao', 'pos_graduacao', 'mestrado', 'doutorado'];
export const SITUACOES_FORMACAO = ['concluido', 'cursando', 'trancado'];
export const NIVEIS_IDIOMA = ['basico', 'intermediario', 'avancado', 'fluente', 'nativo'];
export const TIPOS_LINK = ['github', 'linkedin', 'portfolio', 'outro'];
