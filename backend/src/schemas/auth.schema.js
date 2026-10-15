import { z } from 'zod';

export const cadastroSchema = z.object({
    nome: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
    email: z.string().email('E-mail inválido'),
    senha: z.string().min(4, 'Senha deve ter pelo menos 4 caracteres')
});

export const loginSchema = z.object({
    email: z.string().email('E-mail inválido'),
    senha: z.string().min(1, 'Senha é obrigatória')
});

