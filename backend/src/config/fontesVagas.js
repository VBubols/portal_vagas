import { STACKS } from '../constants/enums.js';

// Repositórios de vagas importados pela sincronização.
// Para ampliar as fontes, basta adicionar um item nesta lista.
// stack: valor usado quando nem o título nem a descrição dizem a stack da vaga.
export const fontesVagas = [
  { owner: 'backend-br', repo: 'vagas', stack: 'backend' },
  { owner: 'frontendbr', repo: 'vagas', stack: 'frontend' },
];

for (const { owner, repo, stack } of fontesVagas) {
  if (stack && !STACKS.includes(stack)) {
    throw new Error(`Stack inválida em fontesVagas (${owner}/${repo}): ${stack}`);
  }
}