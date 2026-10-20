import express from 'express';
import { obter, criar, atualizar } from '../controllers/curriculo.controller.js';
import { autenticar } from '../middlewares/auth.middleware.js';
import { validar } from '../middlewares/validator.middleware.js';
import { curriculoSchema } from '../schemas/curriculo.schema.js';

const curriculoRouter = express.Router();

// O currículo é sempre o do usuário do token: não há :id na URL.
// Rotas fixas (ex.: /pdf, da pessoa 4) entram neste router sem colidir com estas.
curriculoRouter.use(autenticar);

curriculoRouter.get('/', obter);
curriculoRouter.post('/', validar(curriculoSchema), criar);
curriculoRouter.put('/', validar(curriculoSchema), atualizar);

export default curriculoRouter;