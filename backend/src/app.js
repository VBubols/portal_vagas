import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import sequelize from './config/database.js';

// Importa todos os models pra que o sequelize.sync() conheça as tabelas.
import './models/index.js';

import swaggerUi from 'swagger-ui-express';
import authRouter from './routes/auth.routes.js';
import userRouter from './routes/usuario.routes.js';
import skillRouter from './routes/skill.routes.js';
import vagaRouter from './routes/vaga.routes.js';
import curriculoPdfRouter from './routes/curriculo-pdf.routes.js';
import { swaggerSpec } from './config/swagger.js';
import { corsConfig } from './config/cors.js';
import { helmetConfig } from './config/helmet.js';
import { limitadorGlobal } from './config/rateLimit.js';

const app = express();
app.use(express.json());
app.use(cors(corsConfig));
app.use(helmetConfig);

// Documentação da API. Fica antes do limitador global para os arquivos da
// interface não gastarem a cota de requisições.
app.get('/docs.json', (req, res) => res.json(swaggerSpec));
app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.use(limitadorGlobal);

app.use('/auth', authRouter);
app.use('/usuario', userRouter);
app.use('/skills', skillRouter);
app.use('/vagas', vagaRouter);
app.use('/curriculo/pdf', curriculoPdfRouter);

// sequelize.sync({ alter: true }).then(() => {
//   app.listen(process.env.PORT, () => {
//     console.log(`Rodando o servidor na porta: ${process.env.PORT}`);
//   });
// });

app.listen(process.env.PORT, () => {
  console.log(`Rodando o servidor na porta: ${process.env.PORT}`);
});