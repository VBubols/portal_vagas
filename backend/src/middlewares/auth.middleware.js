import jwt from 'jsonwebtoken';

export async function autenticar(req, res, next) {
    try {
        const authHeader = req.headers['authorization'];
        if(!authHeader || !authHeader.startsWith('Bearer ')){
            return res.status(401).json({mensagem: 'Token não fornecido ou em formato inválido!'});
        };

        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.usuario = decoded;
        next();
    } catch (error) {
        return res.status(401).json({ erro: 'Token inválido ou expirado' });
    }
};