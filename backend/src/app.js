import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import sequelize from './config/database.js';

// Importa todos os models pra que o sequelize.sync() conheça as tabelas.
import './models/usuario.model.js';

import authRouter from './routes/auth.routes.js';
import userRouter from './routes/usuario.routes.js';
import adminRouter from './routes/admin.routes.js';
import { corsConfig } from './config/cors.js';
import { helmetConfig } from './config/helmet.js';
import { limitadorGlobal } from './config/rateLimit.js';
import { rotaNaoEncontrada, tratadorDeErros } from './middlewares/error.middleware.js';
import { validarChaves } from './utils/cripto.js';

const obrigatorias = [
  'PORT', 'DB_HOST', 'DB_USER', 'DB_PASSWORD', 'DB_NAME', 'DB_PORT',
  'JWT_SECRET', 'CPF_CHAVE_CRIPTO', 'CPF_CHAVE_HASH',
];
const faltando = obrigatorias.filter((nome) => !process.env[nome]);
if (faltando.length) {
  console.error(`Variáveis de ambiente ausentes: ${faltando.join(', ')}`);
  process.exit(1);
}
validarChaves();

const app = express();
app.use(helmetConfig);
app.use(cors(corsConfig));
app.use(express.json());
app.use(limitadorGlobal);

app.use('/auth', authRouter);
app.use('/usuario', userRouter);
app.use('/admin', adminRouter);

app.use(rotaNaoEncontrada);
app.use(tratadorDeErros); // sempre por último

sequelize
  .sync()
  .then(() => {
    app.listen(process.env.PORT, () => {
      console.log(`Rodando o servidor na porta: ${process.env.PORT}`);
    });
  })
  .catch((erro) => {
    console.error('Falha ao conectar/sincronizar o banco:', erro.message);
    process.exit(1);
  });