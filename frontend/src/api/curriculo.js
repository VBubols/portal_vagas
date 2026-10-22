import { http } from './client.js';

// 404 se o usuário ainda não tem currículo.
export const obterCurriculo = () => http.get('/curriculo');
export const criarCurriculo = (dados) => http.post('/curriculo', dados);
export const atualizarCurriculo = (dados) => http.put('/curriculo', dados);

// Baixa o PDF compatível com ATS como arquivo.
export async function baixarCurriculoPdf(nomeArquivo = 'curriculo.pdf') {
  const blob = await http.baixar('/curriculo/pdf');
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = nomeArquivo;
  link.click();
  URL.revokeObjectURL(url);
}
