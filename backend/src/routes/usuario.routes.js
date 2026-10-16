import express from 'express';
import { perfil, atualizarPerfil, atualizarSenha, desativarConta } from '../controllers/usuario.controller.js';
import { autenticar } from '../middlewares/auth.middleware.js';
import { validar } from '../middlewares/validator.middleware.js';
import { atualizarPerfilSchema, atualizarSenhaSchema } from '../schemas/usuario.schema.js';

const userRouter = express.Router();

userRouter.use(autenticar);

userRouter.get('/perfil', perfil);
userRouter.post('/perfil', validar(atualizarPerfilSchema), atualizarPerfil);
userRouter.post('/senha', validar(atualizarSenhaSchema), atualizarSenha);
userRouter.delete('/conta', desativarConta);

export default userRouter;