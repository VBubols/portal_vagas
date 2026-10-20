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
import { NIVEIS, MODALIDADES, UFS, CONTRATACOES, ORIGENS_VAGA } from '../constants/enums.js';

const raiz = path.dirname(fileURLToPath(import.meta.url));

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
    },
  },
};

export const swaggerSpec = swaggerJsdoc({
  definition,
  // caminho absoluto: funciona não importa de qual pasta o servidor foi iniciado
  apis: [path.join(raiz, '../routes/*.js')],
});
