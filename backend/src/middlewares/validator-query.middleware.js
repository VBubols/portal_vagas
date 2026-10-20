// Validação de query string e de parâmetros de rota com Zod.
// No Express 5 `req.query` é somente leitura, então o resultado validado fica
// em `req.validado` (e não sobrescreve o original).
function validarEm(origem, schema) {
  return (req, res, next) => {
    const resultado = schema.safeParse(req[origem]);

    if (!resultado.success) {
      return res.status(400).json({
        mensagem: 'Parâmetros inválidos',
        erros: resultado.error.issues.map((i) => ({
          campo: i.path.join('.'),
          mensagem: i.message,
        })),
      });
    }

    req.validado = { ...req.validado, [origem]: resultado.data };
    next();
  };
}

export const validarQuery = (schema) => validarEm('query', schema);
export const validarParams = (schema) => validarEm('params', schema);
