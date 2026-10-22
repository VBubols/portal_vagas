import { z } from 'zod';
import {
  NIVEIS, MODALIDADES, UFS, GRAUS, SITUACOES_FORMACAO, NIVEIS_IDIOMA, TIPOS_LINK,
} from '../constants/enums.js';
import {
  emailSchema, anulavel, erroCampo, normalizarTelefone,
} from './common.schema.js';
import { normalizarTexto } from '../utils/texto.js';
import { LIMITES_CURRICULO as L } from '../constants/curriculo.limites.js';

// Regra geral: é obrigatório o que o model marca com allowNull: false.
// Campos desconhecidos (id, usuarioId, cidadeNormalizada...) são descartados pelo
// z.object, então o cliente nunca consegue gravá-los.

// ---------------------------------------------------------------------------
// Peças reutilizáveis
// ---------------------------------------------------------------------------

const texto = (max, mensagemInvalida = 'Texto inválido') => z
  .string({ error: erroCampo(mensagemInvalida) })
  .trim()
  .min(1, 'Campo obrigatório')
  .max(max, `Deve ter no máximo ${max} caracteres`);

const opcao = (valores) => z.enum(valores, {
  error: (issue) => (issue.input === undefined
    ? 'Campo obrigatório'
    : `Valor inválido (use: ${valores.join(', ')})`),
});

const ufSchema = z
  .string({ error: erroCampo('UF inválida') })
  .trim()
  .toUpperCase()
  .pipe(opcao(UFS));

// Aceita AAAA-MM (campo de mês do formulário) ou AAAA-MM-DD; guarda sempre AAAA-MM-DD (dia 01 no primeiro caso).
const data = z.preprocess(
  (v) => (typeof v === 'string' && /^\d{4}-\d{2}$/.test(v.trim()) ? `${v.trim()}-01` : v),
  z.iso.date({ error: erroCampo('Data inválida (use AAAA-MM ou AAAA-MM-DD)') }),
);

// Só http(s): evita "javascript:" e afins em links que o front vai renderizar.
const urlSchema = z
  .url({
    protocol: /^https?$/,
    error: erroCampo('URL inválida (use http:// ou https://)'),
  })
  .max(L.url, `Deve ter no máximo ${L.url} caracteres`);

const lista = (item, max, rotulo) => z
  .array(item, { error: erroCampo('Lista inválida') })
  .max(max, `Informe no máximo ${max} ${rotulo}`)
  .default([]);

// Telefone de contato do currículo: fixo ou celular, com DDD. Fica salvo já
// formatado porque o PDF imprime o valor como está.
function formatarTelefone(digitos) {
  const ddd = digitos.slice(0, 2);
  const numero = digitos.slice(2);
  const corte = numero.length - 4;
  return `(${ddd}) ${numero.slice(0, corte)}-${numero.slice(corte)}`;
}

const telefoneContatoSchema = z
  .string({ error: erroCampo('Telefone inválido') })
  .min(1, 'Campo obrigatório')
  .transform(normalizarTelefone)
  .refine(
    (v) => /^[1-9]{2}(9\d{8}|[2-5]\d{7})$/.test(v),
    'Telefone inválido (use DDD + número)',
  )
  .transform(formatarTelefone);

// "fim" nunca pode ser anterior ao "inicio" (AAAA-MM-DD compara como texto).
const fimDepoisDoInicio = (item) => !item.inicio || !item.fim || item.fim >= item.inicio;
const MSG_PERIODO = { message: 'A data de término não pode ser anterior à de início', path: ['fim'] };

// ---------------------------------------------------------------------------
// Tabelas filhas
// ---------------------------------------------------------------------------

const localSchema = z.object({
  cidade: texto(L.textoCurto),
  uf: ufSchema,
});

const experienciaSchema = z
  .object({
    empresa: texto(L.textoCurto),
    cargo: texto(L.textoCurto),
    cidade: anulavel(texto(L.textoCurto)),
    uf: anulavel(ufSchema),
    inicio: data,
    fim: anulavel(data),
    atual: z.boolean({ error: 'Deve ser verdadeiro ou falso' }).default(false),
    descricao: anulavel(texto(L.descricaoExperiencia)),
  })
  // Experiência atual não tem término: se o front mandar um "fim" junto, ele é descartado.
  .transform((e) => (e.atual ? { ...e, fim: null } : e))
  .refine((e) => e.atual || Boolean(e.fim), {
    message: 'Informe a data de término ou marque como experiência atual',
    path: ['fim'],
  })
  .refine(fimDepoisDoInicio, MSG_PERIODO);

const formacaoSchema = z
  .object({
    instituicao: texto(L.textoCurto),
    curso: texto(L.textoCurto),
    grau: opcao(GRAUS),
    situacao: opcao(SITUACOES_FORMACAO),
    inicio: anulavel(data),
    fim: anulavel(data), // conclusão ou, se estiver cursando, previsão
  })
  .refine(fimDepoisDoInicio, MSG_PERIODO);

const cursoSchema = z.object({
  nome: texto(L.textoCurto),
  instituicao: anulavel(texto(L.textoCurto)),
  cargaHoraria: anulavel(
    z.number({ error: 'Carga horária inválida' })
      .int('Use um número inteiro de horas')
      .min(1, 'Deve ser maior que zero')
      .max(10000, 'Carga horária muito alta'),
  ),
  conclusao: anulavel(data),
});

const idiomaSchema = z.object({
  idioma: texto(L.idioma),
  nivel: opcao(NIVEIS_IDIOMA),
});

const linkSchema = z.object({
  tipo: opcao(TIPOS_LINK),
  url: urlSchema,
});

const projetoSchema = z.object({
  nome: texto(L.nomeProjeto),
  descricao: anulavel(texto(L.descricaoProjeto)),
  url: anulavel(urlSchema),
  tecnologias: anulavel(
    z.array(texto(L.tecnologia), { error: 'Lista inválida' })
      .max(L.tecnologias, `Informe no máximo ${L.tecnologias} tecnologias`),
  ),
});

// ---------------------------------------------------------------------------
// Currículo
// ---------------------------------------------------------------------------

// Idioma repetido ("Inglês" e "ingles") é erro do usuário, não dado válido.
const idiomasSemRepeticao = (idiomas) => {
  const vistos = new Set(idiomas.map((i) => normalizarTexto(i.idioma)));
  return vistos.size === idiomas.length;
};

// POST /curriculo e PUT /curriculo usam o mesmo corpo: o PUT substitui o currículo
// inteiro, então o que não for enviado (ex.: "projetos") fica vazio.
export const curriculoSchema = z.object({
  nomeCompleto: texto(L.nomeCompleto, 'Nome inválido').refine(
    (nome) => nome.split(/\s+/).length >= 2,
    'Informe nome e sobrenome',
  ),
  titulo: texto(L.titulo),
  emailContato: emailSchema.max(254, 'Deve ter no máximo 254 caracteres'),
  telefone: telefoneContatoSchema,
  resumo: texto(L.resumo),
  nivel: opcao(NIVEIS),
  modalidades: z
    .array(opcao(MODALIDADES), { error: erroCampo('Lista inválida') })
    .min(1, 'Informe ao menos uma modalidade')
    .transform((itens) => [...new Set(itens)]),
  cidade: texto(L.textoCurto),
  uf: ufSchema,

  locais: lista(localSchema, L.locais, 'locais'),
  experiencias: lista(experienciaSchema, L.experiencias, 'experiências'),
  formacoes: lista(formacaoSchema, L.formacoes, 'formações'),
  cursos: lista(cursoSchema, L.cursos, 'cursos'),
  idiomas: lista(idiomaSchema, L.idiomas, 'idiomas')
    .refine(idiomasSemRepeticao, 'Idioma repetido'),
  links: lista(linkSchema, L.links, 'links'),
  projetos: lista(projetoSchema, L.projetos, 'projetos'),

  // IDs vindos do autocomplete de GET /skills; a existência é checada no service.
  skills: z
    .array(z.uuid('ID de skill inválido'), { error: erroCampo('Lista inválida') })
    .max(L.skills, `Informe no máximo ${L.skills} skills`)
    .default([])
    .transform((ids) => [...new Set(ids)]),
});
