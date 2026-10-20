import test from 'node:test';
import assert from 'node:assert/strict';
import {
  avaliarCriterios, calcularCompatibilidade, montarMatch, ordenarPorCompatibilidade,
} from '../src/services/match.service.js';

const skill = (nome) => ({ id: `id-${nome}`, nome });
const JS = skill('JavaScript');
const REACT = skill('React');
const NODE = skill('Node.js');
const SQL = skill('SQL');

const curriculo = (extra = {}) => ({
  nivel: 'junior',
  modalidades: ['remoto', 'hibrido'],
  cidade: 'Florianópolis',
  uf: 'SC',
  cidadeNormalizada: 'florianopolis',
  locais: [],
  skills: [JS, REACT],
  ...extra,
});

test('nível: igual passa, diferente elimina, ausente não elimina', () => {
  assert.equal(avaliarCriterios(curriculo(), { nivel: 'junior' }).criterios.nivel, true);
  assert.equal(avaliarCriterios(curriculo(), { nivel: 'pleno' }).criterios.nivel, false);
  assert.equal(avaliarCriterios(curriculo(), { nivel: null }).criterios.nivel, null);
  assert.equal(avaliarCriterios(curriculo(), { nivel: 'pleno' }).elegivel, false);
  assert.equal(avaliarCriterios(curriculo(), { nivel: null }).elegivel, true);
});

test('modalidade: precisa estar entre as aceitas pelo CV', () => {
  assert.equal(avaliarCriterios(curriculo(), { modalidade: 'hibrido' }).criterios.modalidade, true);
  assert.equal(avaliarCriterios(curriculo(), { modalidade: 'presencial' }).criterios.modalidade, false);
  assert.equal(avaliarCriterios(curriculo(), { modalidade: null }).criterios.modalidade, null);
  // CV sem preferência aceita qualquer modalidade
  assert.equal(avaliarCriterios(curriculo({ modalidades: [] }), { modalidade: 'presencial' }).criterios.modalidade, true);
});

test('localização: vaga remota serve para qualquer lugar', () => {
  const cv = curriculo({ cidadeNormalizada: 'palhoca', uf: 'SC' });
  assert.equal(avaliarCriterios(cv, { modalidade: 'remoto', cidade: 'Manaus', uf: 'AM' }).criterios.localizacao, true);
});

test('localização: cidade da vaga precisa bater com a do CV, ignorando acento e caixa', () => {
  const r = avaliarCriterios(curriculo(), { modalidade: 'presencial', cidade: 'FLORIANÓPOLIS', uf: 'SC' });
  assert.equal(r.criterios.localizacao, true);
});

test('localização: mesma cidade em UF diferente não é compatível', () => {
  const r = avaliarCriterios(curriculo(), { modalidade: 'presencial', cidade: 'Florianópolis', uf: 'SP' });
  assert.equal(r.criterios.localizacao, false);
});

test('localização: aceita locais extras do CV (CURRICULO_LOCAL)', () => {
  const cv = curriculo({ locais: [{ cidade: 'Curitiba', uf: 'PR', cidadeNormalizada: 'curitiba' }] });
  assert.equal(avaliarCriterios(cv, { modalidade: 'hibrido', cidade: 'Curitiba', uf: 'PR' }).criterios.localizacao, true);
  assert.equal(avaliarCriterios(cv, { modalidade: 'hibrido', cidade: 'Recife', uf: 'PE' }).criterios.localizacao, false);
});

test('localização: vaga que só informa o estado compara pela UF', () => {
  assert.equal(avaliarCriterios(curriculo(), { modalidade: 'presencial', uf: 'SC' }).criterios.localizacao, true);
  assert.equal(avaliarCriterios(curriculo(), { modalidade: 'presencial', uf: 'RS' }).criterios.localizacao, false);
});

test('localização: vaga sem local informado não elimina', () => {
  const r = avaliarCriterios(curriculo(), { modalidade: 'hibrido' });
  assert.equal(r.criterios.localizacao, null);
  assert.equal(r.elegivel, true);
});

test('compatibilidade: skills da vaga que o usuário tem ÷ total × 100, arredondado', () => {
  assert.equal(calcularCompatibilidade([JS, REACT], [JS, REACT, NODE, SQL]).compatibilidade, 50);
  assert.equal(calcularCompatibilidade([JS], [JS, REACT, NODE]).compatibilidade, 33);
  assert.equal(calcularCompatibilidade([JS, REACT], [JS, REACT, NODE]).compatibilidade, 67);
  assert.equal(calcularCompatibilidade([JS, REACT], [JS, REACT]).compatibilidade, 100);
  assert.equal(calcularCompatibilidade([], [JS]).compatibilidade, 0);
});

test('compatibilidade: skills extras do usuário não aumentam nem diminuem o %', () => {
  assert.equal(calcularCompatibilidade([JS, REACT, NODE, SQL], [JS]).compatibilidade, 100);
});

test('compatibilidade: vaga sem skills não tem %', () => {
  assert.equal(calcularCompatibilidade([JS], []).compatibilidade, null);
});

test('skills que tem e que faltam, em ordem alfabética', () => {
  const r = calcularCompatibilidade([REACT, JS], [SQL, REACT, NODE, JS]);
  assert.deepEqual(r.skillsQueTem.map((s) => s.nome), ['JavaScript', 'React']);
  assert.deepEqual(r.skillsQueFaltam.map((s) => s.nome), ['Node.js', 'SQL']);
});

test('montarMatch junta critérios e skills', () => {
  const m = montarMatch(curriculo(), { nivel: 'junior', modalidade: 'remoto', skills: [JS, NODE] });
  assert.equal(m.elegivel, true);
  assert.equal(m.compatibilidade, 50);
  assert.deepEqual(m.skillsQueFaltam, [NODE]);
});

test('ordenação: maior % primeiro, sem % no fim, empate pela mais recente', () => {
  const ordenadas = ordenarPorCompatibilidade([
    { id: 'a', compatibilidade: 50, publicadaEm: '2026-01-01' },
    { id: 'b', compatibilidade: null, publicadaEm: '2026-09-01' },
    { id: 'c', compatibilidade: 100, publicadaEm: '2026-01-01' },
    { id: 'd', compatibilidade: 50, publicadaEm: '2026-05-01' },
    { id: 'e', compatibilidade: 0, publicadaEm: '2026-05-01' },
  ]);
  assert.deepEqual(ordenadas.map((v) => v.id), ['c', 'd', 'a', 'e', 'b']);
});
