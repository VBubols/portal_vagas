import { sincronizarVagas } from '../services/sincronizacaoVagas.service.js';

export async function sincronizar(req, res) {
  const resumo = await sincronizarVagas();
  return res.status(200).json(resumo);
}
