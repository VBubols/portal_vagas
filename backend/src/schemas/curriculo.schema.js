import { z } from 'zod';
import {
  NIVEIS, MODALIDADES, LOCALIZACOES, GRAUS, SITUACOES_FORMACAO, NIVEIS_IDIOMA, TIPOS_LINK,
} from '../constants/enums.js';
import { emailSchema, anulavel } from './common.schema.js';
import { somenteDigitos } from '../utils/cpf.js';
import { normalizarTexto } from '../utils/texto.js';

// Limites de tamanho e quantidade (combinados com o grupo; para mudar, é só editar aqui).
const LIMITES = {
  nomeCompleto: 100, titulo: 80, resumo: 600, descricaoExperiencia: 500, descricaoProjeto: 400,
  url: 200, experiencias: 10, formacoes: 6, cursos: 15, idiomas: 6, links: 6, locais: 5,
  projetos: 6, skills: 30, tecnologias: 10,
};

const erroCampo = (invalido) => (issue) => (issue.input === undefined || issue.input === '' ? 'Campo obrigatório' : invalido);

const texto = (max, min = 1) =>
  z
    .string({ error: erroCampo('Texto inválido') })
    .trim()
    .min(min, min === 1 ? 'Campo obrigatório' : `Mínimo de ${min} caracteres`)
    .max(max, `Máximo de ${max} caracteres`);

const enumerado = (valores) => z.enum(valores, { error: erroCampo('Valor inválido') });

// Aceita AAAA-MM (campo de mês do formulário) ou AAAA-MM-DD; guarda sempre AAAA-MM-DD.
const dataSchema = z.preprocess(
  (v) => (typeof v === 'string' && /^\d{4}-\d{2}$/.test(v) ? `${v}-01` : v),
  z.iso.date({ error: erroCampo('Data inválida (use AAAA-MM ou AAAA-MM-DD)') }),
);

const urlHttps = z
  .string({ error: erroCampo('URL inválida') })
  .trim()
  .max(LIMITES.url, `Máximo de ${LIMITES.url} caracteres`)
  .refine((v) => {
    try { return new URL(v).protocol === 'https:'; } catch { return false; }
  }, 'URL inválida (use https://)');

// DDD + 8 ou 9 dígitos (aceita +55 e máscara)
const telefoneSchema = z
  .string({ error: erroCampo('Telefone inválido') })
  .min(1, 'Campo obrigatório')
  .transform((v) => {
    const d = somenteDigitos(v);
    return (d.length === 12 || d.length === 13) && d.startsWith('55') ? d.slice(2) : d;
  })
  .refine((v) => /^[1-9]{2}(9\d{8}|[2-5]\d{7})$/.test(v), 'Telefone inválido (use DDD + 8 ou 9 dígitos)');

const sem = (lista, chave) => new Set(lista.map(chave)).size === lista.length;

const experienciaSchema = z
  .object({
    empresa: texto(100),
    cargo: texto(100),
    cidade: anulavel(texto(100)),
    uf: anulavel(enumerado(LOCALIZACOES)),
    inicio: dataSchema,
    atual: z.boolean({ error: 'Valor inválido' }).default(false),
    fim: anulavel(dataSchema),
    descricao: anulavel(texto(LIMITES.descricaoExperiencia)),
  })
  .superRefine((e, ctx) => {
    if (e.atual && e.fim) {
      ctx.addIssue({ code: 'custom', path: ['fim'], message: 'Emprego atual não tem data de fim' });
    }
    if (!e.atual && !e.fim) {
      ctx.addIssue({ code: 'custom', path: ['fim'], message: 'Informe o fim ou marque como emprego atual' });
    }
    if (e.fim && e.fim < e.inicio) {
      ctx.addIssue({ code: 'custom', path: ['fim'], message: 'O fim não pode ser anterior ao início' });
    }
  });

const formacaoSchema = z
  .object({
    instituicao: texto(100),
    curso: texto(100),
    grau: anulavel(enumerado(GRAUS)),
    situacao: enumerado(SITUACOES_FORMACAO),
    inicio: anulavel(dataSchema),
    fim: anulavel(dataSchema), // conclusão ou previsão
  })
  .superRefine((f, ctx) => {
    if (f.inicio && f.fim && f.fim < f.inicio) {
      ctx.addIssue({ code: 'custom', path: ['fim'], message: 'O fim não pode ser anterior ao início' });
    }
  });

const cursoSchema = z.object({
  nome: texto(100),
  instituicao: anulavel(texto(100)),
  cargaHoraria: anulavel(z.number({ error: 'Valor inválido' }).int('Use um número inteiro').min(1).max(10000)),
  conclusao: anulavel(dataSchema),
});

const idiomaSchema = z.object({ idioma: texto(50), nivel: enumerado(NIVEIS_IDIOMA) });

const linkSchema = z.object({ tipo: enumerado(TIPOS_LINK), url: urlHttps });

const projetoSchema = z.object({
  nome: texto(80),
  descricao: anulavel(texto(LIMITES.descricaoProjeto)),
  url: anulavel(urlHttps),
  tecnologias: z.array(texto(40)).max(LIMITES.tecnologias, `Máximo de ${LIMITES.tecnologias} tecnologias`).default([]),
});

const localSchema = z.object({
  cidade: anulavel(texto(100)),
  uf: enumerado(LOCALIZACOES),
});

const lista = (schema, max) => z.array(schema).max(max, `Máximo de ${max} itens`).default([]);

// Usado no POST (criar) e no PUT (substitui tudo).
export const curriculoSchema = z
  .object({
    nomeCompleto: texto(LIMITES.nomeCompleto, 3),
    titulo: texto(LIMITES.titulo),
    resumo: anulavel(texto(LIMITES.resumo)),
    emailContato: emailSchema,
    telefone: telefoneSchema,
    nivel: enumerado(NIVEIS),
    modalidades: z
      .array(enumerado(MODALIDADES), { error: erroCampo('Valor inválido') })
      .min(1, 'Informe ao menos uma modalidade')
      .refine((l) => new Set(l).size === l.length, 'Modalidades repetidas'),
    cidade: texto(100),
    uf: enumerado(LOCALIZACOES),
    locais: lista(localSchema, LIMITES.locais),
    experiencias: lista(experienciaSchema, LIMITES.experiencias),
    formacoes: lista(formacaoSchema, LIMITES.formacoes),
    cursos: lista(cursoSchema, LIMITES.cursos),
    idiomas: lista(idiomaSchema, LIMITES.idiomas),
    links: lista(linkSchema, LIMITES.links),
    projetos: lista(projetoSchema, LIMITES.projetos), // opcional: lista vazia é válida
    skillIds: z
      .array(z.uuid('ID de skill inválido'), { error: erroCampo('Valor inválido') })
      .min(1, 'Informe ao menos uma skill')
      .max(LIMITES.skills, `Máximo de ${LIMITES.skills} skills`)
      .refine((l) => new Set(l).size === l.length, 'Skills repetidas'),
  })
  .superRefine((cv, ctx) => {
    if (!sem(cv.locais, (l) => `${l.uf}|${normalizarTexto(l.cidade ?? '')}`)) {
      ctx.addIssue({ code: 'custom', path: ['locais'], message: 'Locais repetidos' });
    }
  });