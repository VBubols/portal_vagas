import test from 'node:test';
import assert from 'node:assert/strict';
import { listarVagasQuerySchema, vagaIdParamsSchema } from '../src/schemas/vaga.schema.js';
import { normalizarTexto } from '../src/utils/texto.js';
import { escaparLike } from '../src/utils/like.js';

test('query: aplica padrões de paginação', () => {
  const r = listarVagasQuerySchema.parse({});
  assert.equal(r.pagina, 1);
  assert.equal(r.limite, 20);
});

test('query: aceita lista separada por vírgula e parâmetro repetido', () => {
  assert.deepEqual(listarVagasQuerySchema.parse({ nivel: 'Junior, estagio' }).nivel, ['junior', 'estagio']);
  assert.deepEqual(listarVagasQuerySchema.parse({ modalidade: ['remoto', 'hibrido'] }).modalidade, ['remoto', 'hibrido']);
});

test('query: rejeita valores fora do enum, limite alto e página inválida', () => {
  assert.equal(listarVagasQuerySchema.safeParse({ nivel: 'guru' }).success, false);
  assert.equal(listarVagasQuerySchema.safeParse({ limite: '500' }).success, false);
  assert.equal(listarVagasQuerySchema.safeParse({ pagina: '0' }).success, false);
  assert.equal(listarVagasQuerySchema.safeParse({ pagina: 'abc' }).success, false);
});

test('query: texto vazio vira ausente e texto longo é rejeitado', () => {
  assert.equal(listarVagasQuerySchema.parse({ q: '   ' }).q, undefined);
  assert.equal(listarVagasQuerySchema.safeParse({ q: 'x'.repeat(101) }).success, false);
});

test('params: id precisa ser UUID', () => {
  assert.equal(vagaIdParamsSchema.safeParse({ id: 'abc' }).success, false);
  assert.equal(vagaIdParamsSchema.safeParse({ id: '3f2b8c1e-5d4a-4e7b-9a6c-1b2c3d4e5f60' }).success, true);
});

test('normalizarTexto remove acento, caixa e espaços extras', () => {
  assert.equal(normalizarTexto('  São   José dos Pinhais '), 'sao jose dos pinhais');
  assert.equal(normalizarTexto(''), '');
  assert.equal(normalizarTexto(null), '');
});

test('escaparLike protege os curingas do LIKE', () => {
  assert.equal(escaparLike('100%_a\\b'), '100\\%\\_a\\\\b');
});
