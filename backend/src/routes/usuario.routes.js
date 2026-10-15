import express from 'express';
import { perfil, atualizarPerfil, atualizarSenha, desativarConta } from '../controllers/usuario.controller.js';
import { autenticar } from '../middlewares/auth.middleware.js';
import { limitadorUsuario } from '../config/rateLimit.js';
import { validar } from '../middlewares/validator.middleware.js';
import { atualizarPerfilSchema, autalizarSenhaSchema } from '../schemas/usuario.schema.js';

const userRouter = express.Router();

userRouter.get('/perfil', autenticar, limitadorUsuario, perfil);
userRouter.post('/perfil', autenticar, validar(atualizarPerfilSchema), atualizarPerfil);
userRouter.post('/senha', autenticar, validar(autalizarSenhaSchema), atualizarSenha);
userRouter.delete('/conta', autenticar, desativarConta);

export default userRouter;