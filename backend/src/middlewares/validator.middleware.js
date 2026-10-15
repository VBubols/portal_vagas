export function validar(schema) {
    return (req, res, next) => {
        try {
            const resultado = schema.safeParse(req.body);

            if(!resultado.success) {
                return res.status(400).json({ error: resultado.error.issues });
            }

            req.body = resultado.data;
            next();
        } catch (error) {
            return res.status(400).json({ erro: 'Validação falhou' });
        }
    }
}