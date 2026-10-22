import {
  carregarCurriculoParaMatch, listarVagas, recomendarVagas, obterVaga,
} from '../services/vaga.service.js';
import { montarPaginacao } from '../utils/paginacao.js';

// No Express 5, erros lançados em handlers async já chegam ao middleware de
// erros, então não há try/catch aqui.

export async function listar(req, res) {
  const { pagina, limite, ...filtros } = req.validado.query;
  const curriculo = await carregarCurriculoParaMatch(req.usuario.id);

  const { itens, total } = await listarVagas({ filtros, pagina, limite, curriculo });
  return res.status(200).json({ dados: itens, paginacao: montarPaginacao({ pagina, limite, total }) });
}

export async function recomendadas(req, res) {
  const { pagina, limite, ...filtros } = req.validado.query;
  const curriculo = await carregarCurriculoParaMatch(req.usuario.id);
  if (!curriculo) {
    return res.status(404).json({
      mensagem: 'Currículo não encontrado. Preencha seu currículo para receber recomendações.',
    });
  }

  const { itens, total } = await recomendarVagas({ filtros, pagina, limite, curriculo });
  return res.status(200).json({ dados: itens, paginacao: montarPaginacao({ pagina, limite, total }) });
}

export async function detalhar(req, res) {
  const curriculo = await carregarCurriculoParaMatch(req.usuario.id);
  const resultado = await obterVaga({ id: req.validado.params.id, curriculo });
  if (!resultado) {
    return res.status(404).json({ mensagem: 'Vaga não encontrada' });
  }
  return res.status(200).json(resultado);
}
