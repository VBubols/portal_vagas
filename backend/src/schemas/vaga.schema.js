import { z } from 'zod';
import { NIVEIS, MODALIDADES } from '../constants/enums.js';

// Aceita ?nivel=junior,pleno e também ?nivel=junior&nivel=pleno.
const lista = (itemSchema) => z.preprocess(
  (valor) => {
    if (valor === undefined || valor === '') return undefined;
    const itens = Array.isArray(valor) ? valor : String(valor).split(',');
    return itens.map((i) => i.trim().toLowerCase()).filter(Boolean);
  },
  z.array(itemSchema).max(10).optional(),
);

export const listarVagasQuerySchema = z.object({
  q: z.string().trim().max(100, 'Busca deve ter no máximo 100 caracteres')
    .transform((texto) => texto || undefined).optional(),
  nivel: lista(z.enum(NIVEIS)),
  modalidade: lista(z.enum(MODALIDADES)),
  // O conjunto de stacks vem da tabela de mapeamento (pessoa 3), por isso não é enum aqui.
  stack: lista(z.string().max(50)),
  pagina: z.coerce.number().int().min(1).default(1),
  limite: z.coerce.number().int().min(1).max(50).default(20),
});

export const vagaIdParamsSchema = z.object({
  id: z.uuid('Id da vaga inválido'),
});
