import test from 'node:test';
import assert from 'node:assert/strict';
import {
  renderizarCurriculoPdf, montarSecoes, formatarMesAno, limpar, slugNomeArquivo,
} from '../src/services/curriculo-pdf.service.js';

const cv = (extra = {}) => ({
  nomeCompleto: 'Maria da Conceição',
  titulo: 'Desenvolvedora Front-end Júnior',
  emailContato: 'maria@exemplo.com',
  telefone: '(48) 99999-0000',
  cidade: 'Palhoça',
  uf: 'SC',
  resumo: 'Desenvolvedora em início de carreira.',
  skills: [{ nome: 'React' }, { nome: 'JavaScript' }],
  experiencias: [],
  formacoes: [],
  cursos: [],
  idiomas: [],
  links: [],
  projetos: [],
  ...extra,
});

test('formatarMesAno converte DATEONLY e Date', () => {
  assert.equal(formatarMesAno('2024-03-15'), '03/2024');
  assert.equal(formatarMesAno(new Date('2023-12-01T00:00:00Z')), '12/2023');
  assert.equal(formatarMesAno(null), '');
});

test('limpar remove emoji mas preserva acentos e pontuação tipográfica', () => {
  assert.equal(limpar('Olá 🚀 mundo – ação “ok”'), 'Olá  mundo – ação “ok”');
});

test('slugNomeArquivo gera nome ASCII seguro', () => {
  assert.equal(slugNomeArquivo('Maria da Conceição'), 'curriculo-maria-da-conceicao.pdf');
  assert.equal(slugNomeArquivo('"><script>'), 'curriculo-script.pdf');
  assert.equal(slugNomeArquivo(''), 'curriculo.pdf');
});

test('seções vazias são omitidas (projetos, cursos, idiomas...)', () => {
  const titulos = montarSecoes(cv()).map((s) => s.titulo);
  assert.deepEqual(titulos, ['Resumo Profissional', 'Habilidades']);
});

test('experiências: atual primeiro, depois da mais recente para a mais antiga', () => {
  const secoes = montarSecoes(cv({
    experiencias: [
      { empresa: 'A', cargo: 'Dev', inicio: '2020-01-01', fim: '2021-01-01', atual: false },
      { empresa: 'B', cargo: 'Dev', inicio: '2022-01-01', fim: '2023-01-01', atual: false },
      { empresa: 'C', cargo: 'Dev', inicio: '2019-01-01', fim: null, atual: true },
    ],
  }));
  const exp = secoes.find((s) => s.titulo === 'Experiência Profissional');
  assert.deepEqual(exp.itens.map((i) => i.titulo), ['Dev | C', 'Dev | B', 'Dev | A']);
  assert.equal(exp.itens[0].detalhe, '01/2019 - Atual');
});

test('formação cursando mostra previsão de conclusão', () => {
  const secoes = montarSecoes(cv({
    formacoes: [{ instituicao: 'UFSC', curso: 'Sistemas de Informação', grau: 'graduacao', situacao: 'cursando', inicio: '2023-02-01', fim: null }],
  }));
  const f = secoes.find((s) => s.titulo === 'Formação Acadêmica').itens[0];
  assert.equal(f.detalhe, 'UFSC | Graduação | Cursando | Início: 02/2023');
});

test('formação cursando com início e fim marca o fim como previsão', () => {
  const secoes = montarSecoes(cv({
    formacoes: [
      { instituicao: 'UFSC', curso: 'SI', grau: 'graduacao', situacao: 'cursando', inicio: '2022-02-01', fim: '2026-12-01' },
      { instituicao: 'IFSC', curso: 'Redes', grau: 'tecnico', situacao: 'concluido', inicio: '2018-02-01', fim: '2020-12-01' },
    ],
  }));
  const [cursando, concluido] = secoes.find((s) => s.titulo === 'Formação Acadêmica').itens;
  assert.equal(cursando.detalhe, 'UFSC | Graduação | Cursando | 02/2022 - 12/2026 (previsão)');
  assert.equal(concluido.detalhe, 'IFSC | Técnico | Concluído | 02/2018 - 12/2020');
});

test('gera um PDF válido', async () => {
  const buffer = await renderizarCurriculoPdf(cv({
    links: [{ tipo: 'github', url: 'https://github.com/maria' }],
    projetos: [{ nome: 'Portal', descricao: 'Projeto', url: null, tecnologias: ['Node.js'] }],
  }));
  assert.ok(Buffer.isBuffer(buffer));
  assert.equal(buffer.subarray(0, 5).toString(), '%PDF-');
  assert.ok(buffer.length > 1000);
});
