import { NIVEIS } from '../constants/enums.js';
import { normalizarTexto } from '../utils/texto.js';

const PADROES_NIVEL = {
    junior: /\b(junior|jr|early career)\b/,
    pleno: /\bpleno\b/,
    senior: /\b(senior|sr)\b/,
    estagio: /\b(estagio|estagiario|estagiario(a)|intern)\b/,
    especialista: /\b(especialista|lead|manager)\b/
};

export function extrairNiveisDoTitulo(titulo) {
    const texto = normalizarTexto(titulo);

    return NIVEIS.filter((nivel) => PADROES_NIVEL[nivel]?.test(texto))
}