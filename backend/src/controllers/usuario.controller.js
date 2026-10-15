import Usuario from '../models/usuario.model.js';
import bcrypt from 'bcryptjs';
import { Op } from 'sequelize';

export async function perfil(req, res) {
    try {
        const perfil = await Usuario.findByPk(req.usuario.id, { attributes: { exclude: ['senha'] } });
        return res.status(200).json(perfil);
    } catch (error) {
        console.error(error);
        return res.status(500).json({ mensagem: 'Erro interno do servidor' }); 
    }
};

export async function atualizarPerfil(req, res) {
    try {
        const user = await Usuario.findByPk(req.usuario.id);
        if (!user) {
            return res.status(404).json({ mensagem: 'Usuário não encontrado' });
        }

        const { nome, email } = req.body;
        const updateData = {};
        
        if(email){
            const existing = await Usuario.findOne({
                where: {
                    email: email,
                    id: { [Op.ne]: user.id }
                }
            });
            if (existing) {
                return res.status(409).json({ mensagem: 'Email já cadastrado' });
            } else{
                updateData.email = email;
            }
        };

        if(nome){updateData.nome = nome};

        await user.update(updateData);

        const userResponse = user.toJSON();
        delete userResponse.senha;

        return res.status(200).json(userResponse);
    } catch (error) {
        console.error(error);
        return res.status(500).json({ mensagem: 'Erro interno do servidor' });
    }
};

export async function atualizarSenha(req, res) {
    try {
        const { senhaAntiga, novaSenha } = req.body;
        const user = await Usuario.findByPk(req.usuario.id);
        if (!user) {
            return res.status(404).json({ mensagem: 'Usuário não encontrado' });
        }
        
        const compararSenha = await bcrypt.compare(senhaAntiga, user.senha);

        if(!compararSenha){
            return res.status(401).json({mensagem: 'Credenciais inválidas!'});
        };

        const senhaHash = await bcrypt.hash(novaSenha, 10);
        await user.update({senha: senhaHash});

        return res.status(204).send();
    } catch (error) {
        console.error(error);
        return res.status(500).json({ mensagem: 'Erro interno do servidor' });
    }
};

export async function desativarConta(req, res) {
    try {
        const user = await Usuario.findByPk(req.usuario.id);
        if (!user) {
            return res.status(404).json({ mensagem: 'Usuário não encontrado' });
        }

        await user.update({ativo: false});
        return res.status(204).send()
    } catch (error) {
        console.error(error);
        return res.status(500).json({ mensagem: 'Erro interno do servidor' });
    }
};