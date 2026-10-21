import test from 'node:test';
import assert from 'node:assert/strict';
import { curriculoSchema } from '../src/schemas/curriculo.schema.js';
import { serializarCurriculo } from '../src/utils/serializarCurriculo.js';

const ID_SKILL = '3f2b8c1e-5d4a-4e7b-9a6c-1b2c3d4e5f60';

const valido = (extra = {}) => ({
  nomeCompleto: 'Maria da Conceição',
  titulo: 'Desenvolvedora Front-end Júnior',
  emailContato: 'maria@exemplo.com',
  telefone: '(48) 99999-0000',
  resumo: 'Desenvolvedora em início de carreira.',
  nivel: 'junior',
  modalidades: ['remoto'],
  cidade: 'Palhoça',
  uf: 'SC',
  ...extra,
});

const erros = (entrada) => {
  const r = curriculoSchema.safeParse(entrada);
  assert.equal(r.success, false, 'era para ser rejeitado');
  return r.error.issues.map((i) => ({ campo: i.path.join('.'), mensagem: i.message }));
};
const camposComErro = (entrada) => erros(entrada).map((e) => e.campo);

test('currículo mínimo é aceito e as listas ficam vazias', () => {
  const r = curriculoSchema.parse(valido());
  for (const lista of ['locais', 'experiencias', 'formacoes', 'cursos', 'idiomas', 'links', 'projetos', 'skills']) {
    assert.deepEqual(r[lista], []);
  }
});

test('campos obrigatórios (os not null do model) são cobrados em português', () => {
  const e = erros({});
  const campos = e.map((x) => x.campo);
  for (const c of ['nomeCompleto', 'titulo', 'emailContato', 'telefone', 'resumo', 'nivel', 'modalidades', 'cidade', 'uf']) {
    assert.ok(campos.includes(c), `faltou cobrar ${c}`);
  }
  assert.equal(e.find((x) => x.campo === 'titulo').mensagem, 'Campo obrigatório');
});

test('campos desconhecidos são descartados (id, usuarioId, cidadeNormalizada)', () => {
  const r = curriculoSchema.parse(valido({ id: 'x', usuarioId: 'y', cidadeNormalizada: 'z' }));
  assert.equal('id' in r, false);
  assert.equal('usuarioId' in r, false);
  assert.equal('cidadeNormalizada' in r, false);
});

test('texto é aparado; nome precisa de nome e sobrenome', () => {
  assert.equal(curriculoSchema.parse(valido({ nomeCompleto: '  Maria Silva  ' })).nomeCompleto, 'Maria Silva');
  assert.deepEqual(camposComErro(valido({ nomeCompleto: 'Maria' })), ['nomeCompleto']);
  assert.deepEqual(camposComErro(valido({ resumo: '   ' })), ['resumo']);
});

test('e-mail é normalizado e validado', () => {
  assert.equal(curriculoSchema.parse(valido({ emailContato: ' MARIA@Exemplo.COM ' })).emailContato, 'maria@exemplo.com');
  assert.deepEqual(camposComErro(valido({ emailContato: 'maria@' })), ['emailContato']);
});

test('telefone: aceita fixo e celular, com ou sem +55, e salva formatado', () => {
  const tel = (telefone) => curriculoSchema.parse(valido({ telefone })).telefone;
  assert.equal(tel('48999990000'), '(48) 99999-0000');
  assert.equal(tel('+55 (48) 99999-0000'), '(48) 99999-0000');
  assert.equal(tel('4833334444'), '(48) 3333-4444');
  assert.deepEqual(camposComErro(valido({ telefone: '123' })), ['telefone']);
  assert.deepEqual(camposComErro(valido({ telefone: '(48) 89999-0000' })), ['telefone']);
});

test('nível, modalidade e UF: enums, UF em maiúsculas, modalidades sem repetição', () => {
  assert.equal(curriculoSchema.parse(valido({ uf: ' sc ' })).uf, 'SC');
  assert.deepEqual(curriculoSchema.parse(valido({ modalidades: ['remoto', 'hibrido', 'remoto'] })).modalidades, ['remoto', 'hibrido']);
  assert.deepEqual(camposComErro(valido({ nivel: 'guru' })), ['nivel']);
  assert.deepEqual(camposComErro(valido({ uf: 'XX' })), ['uf']);
  assert.deepEqual(camposComErro(valido({ modalidades: [] })), ['modalidades']);
  assert.deepEqual(camposComErro(valido({ modalidades: ['presencial', 'na-lua'] })), ['modalidades.1']);
});

test('experiência: atual descarta o fim; não atual exige fim; fim não pode ser anterior ao início', () => {
  const exp = (e) => ({ empresa: 'ACME', cargo: 'Dev', inicio: '2023-01-01', ...e });
  const atual = curriculoSchema.parse(valido({ experiencias: [exp({ atual: true, fim: '2020-01-01' })] }));
  assert.equal(atual.experiencias[0].fim, null);

  assert.deepEqual(camposComErro(valido({ experiencias: [exp({})] })), ['experiencias.0.fim']);
  assert.deepEqual(camposComErro(valido({ experiencias: [exp({ fim: '2022-12-31' })] })), ['experiencias.0.fim']);
  assert.equal(curriculoSchema.safeParse(valido({ experiencias: [exp({ fim: '2023-01-01' })] })).success, true);
});

test('campos opcionais aceitam "" e null como "não informado"', () => {
  const r = curriculoSchema.parse(valido({
    experiencias: [{ empresa: 'A', cargo: 'B', inicio: '2023-01-01', atual: true, descricao: '', cidade: null }],
    projetos: [{ nome: 'P', url: '', descricao: null }],
  }));
  assert.equal(r.experiencias[0].descricao, null);
  assert.equal(r.experiencias[0].cidade, null);
  assert.equal(r.projetos[0].url, null);
});

test('datas precisam existir no calendário (AAAA-MM-DD)', () => {
  const form = (inicio) => valido({ formacoes: [{ instituicao: 'U', curso: 'C', grau: 'graduacao', situacao: 'cursando', inicio }] });
  assert.equal(curriculoSchema.safeParse(form('2021-02-01')).success, true);
  assert.deepEqual(camposComErro(form('2021-02-30')), ['formacoes.0.inicio']);
  assert.deepEqual(camposComErro(form('01/02/2021')), ['formacoes.0.inicio']);
});

test('links e projetos só aceitam URL http(s)', () => {
  assert.equal(curriculoSchema.safeParse(valido({ links: [{ tipo: 'github', url: 'https://github.com/maria' }] })).success, true);
  assert.deepEqual(camposComErro(valido({ links: [{ tipo: 'outro', url: 'javascript:alert(1)' }] })), ['links.0.url']);
  assert.deepEqual(camposComErro(valido({ links: [{ tipo: 'outro', url: 'ftp://x.com/a' }] })), ['links.0.url']);
  assert.deepEqual(camposComErro(valido({ links: [{ tipo: 'blog', url: 'https://x.com' }] })), ['links.0.tipo']);
  assert.deepEqual(camposComErro(valido({ projetos: [{ nome: 'P', url: 'data:text/html,x' }] })), ['projetos.0.url']);
});

test('idiomas repetidos (mesmo com acento ou caixa diferentes) são rejeitados', () => {
  const idiomas = [{ idioma: 'Inglês', nivel: 'fluente' }, { idioma: 'ingles', nivel: 'basico' }];
  assert.deepEqual(camposComErro(valido({ idiomas })), ['idiomas']);
});

test('curso: carga horária inteira e positiva', () => {
  const curso = (cargaHoraria) => valido({ cursos: [{ nome: 'React', cargaHoraria }] });
  assert.equal(curriculoSchema.safeParse(curso(40)).success, true);
  assert.deepEqual(camposComErro(curso(0)), ['cursos.0.cargaHoraria']);
  assert.deepEqual(camposComErro(curso(1.5)), ['cursos.0.cargaHoraria']);
});

test('skills: ids precisam ser UUID e repetidos são unificados', () => {
  assert.deepEqual(curriculoSchema.parse(valido({ skills: [ID_SKILL, ID_SKILL] })).skills, [ID_SKILL]);
  assert.deepEqual(camposComErro(valido({ skills: ['react'] })), ['skills.0']);
});

test('listas têm limite de tamanho', () => {
  const muitos = Array.from({ length: 11 }, (_, i) => ({ idioma: `Idioma ${i}`, nivel: 'basico' }));
  assert.deepEqual(camposComErro(valido({ idiomas: muitos })), ['idiomas']);
});

test('serializarCurriculo: esconde campos internos e ordena as listas', () => {
  const cv = serializarCurriculo({
    id: 'c1', usuarioId: 'u1', cidadeNormalizada: 'palhoca', nomeCompleto: 'Maria', titulo: 't',
    emailContato: 'e', telefone: 't', resumo: 'r', nivel: 'junior', modalidades: ['remoto'], cidade: 'Palhoça', uf: 'SC',
    experiencias: [
      { id: 'e1', curriculoId: 'c1', empresa: 'A', cargo: 'x', inicio: '2020-01-01', fim: '2021-01-01', atual: false },
      { id: 'e2', curriculoId: 'c1', empresa: 'B', cargo: 'x', inicio: '2022-01-01', fim: '2023-01-01', atual: false },
      { id: 'e3', curriculoId: 'c1', empresa: 'C', cargo: 'x', inicio: '2019-01-01', fim: null, atual: true },
    ],
    idiomas: [{ id: 'i1', idioma: 'Inglês', nivel: 'fluente' }, { id: 'i2', idioma: 'Espanhol', nivel: 'basico' }],
    links: [{ tipo: 'portfolio', url: 'https://b.com' }, { tipo: 'github', url: 'https://a.com' }],
    skills: [{ id: 's2', nome: 'React' }, { id: 's1', nome: 'Angular' }],
    locais: [], formacoes: [], cursos: [], projetos: [],
  });
  assert.equal(cv.usuarioId, undefined);
  assert.equal(cv.cidadeNormalizada, undefined);
  assert.equal(cv.experiencias[0].id, undefined);
  assert.equal(cv.experiencias[0].curriculoId, undefined);
  assert.deepEqual(cv.experiencias.map((e) => e.empresa), ['C', 'B', 'A']);
  assert.deepEqual(cv.idiomas.map((i) => i.idioma), ['Espanhol', 'Inglês']);
  assert.deepEqual(cv.links.map((l) => l.tipo), ['github', 'portfolio']);
  assert.deepEqual(cv.skills.map((s) => s.nome), ['Angular', 'React']);
});
