// Regras de match entre currículo e vaga. Só funções puras (sem banco), para
// serem fáceis de testar. O acesso ao banco fica em vaga.service.js.
//
// Formato esperado (objetos simples, não instâncias Sequelize):
//   curriculo: { nivel, modalidades[], cidade, uf, cidadeNormalizada,
//                locais[{ cidade, uf, cidadeNormalizada }], skills[{ id, nome }] }
//   vaga:      { nivel, modalidade, cidade, uf, cidadeNormalizada, skills[{ id, nome }] }
//
// Regra geral dos filtros: dado ausente NÃO elimina. Muitas issues do GitHub não
// trazem todas as labels, e descartar essas vagas esvaziaria a recomendação.
// Cada critério devolve true (compatível), false (incompatível) ou null (a vaga
// não informa, então não dá para avaliar). Só `false` elimina.

import { normalizarTexto } from '../utils/texto.js';

const porNome = (a, b) => a.nome.localeCompare(b.nome, 'pt-BR');

function avaliarNivel(curriculo, vaga) {
  if (!vaga.nivel) return null;
  if (!curriculo.nivel) return true;
  return vaga.nivel === curriculo.nivel;
}

function avaliarModalidade(curriculo, vaga) {
  if (!vaga.modalidade) return null;
  // CV sem modalidade preferida = aceita qualquer uma
  if (!curriculo.modalidades || curriculo.modalidades.length === 0) return true;
  return curriculo.modalidades.includes(vaga.modalidade);
}

// Lugares onde a pessoa aceita trabalhar: cidade de residência + CURRICULO_LOCAL.
function locaisAceitos(curriculo) {
  const lista = [
    { cidadeNormalizada: curriculo.cidadeNormalizada || normalizarTexto(curriculo.cidade), uf: curriculo.uf },
    ...(curriculo.locais ?? []).map((l) => ({
      cidadeNormalizada: l.cidadeNormalizada || normalizarTexto(l.cidade),
      uf: l.uf,
    })),
  ];
  return lista.filter((l) => l.cidadeNormalizada || l.uf);
}

function avaliarLocalizacao(curriculo, vaga) {
  // Vaga remota serve para qualquer localização.
  if (vaga.modalidade === 'remoto') return true;

  const cidadeVaga = vaga.cidadeNormalizada || normalizarTexto(vaga.cidade);
  const ufVaga = vaga.uf ?? null;
  if (!cidadeVaga && !ufVaga) return null;

  return locaisAceitos(curriculo).some((l) => {
    if (cidadeVaga) {
      // se a vaga informa cidade, ela precisa bater (e a UF, quando informada)
      return l.cidadeNormalizada === cidadeVaga && (!ufVaga || l.uf === ufVaga);
    }
    // vaga só informa o estado
    return l.uf === ufVaga;
  });
}

export function avaliarCriterios(curriculo, vaga) {
  const criterios = {
    nivel: avaliarNivel(curriculo, vaga),
    modalidade: avaliarModalidade(curriculo, vaga),
    localizacao: avaliarLocalizacao(curriculo, vaga),
  };
  const elegivel = !Object.values(criterios).includes(false);
  return { elegivel, criterios };
}

// % = skills da vaga que o usuário tem ÷ total de skills da vaga × 100.
// Vaga sem skills cadastradas não tem como ser pontuada: compatibilidade = null.
export function calcularCompatibilidade(skillsCurriculo = [], skillsVaga = []) {
  const idsDoUsuario = new Set(skillsCurriculo.map((s) => s.id));
  const skillsQueTem = skillsVaga.filter((s) => idsDoUsuario.has(s.id)).sort(porNome);
  const skillsQueFaltam = skillsVaga.filter((s) => !idsDoUsuario.has(s.id)).sort(porNome);

  const compatibilidade = skillsVaga.length === 0
    ? null
    : Math.round((skillsQueTem.length / skillsVaga.length) * 100);

  return { compatibilidade, skillsQueTem, skillsQueFaltam };
}

export function montarMatch(curriculo, vaga) {
  return {
    ...avaliarCriterios(curriculo, vaga),
    ...calcularCompatibilidade(curriculo.skills, vaga.skills),
  };
}

const tempo = (data) => (data ? new Date(data).getTime() : 0);

// Maior compatibilidade primeiro; vagas sem % (null) vão para o fim;
// empate resolvido pela vaga mais recente.
export function ordenarPorCompatibilidade(itens) {
  return [...itens].sort((a, b) => {
    const ca = a.compatibilidade ?? -1;
    const cb = b.compatibilidade ?? -1;
    if (cb !== ca) return cb - ca;
    return tempo(b.publicadaEm) - tempo(a.publicadaEm);
  });
}
