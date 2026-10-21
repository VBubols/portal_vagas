import express from 'express';
import { listarUsuarios, desativarUsuario, reativarUsuario } from '../controllers/admin.controller.js';
import { sincronizar } from '../controllers/sincronizacao.controller.js';
import { autenticar } from '../middlewares/auth.middleware.js';
import { autorizar } from '../middlewares/authorize.middleware.js';
import { validar } from '../middlewares/validator.middleware.js';
import { idParamSchema } from '../schemas/common.schema.js';

const adminRouter = express.Router();

adminRouter.use(autenticar, autorizar('admin'));

adminRouter.get('/usuarios', listarUsuarios);
adminRouter.patch('/usuarios/:id/desativar', validar(idParamSchema, 'params'), desativarUsuario);
adminRouter.patch('/usuarios/:id/reativar', validar(idParamSchema, 'params'), reativarUsuario);

/**
 * @openapi
 * /admin/vagas/sincronizar:
 *   post:
 *     tags: [Admin]
 *     summary: Importa as vagas abertas dos repositórios do GitHub
 *     description: >
 *       Lê as issues abertas de cada fonte em src/config/fontesVagas.js, cria ou atualiza
 *       as vagas e marca como inativas as que foram fechadas no GitHub. Vagas ocultadas
 *       pelo admin continuam ocultas. Se uma fonte falhar, nenhuma vaga dela é inativada.
 *       Só um admin pode chamar, e só uma sincronização roda por vez.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Resumo da sincronização
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 fontes:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       fonte: { type: string, example: 'backend-br/vagas' }
 *                       issues: { type: integer, example: 62 }
 *                       ok: { type: boolean, example: true }
 *                 criadas: { type: integer, example: 55 }
 *                 atualizadas: { type: integer, example: 3 }
 *                 inalteradas: { type: integer, example: 13 }
 *                 inativadas: { type: integer, example: 2 }
 *                 descartadas: { type: integer, example: 8 }
 *                 skillsNaoEncontradas:
 *                   type: array
 *                   description: Labels de skill que não existem na tabela Skill
 *                   items: { type: string }
 *                   example: ['Apache Kafka', 'DDD']
 *                 erros: { type: array, items: { type: string } }
 *                 duracaoMs: { type: integer, example: 4210 }
 *       401:
 *         description: Token ausente, inválido ou expirado
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Erro' }
 *       403:
 *         description: Usuário não é admin
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Erro' }
 *       409:
 *         description: Já existe uma sincronização em andamento
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Erro' }
 */
adminRouter.post('/vagas/sincronizar', sincronizar);

export default adminRouter;