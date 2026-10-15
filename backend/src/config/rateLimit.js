import rateLimit from 'express-rate-limit';

export const limitadorGlobal = rateLimit({
    windowMs: 15*60*1000, //Janela de tempo para fazer algo
    max: 100, //Número máximo de req por IP
    message: {
        erro: 'Muitas requisições por minuto!'
    },
    standardHeaders: true, //Envia RateLimit-* nos headers
    legacyHeaders: false //desativa o X-RateLimit-* antigo
});

export const limitadorUsuario = rateLimit({
    windowMs: 15*60*1000,
    max: 10,
    message: {
        erro: 'Muitas requisições por minuto!'
    },
    standardHeaders: true,
    legacyHeaders: false
});

export const limitadorLogin = rateLimit({
    windowMs: 15*60*1000,
    max: 3,
    message: {
        erro: 'Limite de 3 requisições excedido!'
    },
    standardHeaders: true,
    legacyHeaders: false
});