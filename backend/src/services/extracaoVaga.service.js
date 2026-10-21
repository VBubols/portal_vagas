import { NIVEIS, MODALIDADES, NOMES_UF } from '../constants/enums.js';
import { normalizarTexto } from '../utils/texto.js';

const PADROES_NIVEL = {
  junior: /\b(junior|jr|early career)\b/,
  pleno: /\bpleno\b/,
  senior: /\b(senior|sr)\b/,
  estagio: /\b(estagi\w*|intern(ship)?)\b/,
  especialista: /\b(especialista|lead|manager)\b/,
};

export function extrairNiveisDoTitulo(titulo) {
  const texto = normalizarTexto(titulo);
  return NIVEIS.filter((nivel) => PADROES_NIVEL[nivel]?.test(texto));
}

// Trecho entre colchetes ou parênteses no começo do título, seguido do resto.
// "[Remoto] Dev JR - Empresa" -> grupo 1: "Remoto", grupo 2: "Dev JR - Empresa"
const PADRAO_LOCAL_NO_INICIO = /^\s*[[(]([^\])]*)[\])]\s*(.*)$/;

// Separa o trecho inicial entre [ ] ou ( ), que traz modalidade e localização,
// do resto do título. Devolve o texto original, sem normalizar.
export function separarTitulo(titulo) {
  const texto = String(titulo ?? '').trim();
  const partes = texto.match(PADRAO_LOCAL_NO_INICIO);

  if (!partes) return { local: null, cargo: texto };

  return {
    local: partes[1].trim() || null,
    cargo: partes[2].replace(/^[\s\-–—|:]+/, '').trim(),
  };
}

// Capitais e alguns polos de tecnologia: viram cidade + UF.
// Para reconhecer outra cidade, acrescente aqui.
const CIDADES_CONHECIDAS = [
  ['Rio Branco', 'AC'], ['Maceió', 'AL'], ['Macapá', 'AP'], ['Manaus', 'AM'],
  ['Salvador', 'BA'], ['Fortaleza', 'CE'], ['Brasília', 'DF'], ['Vitória', 'ES'],
  ['Goiânia', 'GO'], ['São Luís', 'MA'], ['Cuiabá', 'MT'], ['Campo Grande', 'MS'],
  ['Belo Horizonte', 'MG'], ['Belém', 'PA'], ['João Pessoa', 'PB'], ['Curitiba', 'PR'],
  ['Recife', 'PE'], ['Teresina', 'PI'], ['Rio de Janeiro', 'RJ'], ['Natal', 'RN'],
  ['Porto Alegre', 'RS'], ['Porto Velho', 'RO'], ['Boa Vista', 'RR'], ['Florianópolis', 'SC'],
  ['São Paulo', 'SP'], ['Aracaju', 'SE'], ['Palmas', 'TO'],
  ['Campinas', 'SP'], ['São José dos Campos', 'SP'], ['Joinville', 'SC'], ['Blumenau', 'SC'],
  ['São José', 'SC'], ['Uberlândia', 'MG'], ['Londrina', 'PR'], ['Maringá', 'PR'],
];
const CIDADE_POR_NOME = new Map(
  CIDADES_CONHECIDAS.map(([cidade, uf]) => [normalizarTexto(cidade), { cidade, uf }]),
);

// "sp" -> "SP" e "santa catarina" -> "SC"
const UF_POR_NOME = new Map(
  Object.entries(NOMES_UF).flatMap(([uf, nome]) => [
    [uf.toLowerCase(), uf],
    [normalizarTexto(nome), uf],
  ]),
);

const PADROES_MODALIDADE = {
  remoto: /\b(remot[oa]|remote|full remote|home office|anywhere)\b/,
  hibrido: /\b(hibrid[oa]|hybrid)\b/,
  presencial: /\b(presencial|on-?site|alocad[oa])\b/,
};

// Países fora do Brasil. "us" fica de fora de propósito: "EN-US" não é localização.
const PADRAO_EXTERIOR =
  /\b(exterior|internacional|international|argentina|mexico|chile|colombia|peru|uruguai|uruguay|paraguai|portugal|espanha|spain|eua|usa|estados unidos|united states|canada|reino unido|uk|inglaterra|alemanha|germany|franca|france|irlanda|holanda|europa|europe)\b/;

// Separadores entre as partes do trecho: / , + ! - "ou" "em"
const SEPARADORES_LOCAL = /\s*(?:[/,+!]|\s-\s|-|\bou\b|\bem\b)\s*/;

// Lê o trecho de local devolvido pelo separarTitulo.
// "Remoto ou Híbrido - São Paulo/SP" ->
//   { modalidades: ['remoto', 'hibrido'], cidades: ['São Paulo'], ufs: ['SP'], internacional: false }
export function extrairLocal(trecho) {
  const encontradas = new Set();
  const cidades = [];
  const ufs = [];
  let internacional = false;

  const partes = String(trecho ?? '')
    .split(SEPARADORES_LOCAL)
    .map(normalizarTexto)
    .filter(Boolean);

  for (const parte of partes) {
    for (const [modalidade, padrao] of Object.entries(PADROES_MODALIDADE)) {
      if (padrao.test(parte)) encontradas.add(modalidade);
    }

    if (PADRAO_EXTERIOR.test(parte)) {
      internacional = true;
      continue;
    }

    const cidade = CIDADE_POR_NOME.get(parte);
    if (cidade) {
      if (!cidades.includes(cidade.cidade)) cidades.push(cidade.cidade);
      if (!ufs.includes(cidade.uf)) ufs.push(cidade.uf);
      continue;
    }

    const uf = UF_POR_NOME.get(parte);
    if (uf && !ufs.includes(uf)) ufs.push(uf);
  }

  return {
    modalidades: MODALIDADES.filter((m) => encontradas.has(m)), // mais flexível primeiro
    cidades,
    ufs,
    internacional,
  };
}