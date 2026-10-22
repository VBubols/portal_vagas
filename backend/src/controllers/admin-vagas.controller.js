import * as adminVagasService from '../services/admin-vagas.service.js';

export async function listarVagas(req, res) {
  return res.status(200).json(await adminVagasService.listarVagasAdmin(req.validado.query));
}

export async function criarVaga(req, res) {
  return res.status(201).json(await adminVagasService.criarVagaInterna(req.body));
}

export async function editarVaga(req, res) {
  return res.status(200).json(await adminVagasService.editarVagaInterna(req.params.id, req.body));
}

export async function removerVaga(req, res) {
  await adminVagasService.removerVagaInterna(req.params.id);
  return res.status(204).send();
}

export async function ocultarVaga(req, res) {
  return res.status(200).json(await adminVagasService.alterarOcultacao(req.params.id, true));
}

export async function reexibirVaga(req, res) {
  return res.status(200).json(await adminVagasService.alterarOcultacao(req.params.id, false));
}
