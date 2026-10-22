import express from 'express';
import { criar, obter, substituir } from '../controllers/curriculo.controller.js';
import { autenticar } from '../middlewares/auth.middleware.js';
import { validar } from '../middlewares/validator.middleware.js';
import { curriculoSchema } from '../schemas/curriculo.schema.js';

// Montado em /curriculo (ver app.js). A exportação em PDF vive em /curriculo/pdf.
const curriculoRouter = express.Router();

curriculoRouter.use(autenticar);

/**
 * @openapi
 * /curriculo:
 *   post:
 *     tags: [Currículo]
 *     summary: Cria o currículo do usuário logado
 *     description: >
 *       Cada usuário tem no máximo um currículo. Se ele já existir, responde 409:
 *       use `PUT /curriculo` para alterá-lo. `skills` recebe os ids obtidos em `GET /skills`.
 *       Listas não enviadas ficam vazias. Campos desconhecidos são ignorados.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/CurriculoEntrada' }
 *     responses:
 *       201:
 *         description: Currículo criado
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Curriculo' }
 *       400:
 *         description: Dados inválidos (inclui skills inexistentes)
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErroDados' }
 *       401:
 *         description: Token ausente, inválido ou expirado
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Erro' }
 *       409:
 *         description: O usuário já possui um currículo
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Erro' }
 */
curriculoRouter.post('/', validar(curriculoSchema), criar);

/**
 * @openapi
 * /curriculo:
 *   get:
 *     tags: [Currículo]
 *     summary: Devolve o currículo do usuário logado
 *     description: >
 *       Currículo completo, com as listas (experiências, formações, cursos, idiomas, links,
 *       projetos e locais) e as skills. Cada lista sai em ordem fixa: experiências e formações
 *       da mais recente para a mais antiga, e as demais em ordem alfabética.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Currículo do usuário
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Curriculo' }
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
curriculoRouter.get('/', obter);

/**
 * @openapi
 * /curriculo:
 *   put:
 *     tags: [Currículo]
 *     summary: Substitui o currículo do usuário logado
 *     description: >
 *       Recebe o currículo inteiro, no mesmo formato do `POST`, e substitui o que estava salvo.
 *       Listas ausentes no corpo ficam vazias (não são preservadas). A operação é atômica:
 *       se algo falhar, o currículo anterior permanece intacto. Não cria currículo: se o
 *       usuário ainda não tem um, responde 404 (use `POST /curriculo`).
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/CurriculoEntrada' }
 *     responses:
 *       200:
 *         description: Currículo atualizado
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Curriculo' }
 *       400:
 *         description: Dados inválidos (inclui skills inexistentes)
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErroDados' }
 *       401:
 *         description: Token ausente, inválido ou expirado
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Erro' }
 *       404:
 *         description: O usuário ainda não possui currículo
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Erro' }
 */
curriculoRouter.put('/', validar(curriculoSchema), substituir);

export default curriculoRouter;
