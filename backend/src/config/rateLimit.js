import rateLimit from 'express-rate-limit';

const janela = 15 * 60 * 1000;

export const limitadorGlobal = rateLimit({
    windowMs: janela,
    limit: 100,
    message: { mensagem: 'Muitas requisições, tente novamente em alguns minutos' },
    standardHeaders: true,
    legacyHeaders: false,
});

export const limitadorUsuario = rateLimit({
    windowMs: janela,
    limit: 10,
    message: { mensagem: 'Muitas requisições, tente novamente em alguns minutos' },
    standardHeaders: true,
    legacyHeaders: false,
});

export const limitadorLogin = rateLimit({
    windowMs: janela,
    limit: 3,
    skipSuccessfulRequests: true, // só tentativas que falham contam
    message: { mensagem: 'Muitas tentativas de login, tente novamente em alguns minutos' },
    standardHeaders: true,
    legacyHeaders: false,
});