import express from 'express';
import { cadastrar, login } from '../controllers/auth.controller.js';
import { limitadorUsuario, limitadorLogin } from '../config/rateLimit.js';
import { validar } from '../middlewares/validator.middleware.js';
import { cadastroSchema, loginSchema } from '../schemas/auth.schema.js';

const authRouter = express.Router();

authRouter.post('/cadastro', limitadorUsuario, validar(cadastroSchema), cadastrar);
authRouter.post('/login', limitadorLogin, validar(loginSchema), login);

export default authRouter;