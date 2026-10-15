import { z } from 'zod';

export const atualizarPerfilSchema = z.object({
    nome: z.string().min(2).optional(),
    email: z.string().email('E-mail inválido').optional()
}).refine(data => data.nome || data.email, {
    message: 'Informe ao menos nome ou email para atualizar'
});

export const autalizarSenhaSchema = z.object({
    senhaAntiga: z.string().min(1, 'Senha antiga é obrigatória'),
    novaSenha: z.string().min(6, 'Nova senha deve ter pelo menos 6 caracteres')
});