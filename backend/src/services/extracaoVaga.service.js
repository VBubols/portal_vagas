import {
  NIVEIS, MODALIDADES, CONTRATACOES, NOMES_UF, LOCALIZACAO_INTERNACIONAL,
} from '../constants/enums.js';
import { fontesVagas } from '../config/fontesVagas.js';
import { normalizarTexto } from '../utils/texto.js';
import { aplicarMapeamento } from './mapeamentoLabels.service.js';

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

// Passo 4: juntar labels e título, reduzir para valor único e montar a vaga

// Issues fixadas pelos mantenedores com as regras do repositório.
const PADRAO_TITULO_DESCARTE = /\b(regras para divulgacao|rules for advertising)\b/;

const STACK_POR_FONTE = new Map(
  fontesVagas.map(({ owner, repo, stack }) => [`${owner}/${repo}`, stack ?? null]),
);

// A ordem é a prioridade: "Full Stack Front-end" conta como fullstack.
const PADROES_STACK = {
  fullstack: /\bfull[\s-]?stack\b/,
  mobile: /\b(mobile|android|ios|flutter|react native)\b/,
  frontend: /\bfront[\s-]?end\b/,
  backend: /\bback[\s-]?end\b/,
};

// Vagas da Coodesh trazem no fim da descrição: "#### Categoria\nFull-Stack"
const PADRAO_CATEGORIA_COODESH = /####\s*categoria\s*\n+\s*([^\n#]+)/i;

// "... na Google", "... @ Empresa X", no fim do cargo
const PADRAO_EMPRESA = /\s(?:na|@)\s+([^()|]+?)\s*$/i;

const LIMITE_STRING = 255; // tamanho do DataTypes.STRING no model

// Primeiro valor da lista na ordem de referência: menor nível, modalidade mais flexível.
function primeiroNaOrdem(valores, ordem) {
  return ordem.find((valor) => valores.includes(valor)) ?? null;
}

function detectarStack(texto) {
  const normalizado = normalizarTexto(texto);
  if (!normalizado) return null;
  return Object.keys(PADROES_STACK).find((stack) => PADROES_STACK[stack].test(normalizado)) ?? null;
}

function extrairEmpresa(cargo) {
  const encontrado = cargo.match(PADRAO_EMPRESA);
  if (!encontrado) return null;
  const empresa = encontrado[1].replace(/[^\p{L}\p{N}\s.&'-]/gu, '').trim();
  return empresa ? empresa.slice(0, LIMITE_STRING) : null;
}

// Prioridade: cidade do título, UF do título, UF das labels, exterior.
// Vaga só no exterior grava cidade "Exterior": assim ela nunca casa com a cidade
// de um CV no match, a não ser que seja remota.
function reduzirLocal(doTitulo, localizacoesDasLabels) {
  const [cidade] = doTitulo.cidades;
  if (cidade) return { cidade, uf: CIDADE_POR_NOME.get(normalizarTexto(cidade)).uf };

  const uf = doTitulo.ufs[0]
    ?? localizacoesDasLabels.find((valor) => valor !== LOCALIZACAO_INTERNACIONAL);
  if (uf) return { cidade: null, uf };

  if (doTitulo.internacional || localizacoesDasLabels.includes(LOCALIZACAO_INTERNACIONAL)) {
    return { cidade: 'Exterior', uf: null };
  }
  return { cidade: null, uf: null };
}

// Recebe uma issue no formato do github.service e devolve:
//   null, se a issue não for vaga (Avisos, Stale, regras do repositório)
//   { vaga, skillsDasLabels }: vaga pronta para o model Vaga e os nomes das
//   labels de skill, que a gravação casa com a tabela Skill
// O título vale mais que as labels: "Pleno" no título ganha das labels Júnior e Pleno.
export function montarVaga(issue) {
  const labels = aplicarMapeamento(issue.fonte, issue.labels);
  if (labels.descartar || PADRAO_TITULO_DESCARTE.test(normalizarTexto(issue.titulo))) {
    return null;
  }

  const { local, cargo } = separarTitulo(issue.titulo);
  const doTitulo = extrairLocal(local);
  const niveisDoTitulo = extrairNiveisDoTitulo(issue.titulo);
  const { cidade, uf } = reduzirLocal(doTitulo, labels.localizacoes);
  const categoria = issue.descricao?.match(PADRAO_CATEGORIA_COODESH)?.[1];

  return {
    vaga: {
      origem: 'github',
      fonte: issue.fonte,
      githubIssueId: issue.githubId,
      titulo: (cargo || issue.titulo).slice(0, LIMITE_STRING),
      empresa: extrairEmpresa(cargo),
      descricao: issue.descricao,
      link: issue.url,
      nivel: primeiroNaOrdem(niveisDoTitulo.length ? niveisDoTitulo : labels.niveis, NIVEIS),
      modalidade: primeiroNaOrdem(
        doTitulo.modalidades.length ? doTitulo.modalidades : labels.modalidades,
        MODALIDADES,
      ),
      contratacao: primeiroNaOrdem(labels.contratacoes, CONTRATACOES),
      stack: detectarStack(cargo) ?? detectarStack(categoria) ?? STACK_POR_FONTE.get(issue.fonte),
      cidade,
      uf,
      cidadeNormalizada: cidade ? normalizarTexto(cidade) : null,
      ativa: true,
      publicadaEm: issue.criadaEm,
    },
    skillsDasLabels: labels.skills,
  };
}

// Passo 5: skills da vaga, pelas labels, pelo título e pela descrição

// Termos que só valem quando vêm de uma label: no texto livre eles aparecem
// com outro sentido ("next steps", "express interest", "the rest of").
const TERMOS_SO_POR_LABEL = new Set(['express', 'next', 'nest', 'spring', 'actions', 'rest', 'swift', 'excel']);

function escaparRegex(texto) {
  return texto.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// Termo de até 2 letras ("go", "c", "js", "ts") também só vale por label:
// no texto ele casa com palavras comuns. "c#" pode, porque tem símbolo.
function podeBuscarNoTexto(termo) {
  if (TERMOS_SO_POR_LABEL.has(termo)) return false;
  return !(termo.length <= 2 && /^[\p{L}]+$/u.test(termo));
}

// Monta o índice uma vez por sincronização, a partir das skills do banco.
// skills: [{ id, nome, aliases }]
export function criarIndiceSkills(skills) {
  const porTermo = new Map(); // termo normalizado -> id, para casar labels
  const padroesTexto = []; // { id, termo, regex }, para procurar no texto

  for (const skill of skills) {
    const termos = [skill.nome, ...(skill.aliases ?? [])].map(normalizarTexto).filter(Boolean);
    for (const termo of new Set(termos)) {
      if (!porTermo.has(termo)) porTermo.set(termo, skill.id);
      if (podeBuscarNoTexto(termo)) {
        // Nem letra/número antes, nem letra/número/#/+ depois:
        // "java" não casa em "javascript" e "c" não casa em "c#".
        const regex = new RegExp(`(?<![\\p{L}\\p{N}])${escaparRegex(termo)}(?![\\p{L}\\p{N}#+])`, 'gu');
        padroesTexto.push({ id: skill.id, termo, regex });
      }
    }
  }

  // Termos mais longos primeiro: "react native" é removido do texto antes de procurar "react".
  padroesTexto.sort((a, b) => b.termo.length - a.termo.length);
  return { porTermo, padroesTexto };
}

// Tira HTML e links antes de procurar: URLs trazem "utm_source=github" e
// slugs como "dev-python-123", que não são requisitos da vaga.
function prepararTexto(...partes) {
  const bruto = partes
    .filter(Boolean)
    .join(' ')
    .replace(/<[^>]*>/g, ' ')
    .replace(/https?:\/\/\S+/g, ' ');
  return normalizarTexto(bruto);
}

// Devolve os ids das skills da vaga e os nomes de labels que não existem na tabela Skill.
export function extrairSkills({ labels = [], titulo = '', descricao = '' }, indice) {
  const ids = new Set();
  const naoEncontradas = [];

  for (const label of labels) {
    const id = indice.porTermo.get(normalizarTexto(label));
    if (id) ids.add(id);
    else naoEncontradas.push(label);
  }

  let restante = prepararTexto(titulo, descricao);
  for (const { id, regex } of indice.padroesTexto) {
    if (restante.search(regex) !== -1) {
      ids.add(id);
      restante = restante.replace(regex, ' ');
    }
  }

  return { ids: [...ids], naoEncontradas };
}
