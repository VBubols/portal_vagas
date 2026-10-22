import express from 'express';
import { listar, recomendadas, detalhar } from '../controllers/vaga.controller.js';
import { autenticar } from '../middlewares/auth.middleware.js';
import { validarQuery, validarParams } from '../middlewares/validator-query.middleware.js';
import { listarVagasQuerySchema, vagaIdParamsSchema } from '../schemas/vaga.schema.js';

// Montado em /vagas (ver app.js)
const vagaRouter = express.Router();

/**
 * @openapi
 * /vagas:
 *   get:
 *     tags: [Vagas]
 *     summary: Busca vagas com filtros e paginação
 *     description: >
 *       Lista as vagas ativas e visíveis (não ocultas), da mais recente para a mais antiga.
 *       Não aplica os filtros eliminatórios do currículo: use `/vagas/recomendadas` para isso.
 *       Se o usuário já tem currículo, cada vaga traz `compatibilidade`; caso contrário ela é `null`.
 *       Filtros com vários valores aceitam `a,b` ou o parâmetro repetido.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/BuscaTexto'
 *       - $ref: '#/components/parameters/FiltroNivel'
 *       - $ref: '#/components/parameters/FiltroModalidade'
 *       - $ref: '#/components/parameters/FiltroStack'
 *       - $ref: '#/components/parameters/Pagina'
 *       - $ref: '#/components/parameters/Limite'
 *     responses:
 *       200:
 *         description: Página de vagas
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ListaDeVagas' }
 *       400:
 *         description: Parâmetros inválidos
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErroValidacao' }
 *       401:
 *         description: Token ausente, inválido ou expirado
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Erro' }
 */
vagaRouter.get('/', autenticar, validarQuery(listarVagasQuerySchema), listar);

/**
 * @openapi
 * /vagas/recomendadas:
 *   get:
 *     tags: [Vagas]
 *     summary: Vagas recomendadas para o currículo do usuário
 *     description: >
 *       Aplica os filtros eliminatórios (nível, modalidade e localização; vaga remota serve para
 *       qualquer localização) e ordena pela compatibilidade de skills, da maior para a menor.
 *       Vagas sem skills cadastradas não têm % (`compatibilidade: null`) e ficam no fim.
 *       Um critério que a vaga não informa não elimina a vaga.
 *       Aceita os mesmos filtros de busca de `/vagas`, aplicados além dos eliminatórios.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/BuscaTexto'
 *       - $ref: '#/components/parameters/FiltroNivel'
 *       - $ref: '#/components/parameters/FiltroModalidade'
 *       - $ref: '#/components/parameters/FiltroStack'
 *       - $ref: '#/components/parameters/Pagina'
 *       - $ref: '#/components/parameters/Limite'
 *     responses:
 *       200:
 *         description: Página de vagas ordenadas por compatibilidade (lista vazia se nada for compatível)
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ListaDeVagas' }
 *       400:
 *         description: Parâmetros inválidos
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErroValidacao' }
 *       401:
 *         description: Token ausente, inválido ou expirado
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Erro' }
 *       404:
 *         description: O usuário ainda não preencheu o currículo
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Erro' }
 */
vagaRouter.get('/recomendadas', autenticar, validarQuery(listarVagasQuerySchema), recomendadas);

/**
 * @openapi
 * /vagas/{id}:
 *   get:
 *     tags: [Vagas]
 *     summary: Detalhe da vaga com o match detalhado
 *     description: >
 *       Devolve a vaga completa (descrição e link de candidatura). Se o usuário tem currículo,
 *       `match` traz a compatibilidade, as skills que ele tem e as que faltam, e o resultado de
 *       cada critério eliminatório (`true` compatível, `false` incompatível, `null` a vaga não informa).
 *       Sem currículo, `match` é `null`. Vagas inativas ou ocultas respondem 404.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Vaga e match
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/DetalheDaVaga' }
 *       400:
 *         description: Id inválido
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErroValidacao' }
 *       401:
 *         description: Token ausente, inválido ou expirado
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Erro' }
 *       404:
 *         description: Vaga não encontrada, inativa ou oculta
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Erro' }
 */
vagaRouter.get('/:id', autenticar, validarParams(vagaIdParamsSchema), detalhar);

export default vagaRouter;
