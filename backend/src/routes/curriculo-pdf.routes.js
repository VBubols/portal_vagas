import express from 'express';
import { exportarPdf } from '../controllers/curriculo-pdf.controller.js';
import { autenticar } from '../middlewares/auth.middleware.js';

// Montado em /curriculo/pdf (ver app.js)
const curriculoPdfRouter = express.Router();

/**
 * @openapi
 * /curriculo/pdf:
 *   get:
 *     tags: [Currículo]
 *     summary: Exporta o currículo do usuário logado em PDF compatível com ATS
 *     description: >
 *       Gera o PDF a partir dos dados do formulário. Layout de coluna única, texto
 *       selecionável, fonte padrão, sem tabelas, imagens ou ícones. Seções vazias
 *       (ex.: projetos) são omitidas.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Arquivo PDF (download)
 *         content:
 *           application/pdf:
 *             schema:
 *               type: string
 *               format: binary
 *       401:
 *         description: Token ausente, inválido ou expirado
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Erro' }
 *       404:
 *         description: O usuário ainda não preencheu o currículo
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Erro' }
 */
curriculoPdfRouter.get('/', autenticar, exportarPdf);

export default curriculoPdfRouter;
