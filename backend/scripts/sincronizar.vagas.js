// Roda a mesma sincronização do botão "Sincronizar vagas" da tela de admin, só que
// pelo terminal e sem o limite de tempo da Vercel. Útil na primeira carga de um banco novo.
// Rodar de dentro de backend/: npm run vagas:sincronizar
import 'dotenv/config';
import sequelize from '../src/config/database.js';
import '../src/models/index.js';
import { sincronizarVagas } from '../src/services/sincronizacaoVagas.service.js';

try {
  console.log('Sincronizando vagas do GitHub...');
  const resumo = await sincronizarVagas();
  console.dir(resumo, { depth: null });
} finally {
  await sequelize.close();
}
