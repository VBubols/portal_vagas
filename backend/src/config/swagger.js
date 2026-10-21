// Configuração do Swagger (OpenAPI 3).
//
// Como documentar uma rota nova: escreva um bloco `@openapi` (YAML) logo acima
// da rota, no próprio arquivo em src/routes/. Veja routes/vaga.routes.js como
// modelo. Os schemas e parâmetros reaproveitáveis ficam em `components` abaixo;
// quem criar um schema novo (ex.: Curriculo) acrescenta aqui.
//
// A documentação fica em GET /docs (interface) e GET /docs.json (especificação).
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import swaggerJsdoc from 'swagger-jsdoc';
import {
  NIVEIS, MODALIDADES, UFS, CONTRATACOES, ORIGENS_VAGA,
  GRAUS, SITUACOES_FORMACAO, NIVEIS_IDIOMA, TIPOS_LINK,
} from '../constants/enums.js';
import { LIMITES_CURRICULO as L } from '../constants/curriculo.limites.js';

const raiz = path.dirname(fileURLToPath(import.meta.url));

// Currículo: as listas são as mesmas na entrada (POST/PUT) e na saída (GET).
// Só mudam as skills (entrada: ids; saída: objetos) e os campos gerados pelo servidor.
const data = {
  type: 'string',
  example: '2024-03-01',
  description: 'Data `AAAA-MM-DD`. Também aceita `AAAA-MM` (vira o dia 01).',
};
const texto = (extra = {}) => ({ type: 'string', ...extra });
const nulo = (schema) => ({ ...schema, nullable: true });

const camposCurriculo = {
  nomeCompleto: texto({ example: 'Maria da Conceição', description: 'Nome e sobrenome', maxLength: L.nomeCompleto }),
  titulo: texto({ example: 'Desenvolvedora Front-end Júnior', maxLength: L.titulo }),
  emailContato: texto({ format: 'email', example: 'maria@exemplo.com' }),
  telefone: texto({
    example: '(48) 99999-0000',
    description: 'Fixo ou celular, com DDD. Aceita qualquer formatação e é salvo como `(DD) 99999-9999`.',
  }),
  resumo: texto({ maxLength: L.resumo }),
  nivel: { type: 'string', enum: NIVEIS },
  modalidades: { type: 'array', minItems: 1, items: { type: 'string', enum: MODALIDADES } },
  cidade: texto({ example: 'Palhoça', maxLength: L.textoCurto }),
  uf: { type: 'string', enum: UFS, description: 'Aceita minúsculas na entrada' },
};

const itensCurriculo = {
  locais: {
    type: 'array',
    maxItems: L.locais,
    description: 'Outras cidades onde a pessoa aceita trabalhar (além da cidade de residência)',
    items: {
      type: 'object',
      required: ['cidade', 'uf'],
      properties: { cidade: texto({ example: 'Florianópolis' }), uf: { type: 'string', enum: UFS } },
    },
  },
  experiencias: {
    type: 'array',
    maxItems: L.experiencias,
    items: {
      type: 'object',
      required: ['empresa', 'cargo', 'inicio'],
      description: 'Sem `atual: true`, `fim` é obrigatório. Com `atual: true`, `fim` é descartado.',
      properties: {
        empresa: texto(), cargo: texto(), cidade: nulo(texto()), uf: nulo({ type: 'string', enum: UFS }),
        inicio: data, fim: nulo(data), atual: { type: 'boolean', default: false }, descricao: nulo(texto()),
      },
    },
  },
  formacoes: {
    type: 'array',
    maxItems: L.formacoes,
    items: {
      type: 'object',
      required: ['instituicao', 'curso', 'grau', 'situacao'],
      properties: {
        instituicao: texto(), curso: texto(),
        grau: { type: 'string', enum: GRAUS },
        situacao: { type: 'string', enum: SITUACOES_FORMACAO },
        inicio: nulo(data),
        fim: nulo({ ...data, description: 'Conclusão ou, se estiver cursando, previsão de conclusão' }),
      },
    },
  },
  cursos: {
    type: 'array',
    maxItems: L.cursos,
    items: {
      type: 'object',
      required: ['nome'],
      properties: {
        nome: texto(), instituicao: nulo(texto()),
        cargaHoraria: nulo({ type: 'integer', minimum: 1, maximum: 10000, description: 'Em horas' }),
        conclusao: nulo(data),
      },
    },
  },
  idiomas: {
    type: 'array',
    maxItems: L.idiomas,
    items: {
      type: 'object',
      required: ['idioma', 'nivel'],
      properties: { idioma: texto({ example: 'Inglês' }), nivel: { type: 'string', enum: NIVEIS_IDIOMA } },
    },
  },
  links: {
    type: 'array',
    maxItems: L.links,
    items: {
      type: 'object',
      required: ['tipo', 'url'],
      properties: {
        tipo: { type: 'string', enum: TIPOS_LINK },
        url: texto({ format: 'uri', description: 'Somente http:// ou https://', example: 'https://github.com/maria', maxLength: L.url }),
      },
    },
  },
  projetos: {
    type: 'array',
    maxItems: L.projetos,
    items: {
      type: 'object',
      required: ['nome'],
      properties: {
        nome: texto(), descricao: nulo(texto()),
        url: nulo(texto({ format: 'uri', description: 'Somente http:// ou https://' })),
        tecnologias: nulo({ type: 'array', maxItems: L.tecnologias, items: { type: 'string' } }),
      },
    },
  },
};

const definition = {
  openapi: '3.0.3',
  info: {
    title: 'Portal de Vagas API',
    version: '1.0.0',
    description:
      'API do portal agregador de vagas de tecnologia. ' +
      'Rotas autenticadas exigem o header `Authorization: Bearer <token>` (obtido em `/auth/login`).',
  },
  servers: [{ url: '/', description: 'Servidor atual' }],
  tags: [
    { name: 'Vagas', description: 'Busca, recomendação e detalhe de vagas' },
    { name: 'Currículo', description: 'Currículo do usuário' },
  ],
  components: {
    securitySchemes: {
      bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
    },
    parameters: {
      BuscaTexto: {
        in: 'query', name: 'q', description: 'Texto livre: cada palavra deve aparecer no título, na empresa, na descrição ou nas skills da vaga',
        schema: { type: 'string', maxLength: 100 },
      },
      FiltroNivel: {
        in: 'query', name: 'nivel', description: 'Um ou mais níveis, separados por vírgula',
        schema: { type: 'string' }, example: 'estagio,junior',
      },
      FiltroModalidade: {
        in: 'query', name: 'modalidade', description: 'Uma ou mais modalidades, separadas por vírgula',
        schema: { type: 'string' }, example: 'remoto,hibrido',
      },
      FiltroStack: {
        in: 'query', name: 'stack', description: 'Uma ou mais stacks, separadas por vírgula',
        schema: { type: 'string' }, example: 'frontend,backend',
      },
      Pagina: { in: 'query', name: 'pagina', schema: { type: 'integer', minimum: 1, default: 1 } },
      Limite: { in: 'query', name: 'limite', schema: { type: 'integer', minimum: 1, maximum: 50, default: 20 } },
    },
    schemas: {
      Erro: {
        type: 'object',
        properties: { mensagem: { type: 'string', example: 'Vaga não encontrada' } },
      },
      ErroValidacao: {
        type: 'object',
        properties: {
          mensagem: { type: 'string', example: 'Parâmetros inválidos' },
          erros: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                campo: { type: 'string', example: 'limite' },
                mensagem: { type: 'string', example: 'Too big: expected number to be <=50' },
              },
            },
          },
        },
      },
      ErroDados: {
        type: 'object',
        properties: {
          mensagem: { type: 'string', example: 'Dados inválidos' },
          detalhes: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                campo: { type: 'string', example: 'experiencias.0.fim' },
                mensagem: { type: 'string', example: 'A data de término não pode ser anterior à de início' },
              },
            },
          },
        },
      },
      Skill: {
        type: 'object',
        properties: { id: { type: 'string', format: 'uuid' }, nome: { type: 'string', example: 'React' } },
      },
      Paginacao: {
        type: 'object',
        properties: {
          pagina: { type: 'integer', example: 1 },
          limite: { type: 'integer', example: 20 },
          total: { type: 'integer', example: 134 },
          totalPaginas: { type: 'integer', example: 7 },
        },
      },
      VagaBase: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          origem: { type: 'string', enum: ORIGENS_VAGA },
          titulo: { type: 'string', example: 'Desenvolvedor Front-end Júnior' },
          empresa: { type: 'string', nullable: true },
          nivel: { type: 'string', enum: NIVEIS, nullable: true },
          modalidade: { type: 'string', enum: MODALIDADES, nullable: true },
          contratacao: { type: 'string', enum: CONTRATACOES, nullable: true },
          stack: { type: 'string', nullable: true, example: 'frontend' },
          cidade: { type: 'string', nullable: true },
          uf: { type: 'string', enum: UFS, nullable: true },
          publicadaEm: { type: 'string', format: 'date-time', nullable: true },
          skills: { type: 'array', items: { $ref: '#/components/schemas/Skill' } },
        },
      },
      VagaResumo: {
        allOf: [
          { $ref: '#/components/schemas/VagaBase' },
          {
            type: 'object',
            properties: {
              compatibilidade: {
                type: 'integer', minimum: 0, maximum: 100, nullable: true,
                description: '% de skills da vaga que o usuário tem. `null` se o usuário não tem currículo ou a vaga não tem skills.',
              },
            },
          },
        ],
      },
      ListaDeVagas: {
        type: 'object',
        properties: {
          dados: { type: 'array', items: { $ref: '#/components/schemas/VagaResumo' } },
          paginacao: { $ref: '#/components/schemas/Paginacao' },
        },
      },
      Match: {
        type: 'object',
        properties: {
          elegivel: { type: 'boolean', description: 'false se algum critério eliminatório for incompatível' },
          criterios: {
            type: 'object',
            description: '`true` compatível, `false` incompatível, `null` a vaga não informa o dado',
            properties: {
              nivel: { type: 'boolean', nullable: true },
              modalidade: { type: 'boolean', nullable: true },
              localizacao: { type: 'boolean', nullable: true },
            },
          },
          compatibilidade: { type: 'integer', minimum: 0, maximum: 100, nullable: true },
          skillsQueTem: { type: 'array', items: { $ref: '#/components/schemas/Skill' } },
          skillsQueFaltam: { type: 'array', items: { $ref: '#/components/schemas/Skill' } },
        },
      },
      DetalheDaVaga: {
        type: 'object',
        properties: {
          vaga: {
            allOf: [
              { $ref: '#/components/schemas/VagaBase' },
              {
                type: 'object',
                properties: {
                  descricao: { type: 'string', nullable: true },
                  link: { type: 'string', format: 'uri', description: 'Link externo de candidatura' },
                },
              },
            ],
          },
          match: {
            nullable: true,
            allOf: [{ $ref: '#/components/schemas/Match' }],
            description: '`null` se o usuário ainda não tem currículo',
          },
        },
      },
      CurriculoEntrada: {
        type: 'object',
        required: ['nomeCompleto', 'titulo', 'emailContato', 'telefone', 'resumo', 'nivel', 'modalidades', 'cidade', 'uf'],
        description: 'Corpo do POST e do PUT. Listas e `skills` são opcionais (ausentes = vazias).',
        properties: {
          ...camposCurriculo,
          ...itensCurriculo,
          skills: {
            type: 'array',
            maxItems: L.skills,
            items: { type: 'string', format: 'uuid' },
            description: 'Ids das skills (obtidos em `GET /skills`)',
          },
        },
      },
      Curriculo: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          ...camposCurriculo,
          ...itensCurriculo,
          skills: { type: 'array', items: { $ref: '#/components/schemas/Skill' } },
          completude: {
            type: 'object',
            description: 'Indica se o currículo já tem o necessário para cada uso. Não bloqueia nada.',
            properties: {
              match: { type: 'boolean', description: 'Tem nível, modalidade, cidade, UF e ao menos uma skill' },
              pdf: { type: 'boolean', description: '`match` + resumo e ao menos uma formação' },
            },
          },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
        },
      },
    },
  },
};

export const swaggerSpec = swaggerJsdoc({
  definition,
  // caminho absoluto: funciona não importa de qual pasta o servidor foi iniciado
  apis: [path.join(raiz, '../routes/*.js')],
});
