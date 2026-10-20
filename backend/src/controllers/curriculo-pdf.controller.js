import { gerarPdfDoUsuario } from '../services/curriculo-pdf.service.js';

export async function exportarPdf(req, res) {
  const resultado = await gerarPdfDoUsuario(req.usuario.id);
  if (!resultado) {
    return res.status(404).json({ mensagem: 'Currículo não encontrado. Preencha seu currículo antes de exportar.' });
  }

  res.set({
    'Content-Type': 'application/pdf',
    'Content-Disposition': `attachment; filename="${resultado.nomeArquivo}"`,
    // dados pessoais: nada de cache em proxy ou navegador compartilhado
    'Cache-Control': 'no-store',
  });
  return res.status(200).send(resultado.buffer);
}
