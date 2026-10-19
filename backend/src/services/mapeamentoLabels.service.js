import { mapeamentoLabels } from '../config/mapeamentoLabels.js';
import { fontesVagas } from '../config/fontesVagas.js';
import { NIVEIS, MODALIDADES, CONTRATACOES, LOCALIZACOES } from '../constants/enums.js';

const valoresValidos = {
  niveis: NIVEIS,
  modalidades: MODALIDADES,
  contratacoes: CONTRATACOES,
  localizacoes: LOCALIZACOES,
};

// 'Brasília' -> 'brasilia', '⚠️ Avisos' -> 'avisos'
function normalizar(texto) {
  return texto
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '') // acentos
    .replace(/[^\p{L}\p{N}\s.#+/-]/gu, '') // emoji e símbolos soltos
    .trim()
    .toLowerCase();
}

// Monta as regras uma vez, na inicialização. Erro de digitação no arquivo de
// configuração derruba o servidor na hora, em vez de gerar vaga com valor inválido.
const regrasPorFonte = new Map(
  Object.entries(mapeamentoLabels).map(([fonte, config]) => {
    const campos = new Map();
    for (const [label, { campo, valor }] of Object.entries(config.campos)) {
      if (!valoresValidos[campo]?.includes(valor)) {
        throw new Error(`Mapeamento inválido em ${fonte}: '${label}' -> ${campo}.${valor}`);
      }
      campos.set(normalizar(label), { campo, valor });
    }
    return [
      fonte,
      {
        campos,
        descartarVaga: new Set(config.descartarVaga.map(normalizar)),
        ignorar: new Set(config.ignorar.map(normalizar)),
      },
    ];
  }),
);

for (const { owner, repo } of fontesVagas) {
  if (!regrasPorFonte.has(`${owner}/${repo}`)) {
    throw new Error(`Fonte sem mapeamento de labels: ${owner}/${repo}`);
  }
}

// Recebe a fonte ('backend-br/vagas') e as labels da issue, no formato do github.service.
// Os campos são listas: uma vaga pode ter Júnior e Pleno ao mesmo tempo.
export function aplicarMapeamento(fonte, labels) {
  const regras = regrasPorFonte.get(fonte);
  if (!regras) throw new Error(`Fonte sem mapeamento de labels: ${fonte}`);

  const resultado = {
    descartar: false,
    niveis: [],
    modalidades: [],
    contratacoes: [],
    localizacoes: [],
    skills: [], // nomes crus; o casamento com a tabela Skill fica na sincronização
  };

  for (const { nome } of labels) {
    const chave = normalizar(nome);

    if (regras.descartarVaga.has(chave)) {
      resultado.descartar = true;
      continue;
    }

    const mapeado = regras.campos.get(chave);
    if (mapeado) {
      if (!resultado[mapeado.campo].includes(mapeado.valor)) {
        resultado[mapeado.campo].push(mapeado.valor);
      }
      continue;
    }

    if (regras.ignorar.has(chave)) continue;

    resultado.skills.push(nome);
  }

  return resultado;
}