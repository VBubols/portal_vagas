import Usuario from '../models/usuario.model.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken'; 

export async function cadastrar(req, res) {
    try {
        const { nome, email, senha } = req.body;

        const existing = await Usuario.findOne({ where: { email } }); 
        if(existing){
            return res.status(409).json({mensagem: 'E-mail já cadastrado!'});
        };

        const senhaHash = await bcrypt.hash(senha, 10);
        const usuario = await Usuario.create({ nome, email, senha: senhaHash });
        
        const usuarioResponse = usuario.toJSON();
        delete usuarioResponse.ativo;
        delete usuarioResponse.senha;
        
        return res.status(201).json(usuarioResponse);
    } catch (error) {
        return res.status(500).json(error);
    }
};

export async function login (req, res) {
    try {
        const { email, senha } = req.body;

        const usuario = await Usuario.findOne({ where: { email } });
        if(!usuario){
            return res.status(401).json({mensagem: 'Credenciais inválidas!'});
        };

        if(!usuario.ativo){
            return res.status(403).json({mensagem: 'Esta conta foi desativada!'});
        };

        const compararSenha = await bcrypt.compare(senha, usuario.senha);
    
        if(!compararSenha){
            return res.status(401).json({mensagem: 'Credenciais inválidas!'});
        };
        const usuarioResponse = usuario.toJSON();
        delete usuarioResponse.ativo;
        delete usuarioResponse.senha;

        const token = jwt.sign(
            usuarioResponse,
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRES_IN }
        );

        res.status(200).json({token, usuarioResponse});

    } catch (error) {
        return res.status(500).json(error);
    }
};