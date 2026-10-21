import express from 'express';
import { perfil, atualizarPerfil, atualizarSenha, desativarConta } from '../controllers/usuario.controller.js';
import { autenticar } from '../middlewares/auth.middleware.js';
import { validar } from '../middlewares/validator.middleware.js';
import { atualizarPerfilSchema, atualizarSenhaSchema } from '../schemas/usuario.schema.js';

const userRouter = express.Router();

userRouter.use(autenticar);

/**
 * @openapi
 * /usuario/perfil:
 *   get:
 *     tags: [Usuário]
 *     summary: Devolve os dados do usuário logado
 *     description: >
 *       Atenção: a resposta traz o `cpf` completo (só dígitos), e não mascarado como nas demais
 *       rotas, além dos campos internos `cpfCriptografado` e `cpfHash`, que não fazem parte
 *       do contrato. Não dependa deles.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Dados do usuário
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/PerfilDoUsuario' }
 *       401:
 *         description: Token ausente, inválido ou expirado (inclui conta desativada)
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Erro' }
 */
userRouter.get('/perfil', perfil);
/**
 * @openapi
 * /usuario/perfil:
 *   post:
 *     tags: [Usuário]
 *     summary: Atualiza o nome e/ou o e-mail do usuário logado
 *     description: >
 *       Atualização parcial: envie só o que quer mudar, mas ao menos um campo. Esta rota grava
 *       apenas `nome` e `email`. Sobrenome, CPF, telefones, data de nascimento e país passam
 *       pela validação, mas não são gravados: enviar só esses campos responde `200` sem
 *       alterar nada. Por isso eles não estão listados abaixo. O e-mail não pode pertencer
 *       a outra conta.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               nome: { type: string, minLength: 2, maxLength: 100, example: Maria Clara }
 *               email: { type: string, format: email, example: maria@exemplo.com }
 *     responses:
 *       200:
 *         description: Dados do usuário já atualizados
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/PerfilDoUsuario' }
 *       400:
 *         description: Dados inválidos (inclui corpo sem nenhum campo para atualizar)
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErroDados' }
 *       401:
 *         description: Token ausente, inválido ou expirado (inclui conta desativada)
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Erro' }
 *       409:
 *         description: E-mail já cadastrado em outra conta
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Erro' }
 */
userRouter.post('/perfil', validar(atualizarPerfilSchema), atualizarPerfil);
/**
 * @openapi
 * /usuario/senha:
 *   post:
 *     tags: [Usuário]
 *     summary: Troca a senha do usuário logado
 *     description: A senha antiga precisa estar correta. A nova deve ter de 6 a 72 caracteres.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [senhaAntiga, novaSenha]
 *             properties:
 *               senhaAntiga: { type: string, format: password }
 *               novaSenha: { type: string, format: password, minLength: 6, maxLength: 72 }
 *     responses:
 *       204:
 *         description: Senha alterada (sem corpo)
 *       400:
 *         description: Dados inválidos
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErroDados' }
 *       401:
 *         description: Token ausente, inválido ou expirado, ou senha antiga incorreta (a mensagem diz qual)
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Erro' }
 */
userRouter.post('/senha', validar(atualizarSenhaSchema), atualizarSenha);
/**
 * @openapi
 * /usuario/conta:
 *   delete:
 *     tags: [Usuário]
 *     summary: Desativa a conta do usuário logado
 *     description: >
 *       Exclusão lógica: os dados são mantidos, mas a conta deixa de funcionar na hora. O token
 *       atual passa a dar `401` e um novo login dá `403`. Um admin pode reativar a conta em
 *       `PATCH /admin/usuarios/{id}/reativar`.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       204:
 *         description: Conta desativada (sem corpo)
 *       401:
 *         description: Token ausente, inválido ou expirado (inclui conta desativada)
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Erro' }
 */
userRouter.delete('/conta', desativarConta);

export default userRouter;