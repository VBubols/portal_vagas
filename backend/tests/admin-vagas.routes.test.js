import test, { after } from 'node:test';
import assert from 'node:assert/strict';
import { once } from 'node:events';
import express from 'express';
import jwt from 'jsonwebtoken';

process.env.DB_NAME = 'portal_vagas_teste';
process.env.DB_USER = 'teste';
process.env.JWT_SECRET = 'segredo-exclusivo-dos-testes-admin-vagas';
const { default: adminRouter } = await import('../src/routes/admin.routes.js');
const { default: sequelize } = await import('../src/config/database.js');
const { Usuario, Vaga, Skill } = await import('../src/models/index.js');
const { rotaNaoEncontrada, tratadorDeErros } =
  await import('../src/middlewares/error.middleware.js');
const id = '550e8400-e29b-41d4-a716-446655440000';
const dados = {
  titulo: 'Técnico Júnior',
  empresa: 'ACME',
  link: 'https://example.com',
  nivel: 'junior',
  modalidade: 'remoto',
  stack: 'frontend',
  skills: [id],
};
const app = express();
app.use(express.json());
app.use('/admin', adminRouter);
app.use(rotaNaoEncontrada);
app.use(tratadorDeErros);
const servidor = app.listen(0, '127.0.0.1');
await once(servidor, 'listening');
const url = `http://127.0.0.1:${servidor.address().port}`;
after(() => new Promise((resolve) => servidor.close(resolve)));

function autenticar(t) {
  t.mock.method(Usuario, 'findByPk', async (usuarioId) => ({
    id: usuarioId,
    ativo: usuarioId !== 'inativo',
    role: usuarioId === 'admin' ? 'admin' : 'usuario',
  }));
}
function requisitar(caminho, { method = 'GET', body, usuario = 'admin', token } = {}) {
  return fetch(`${url}/admin${caminho}`, {
    method,
    headers: {
      ...(usuario
        ? {
            Authorization: `Bearer ${token ?? jwt.sign({ id: usuario }, process.env.JWT_SECRET, { expiresIn: '1h' })}`,
          }
        : {}),
      ...(body ? { 'Content-Type': 'application/json' } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
}
const rotas = [
  ['GET', '/vagas'],
  ['POST', '/vagas'],
  ['PUT', `/vagas/${id}`],
  ['DELETE', `/vagas/${id}`],
  ['PATCH', `/vagas/${id}/ocultar`],
  ['PATCH', `/vagas/${id}/reexibir`],
];

test('todas as rotas de gestão exigem token e rejeitam usuário comum', async (t) => {
  autenticar(t);
  t.mock.method(Vaga, 'create', () => assert.fail('não deve acessar vagas sem autorização'));
  for (const [method, caminho] of rotas) {
    assert.equal((await requisitar(caminho, { method, usuario: null })).status, 401);
    assert.equal((await requisitar(caminho, { method, usuario: 'comum' })).status, 403);
  }
});

test('token expirado e conta inativa recebem 401', async (t) => {
  autenticar(t);
  const token = jwt.sign({ id: 'admin' }, process.env.JWT_SECRET, { expiresIn: -1 });
  assert.equal((await requisitar('/vagas', { token })).status, 401);
  assert.equal((await requisitar('/vagas', { usuario: 'inativo' })).status, 401);
});

test('admin recebe 400 com detalhes para body inválido, ID inválido e skills vazias', async (t) => {
  autenticar(t);
  for (const [caminho, method, body] of [
    ['/vagas', 'POST', {}],
    ['/vagas/id-invalido', 'PUT', dados],
    ['/vagas', 'POST', { ...dados, skills: [] }],
  ]) {
    const res = await requisitar(caminho, { method, body });
    assert.equal(res.status, 400);
    assert.ok(Array.isArray((await res.json()).detalhes));
  }
});

test('GET administrativo rejeita query inválida e converte false sem alterar req.query', async (t) => {
  autenticar(t);
  assert.equal((await requisitar('/vagas?limite=1000')).status, 400);
  t.mock.method(Vaga, 'findAndCountAll', async (opcoes) => {
    assert.equal(opcoes.where.oculta, false);
    assert.equal(opcoes.where.ativa, false);
    return { rows: [], count: 0 };
  });
  const res = await requisitar('/vagas?oculta=false&ativa=false');
  assert.equal(res.status, 200);
  assert.deepEqual((await res.json()).dados, []);
});

test('POST usa service real e retorna 201 com objeto vaga, sem envelope match', async (t) => {
  autenticar(t);
  const transaction = { LOCK: { UPDATE: 'UPDATE' } };
  t.mock.method(sequelize, 'transaction', async (fn) => fn(transaction));
  t.mock.method(Skill, 'count', async () => 1);
  t.mock.method(Vaga, 'create', async (campos) => {
    assert.equal(campos.origem, 'interna');
    assert.equal(campos.oculta, undefined);
    return { id, setSkills: async (ids) => assert.deepEqual(ids, [id]) };
  });
  t.mock.method(Vaga, 'findOne', async () => ({
    get: () => ({ id, ...dados, origem: 'interna', skills: [{ id, nome: 'React' }] }),
  }));
  const res = await requisitar('/vagas', {
    method: 'POST',
    body: { ...dados, origem: 'github', oculta: true },
  });
  assert.equal(res.status, 201);
  const resposta = await res.json();
  assert.equal(resposta.origem, 'interna');
  assert.equal(resposta.id, id);
  assert.equal('vaga' in resposta, false);
  assert.equal('match' in resposta, false);
});

test('DELETE retorna 204 sem corpo e ocultação retorna o status correspondente', async (t) => {
  autenticar(t);
  const transaction = { LOCK: { UPDATE: 'UPDATE' } };
  t.mock.method(sequelize, 'transaction', async (fn) => fn(transaction));
  const vaga = {
    id,
    origem: 'interna',
    oculta: false,
    destroy: async () => {},
    update: async (campos) => Object.assign(vaga, campos),
  };
  t.mock.method(Vaga, 'findByPk', async () => vaga);
  const res = await requisitar(`/vagas/${id}`, { method: 'DELETE' });
  assert.equal(res.status, 204);
  assert.equal(await res.text(), '');
  const ocultar = await requisitar(`/vagas/${id}/ocultar`, { method: 'PATCH' });
  assert.deepEqual(await ocultar.json(), { id, oculta: true });
  const reexibir = await requisitar(`/vagas/${id}/reexibir`, { method: 'PATCH' });
  assert.deepEqual(await reexibir.json(), { id, oculta: false });
});
