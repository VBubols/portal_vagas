import { NIVEIS } from '../constants/enums.js';
import { normalizarTexto } from '../utils/texto.js';

const PADROES_NIVEL = {
    junior: /\b(junior|jr|early career)\b/,
    pleno: /\bpleno\b/,
    senior: /\b(senior|sr)\b/,
    estagio: /\b(estagi\w*|intern(ship)?)\b/,
    especialista: /\b(especialista|lead|manager)\b/
};

export function extrairNiveisDoTitulo(titulo) {
    const texto = normalizarTexto(titulo);

    return NIVEIS.filter((nivel) => PADROES_NIVEL[nivel] ?.test(texto));
};

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