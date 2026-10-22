import express from 'express';
import { listarSkills } from '../controllers/skill.controller.js';
import { autenticar } from '../middlewares/auth.middleware.js';

const skillRouter = express.Router();

/**
 * @openapi
 * /skills:
 *   get:
 *     tags: [Skills]
 *     summary: Busca skills para o autocomplete
 *     description: >
 *       Devolve uma lista simples (sem paginação) em ordem alfabética. A busca ignora acentos e
 *       maiúsculas e procura o texto em qualquer parte do nome. Sem `busca`, devolve as
 *       primeiras skills. Use os `id` retornados em `skills` no `POST` e no `PUT /curriculo`.
 *       Atenção: aqui o parâmetro de tamanho se chama `limit` (nas demais rotas é `limite`).
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: busca
 *         description: Trecho do nome da skill
 *         schema: { type: string }
 *         example: reac
 *       - in: query
 *         name: limit
 *         description: Quantidade máxima de resultados (valores fora do intervalo são ajustados)
 *         schema: { type: integer, minimum: 1, maximum: 20, default: 10 }
 *     responses:
 *       200:
 *         description: Skills encontradas (lista vazia se nada combinar)
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items: { $ref: '#/components/schemas/Skill' }
 *       401:
 *         description: Token ausente, inválido ou expirado (inclui conta desativada)
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Erro' }
 */
skillRouter.get('/', autenticar, listarSkills);

export default skillRouter;