import test from 'node:test';
import assert from 'node:assert/strict';

// Apenas inicialização do Sequelize; os acessos abaixo são dublês e não abrem conexão.
process.env.DB_NAME = 'portal_vagas_teste';
process.env.DB_USER = 'teste';
const { default: sequelize } = await import('../src/config/database.js');
const { Vaga, Skill } = await import('../src/models/index.js');
const service = await import('../src/services/admin-vagas.service.js');
const { obterVaga } = await import('../src/services/vaga.service.js');
const { montarMatch } = await import('../src/services/match.service.js');
const id = '550e8400-e29b-41d4-a716-446655440000';
const react = '550e8400-e29b-41d4-a716-446655440001';
const node = '550e8400-e29b-41d4-a716-446655440002';
const entrada = {
  titulo: 'Desenvolvedor Júnior',
  empresa: 'ACME',
  link: 'https://example.com',
  nivel: 'junior',
  modalidade: 'remoto',
  stack: 'frontend',
  cidade: 'Palhoça',
  skills: [react, node],
};

function bancoFalso(t, inicial = {}) {
  const transaction = { LOCK: { UPDATE: 'UPDATE' } };
  const registro = {
    id,
    origem: 'interna',
    ativa: true,
    oculta: false,
    publicadaEm: new Date('2025-01-01'),
    ...inicial,
  };
  const chamadas = {
    atualizacoes: [],
    leituras: [],
    criou: false,
    removeu: false,
    associacoes: null,
    transaction,
  };
  const instancia = {
    get id() {
      return registro.id;
    },
    get origem() {
      return registro.origem;
    },
    get oculta() {
      return registro.oculta;
    },
    async update(dados, opcoes) {
      assert.equal(opcoes.transaction, transaction);
      chamadas.atualizacoes.push(dados);
      Object.assign(registro, dados);
      return this;
    },
    async setSkills(ids, opcoes) {
      assert.equal(opcoes.transaction, transaction);
      chamadas.associacoes = ids;
      registro.skills = ids.map((s) => ({ id: s, nome: s === react ? 'React' : 'Node.js' }));
    },
    async destroy(opcoes) {
      assert.equal(opcoes.transaction, transaction);
      chamadas.removeu = true;
    },
  };
  t.mock.method(sequelize, 'transaction', async (fn) => fn(transaction));
  t.mock.method(Skill, 'count', async (opcoes) => {
    assert.equal(opcoes.transaction, transaction);
    return opcoes.where.id.length;
  });
  t.mock.method(Vaga, 'findByPk', async (_id, opcoes) => {
    assert.equal(opcoes.transaction, transaction);
    assert.equal(opcoes.lock, transaction.LOCK.UPDATE);
    return instancia;
  });
  t.mock.method(Vaga, 'create', async (dados, opcoes) => {
    assert.equal(opcoes.transaction, transaction);
    Object.assign(registro, dados);
    chamadas.criou = true;
    return instancia;
  });
  t.mock.method(Vaga, 'findOne', async (opcoes) => {
    chamadas.leituras.push(opcoes);
    if (opcoes.where.ativa === true && !registro.ativa) return null;
    if (opcoes.where.oculta === false && registro.oculta) return null;
    const { cidadeNormalizada, ativa, oculta, githubIssueId, ...visiveis } = registro;
    void ativa;
    void oculta;
    void githubIssueId;
    return { get: () => ({ ...visiveis, cidadeNormalizada }) };
  });
  return { registro, chamadas };
}

test('criação define campos internos no service, normaliza cidade e usa o formato existente', async (t) => {
  const { registro, chamadas } = bancoFalso(t);
  const vaga = await service.criarVagaInterna({
    ...entrada,
    origem: 'github',
    fonte: 'injetada',
    githubIssueId: 10,
    publicadaEm: '2000-01-01',
    oculta: true,
    ativa: false,
  });
  assert.equal(registro.origem, 'interna');
  assert.equal(registro.fonte, null);
  assert.equal(registro.githubIssueId, null);
  assert.ok(registro.publicadaEm instanceof Date);
  assert.equal(registro.cidadeNormalizada, 'palhoca');
  assert.equal(registro.ativa, true);
  assert.equal(registro.oculta, false);
  assert.deepEqual(chamadas.associacoes, [react, node]);
  assert.equal(vaga.id, id);
  assert.equal('cidadeNormalizada' in vaga, false);
  assert.equal('match' in vaga, false);
  assert.equal(chamadas.leituras[0].transaction, chamadas.transaction);
});

test('skill inexistente interrompe criação antes de gravar', async (t) => {
  const { chamadas } = bancoFalso(t);
  Skill.count.mock.mockImplementation(async () => 1);
  await assert.rejects(
    service.criarVagaInterna(entrada),
    (e) => e.status === 400 && e.detalhes[0].campo === 'skills',
  );
  assert.equal(chamadas.criou, false);
});

test('PUT apaga opcionais ausentes, substitui skills e preserva publicação e visibilidade', async (t) => {
  const { registro } = bancoFalso(t, {
    oculta: true,
    descricao: 'Antiga',
    contratacao: 'clt',
    cidade: 'Palhoça',
    uf: 'SC',
    cidadeNormalizada: 'palhoca',
  });
  const data = registro.publicadaEm;
  const { cidade, ...dados } = entrada;
  void cidade;
  const resposta = await service.editarVagaInterna(id, { ...dados, skills: [react] });
  for (const campo of ['descricao', 'contratacao', 'cidade', 'uf', 'cidadeNormalizada'])
    assert.equal(registro[campo], null);
  assert.equal(registro.publicadaEm, data);
  assert.equal(registro.oculta, true);
  assert.equal(resposta.id, id);
  assert.deepEqual(resposta.skills, [{ id: react, nome: 'React' }]);
  assert.equal(await obterVaga({ id, curriculo: null }), null);
});

for (const acao of ['editar', 'remover']) {
  test(`${acao} vaga do GitHub responde 400 sem gravar`, async (t) => {
    const { chamadas } = bancoFalso(t, { origem: 'github' });
    await assert.rejects(
      acao === 'editar' ? service.editarVagaInterna(id, entrada) : service.removerVagaInterna(id),
      (e) => e.status === 400,
    );
    assert.equal(chamadas.atualizacoes.length, 0);
    assert.equal(chamadas.removeu, false);
  });
}

test('remover vaga interna executa exclusão na transação', async (t) => {
  const { chamadas } = bancoFalso(t);
  await service.removerVagaInterna(id);
  assert.equal(chamadas.removeu, true);
});

test('ocultar/reexibir aceita ambas as origens, é idempotente e não reativa vaga', async (t) => {
  const { registro } = bancoFalso(t, { origem: 'github', ativa: false });
  assert.deepEqual(await service.alterarOcultacao(id, true), { id, oculta: true });
  assert.deepEqual(await service.alterarOcultacao(id, true), { id, oculta: true });
  assert.deepEqual(await service.alterarOcultacao(id, false), { id, oculta: false });
  assert.equal(registro.ativa, false);
});

test('operações em ID inexistente retornam 404', async (t) => {
  bancoFalso(t);
  Vaga.findByPk.mock.mockImplementation(async () => null);
  for (const fn of [
    () => service.editarVagaInterna(id, entrada),
    () => service.removerVagaInterna(id),
    () => service.alterarOcultacao(id, true),
  ])
    await assert.rejects(fn(), (e) => e.status === 404);
});

test('detalhe público mantém filtro de ativas e não ocultas por padrão', async (t) => {
  const { chamadas } = bancoFalso(t);
  await obterVaga({ id, curriculo: null });
  assert.deepEqual(chamadas.leituras[0].where, { id, ativa: true, oculta: false });
});

test('listagem administrativa inclui flags false e paginação, com contagem distinta', async (t) => {
  t.mock.method(Vaga, 'findAndCountAll', async (opcoes) => {
    assert.deepEqual(opcoes.where, { ativa: false, oculta: false, origem: 'interna' });
    assert.equal(opcoes.distinct, true);
    assert.equal(opcoes.offset, 20);
    return { rows: [{ get: () => ({ id, ativa: false, oculta: false }) }], count: 21 };
  });
  const resposta = await service.listarVagasAdmin({
    ativa: false,
    oculta: false,
    origem: 'interna',
    pagina: 2,
    limite: 20,
  });
  assert.equal(resposta.paginacao.totalPaginas, 2);
  assert.equal(resposta.dados[0].ativa, false);
});

test('match existente calcula 50% para vaga interna React + Node e currículo com React', async (t) => {
  const { registro } = bancoFalso(t);
  await service.criarVagaInterna(entrada);
  const match = montarMatch(
    {
      nivel: 'junior',
      modalidades: ['remoto'],
      cidade: 'Palhoça',
      uf: 'SC',
      skills: [{ id: react, nome: 'React' }],
    },
    registro,
  );
  assert.equal(match.compatibilidade, 50);
});
