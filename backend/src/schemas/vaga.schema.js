import { z } from 'zod';
import { NIVEIS, MODALIDADES, CONTRATACOES, STACKS, UFS, ORIGENS_VAGA } from '../constants/enums.js';

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

// Vaga interna: o admin conhece os dados, então o contrato é mais restrito
// que o das vagas extraídas do GitHub. Campos internos são descartados pelo Zod.
export const vagaInternaSchema = z
  .object({
    titulo: z.string().trim().min(3, 'Título muito curto').max(255),
    empresa: z.string().trim().min(2, 'Informe a empresa').max(255),
    descricao: z.string().trim().max(10000).optional(),
    link: z.url({ protocol: /^https?$/, error: 'Link de candidatura inválido (use http:// ou https://)' }).max(255),
    nivel: z.enum(NIVEIS, 'Nível inválido'),
    modalidade: z.enum(MODALIDADES, 'Modalidade inválida'),
    contratacao: z.enum(CONTRATACOES, 'Contratação inválida').optional(),
    stack: z.enum(STACKS, 'Stack inválida'),
    cidade: z.string().trim().max(100).optional(),
    uf: z.enum(UFS, 'UF inválida').optional(),
    skills: z.array(z.uuid('ID de skill inválido'))
      .min(1, 'Informe ao menos uma skill')
      .max(30, 'Informe no máximo 30 skills')
      .transform((ids) => [...new Set(ids)]),
  })
  .superRefine((vaga, ctx) => {
    const exterior = vaga.cidade === 'Exterior';
    if (vaga.modalidade !== 'remoto' && !vaga.uf && !exterior) {
      ctx.addIssue({ code: 'custom', path: ['uf'], message: 'Informe a UF de vagas presenciais ou híbridas' });
    }
    if (exterior && vaga.uf) {
      ctx.addIssue({ code: 'custom', path: ['uf'], message: 'Vaga no exterior não tem UF' });
    }
  });

// z.coerce.boolean() converteria o texto "false" em true; aceitamos só os
// dois valores explícitos da query. Não altera a busca pública de vagas.
const booleanoQuery = z.enum(['true', 'false']).transform((valor) => valor === 'true').optional();
export const listarVagasAdminQuerySchema = z.object({
  busca: z.string().trim().max(100).transform((texto) => texto || undefined).optional(),
  origem: z.enum(ORIGENS_VAGA).optional(),
  ativa: booleanoQuery,
  oculta: booleanoQuery,
  pagina: z.coerce.number().int().min(1).default(1),
  limite: z.coerce.number().int().min(1).max(50).default(20),
});
