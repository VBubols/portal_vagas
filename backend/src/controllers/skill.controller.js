import { Op } from 'sequelize';
import Skill from '../models/skill.model.js';
import { normalizarTexto } from '../utils/texto.js';

const LIMITE_PADRAO = 10;
const LIMITE_MAXIMO = 20;

// GET /skills?busca=nod&limit=10  ->  [{ id, nome }]
// Sem "busca", devolve as primeiras skills em ordem alfabética.
// No Express 5 o erro de uma função assíncrona sobe sozinho para o middleware
// global de erros; por isso não há try/catch aqui.
export async function listarSkills(req, res) {
    const termo = normalizarTexto(req.query.busca);
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || LIMITE_PADRAO, 1), LIMITE_MAXIMO);

    const where = {};
    if (termo) {
        // escapa % e _ para o usuário não montar curingas no LIKE
        const seguro = termo.replace(/[\\%_]/g, '\\$&');
        where.busca = { [Op.like]: `%${seguro}%` };
    }

    const skills = await Skill.findAll({
        where,
        attributes: ['id', 'nome'],
        order: [['nome', 'ASC']],
        limit,
    });

    return res.status(200).json(skills);
};