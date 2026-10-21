import express from 'express';
import { listarUsuarios, desativarUsuario, reativarUsuario } from '../controllers/admin.controller.js';
import { autenticar } from '../middlewares/auth.middleware.js';
import { autorizar } from '../middlewares/authorize.middleware.js';
import { validar } from '../middlewares/validator.middleware.js';
import { idParamSchema } from '../schemas/common.schema.js';

const adminRouter = express.Router();

adminRouter.use(autenticar, autorizar('admin'));

adminRouter.get('/usuarios', listarUsuarios);

adminRouter.patch('/usuarios/:id/desativar', validar(idParamSchema, 'params'), desativarUsuario);

adminRouter.patch('/usuarios/:id/reativar', validar(idParamSchema, 'params'), reativarUsuario);

export default adminRouter;