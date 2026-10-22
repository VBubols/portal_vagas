import test from 'node:test';
import assert from 'node:assert/strict';
import { vagaInternaSchema, listarVagasAdminQuerySchema } from '../src/schemas/vaga.schema.js';

const id = '550e8400-e29b-41d4-a716-446655440000';
const dados = {
  titulo: 'Desenvolvedor Júnior',
  empresa: 'ACME',
  link: 'https://example.com/candidatura',
  nivel: 'junior',
  modalidade: 'remoto',
  stack: 'frontend',
  skills: [id],
};

test('vaga interna remota aceita os obrigatórios e elimina campos controlados pelo service', () => {
  const resultado = vagaInternaSchema.parse({
    ...dados,
    origem: 'github',
    publicadaEm: '2000-01-01',
    cidadeNormalizada: 'injetada',
    ativa: false,
    oculta: true,
    fonte: 'outra',
    githubIssueId: 1,
  });
  assert.deepEqual(resultado, dados);
});

for (const campo of ['titulo', 'empresa', 'link', 'nivel', 'modalidade', 'stack', 'skills']) {
  test(`vaga interna exige ${campo}`, () => {
    const entrada = { ...dados };
    delete entrada[campo];
    assert.equal(vagaInternaSchema.safeParse(entrada).success, false);
  });
}

test('vaga presencial/híbrida exige UF no Brasil; Exterior dispensa UF e não aceita uma', () => {
  for (const modalidade of ['presencial', 'hibrido']) {
    assert.equal(vagaInternaSchema.safeParse({ ...dados, modalidade }).success, false);
    assert.equal(vagaInternaSchema.safeParse({ ...dados, modalidade, uf: 'SC' }).success, true);
    assert.equal(
      vagaInternaSchema.safeParse({ ...dados, modalidade, cidade: 'Exterior' }).success,
      true,
    );
    assert.equal(
      vagaInternaSchema.safeParse({ ...dados, modalidade, cidade: 'Exterior', uf: 'SC' }).success,
      false,
    );
  }
});

test('skills exigem IDs UUID, ao menos uma, limite de 30 e deduplicação', () => {
  assert.equal(vagaInternaSchema.safeParse({ ...dados, skills: [] }).success, false);
  assert.equal(vagaInternaSchema.safeParse({ ...dados, skills: ['React'] }).success, false);
  assert.equal(
    vagaInternaSchema.safeParse({ ...dados, skills: Array(31).fill(id) }).success,
    false,
  );
  assert.deepEqual(vagaInternaSchema.parse({ ...dados, skills: [id, id] }).skills, [id]);
});

test('URLs de candidatura aceitam somente HTTP(S) e enums/limites são validados', () => {
  for (const link of ['javascript:alert(1)', 'ftp://example.com', 'texto'])
    assert.equal(vagaInternaSchema.safeParse({ ...dados, link }).success, false);
  for (const entrada of [
    { nivel: 'junior,pleno' },
    { modalidade: ['remoto'] },
    { stack: 'outra' },
    { contratacao: 'ilegal' },
    { uf: 'XX' },
    { titulo: 'x'.repeat(256) },
    { descricao: 'x'.repeat(10001) },
  ])
    assert.equal(vagaInternaSchema.safeParse({ ...dados, ...entrada }).success, false);
});

test('listagem administrativa interpreta false corretamente, aplica paginação e rejeita valores inválidos', () => {
  assert.deepEqual(listarVagasAdminQuerySchema.parse({}), { pagina: 1, limite: 20 });
  assert.deepEqual(
    listarVagasAdminQuerySchema.parse({ ativa: 'false', oculta: 'true', pagina: '2' }),
    { ativa: false, oculta: true, pagina: 2, limite: 20 },
  );
  for (const entrada of [
    { ativa: '0' },
    { oculta: 'qualquer' },
    { pagina: '-1' },
    { limite: '51' },
    { origem: 'outra' },
  ])
    assert.equal(listarVagasAdminQuerySchema.safeParse(entrada).success, false);
});
