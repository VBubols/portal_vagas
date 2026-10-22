import * as curriculoService from '../services/curriculo.service.js';

// No Express 5, erros lançados em handlers async já chegam ao middleware de
// erros, então não há try/catch aqui. O corpo já chega validado e limpo pelo Zod.

export async function criar(req, res) {
  const curriculo = await curriculoService.criarCurriculo(req.usuario.id, req.body);
  return res.status(201).json(curriculo);
}

export async function obter(req, res) {
  const curriculo = await curriculoService.obterCurriculo(req.usuario.id);
  return res.status(200).json(curriculo);
}

export async function substituir(req, res) {
  const curriculo = await curriculoService.substituirCurriculo(req.usuario.id, req.body);
  return res.status(200).json(curriculo);
}
