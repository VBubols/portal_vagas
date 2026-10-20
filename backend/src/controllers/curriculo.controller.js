import * as curriculoService from '../services/curriculo.service.js';

export async function obter(req, res) {
    return res.status(200).json(await curriculoService.obterCurriculo(req.usuario.id));
}

export async function criar(req, res) {
    return res.status(201).json(await curriculoService.criarCurriculo(req.usuario.id, req.body));
}

export async function atualizar(req, res) {
    return res.status(200).json(await curriculoService.atualizarCurriculo(req.usuario.id, req.body));
}