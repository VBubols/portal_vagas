import test from 'node:test';
import assert from 'node:assert/strict';
import {
  extrairNiveisDoTitulo, separarTitulo, extrairLocal,
} from '../src/services/extracaoVaga.service.js';

// Passo 1: nível pelo título

const casosNivel = [
  ['[REMOTO] Back-end Developer JR - PORT LOUIS', ['junior']],
  ['[Remoto] Full Stack Developer Júnior - Rotha IA', ['junior']],
  ['[REMOTO] Dev java junior - DB1', ['junior']],
  ['[Remoto] Back-end developer Node.js Pleno/Sênior - Cogfy', ['pleno', 'senior']],
  ['[Remoto] Developer ASP.NET/C# Junior/Pleno - Dimensa', ['junior', 'pleno']],
  ['[Cidade do México, México] Senior Software Engineer, Chrome Test Infrastructure na Google', ['senior']],
  ['[Belo Horizonte ou São Paulo, Brasil] Software Engineer, Early Career (For Women in Tech Candidates) na Google', ['junior']],
  ['[São Paulo ou Belo Horizonte, Brasil] Tech Lead, Software Engineering, People with Disabilities na Google', ['especialista']],
  ['[Belo Horizonte ou São Paulo, Brasil] Software Engineering Manager (For Women in Tech Candidates) na Google', ['especialista']],
  ['[Remoto] Lead Database & Data Platform Engineer (Strider)', ['especialista']],
  ['Estágio em Desenvolvimento Web - Empresa X', ['estagio']],
  ['Estagiário(a) de Back-end - Empresa X', ['estagio']],
  ['Estagiária de Front-end - Empresa X', ['estagio']],
  ['Vaga internacional - Empresa X', []],
  ['Desenvolvedor PL/SQL - Empresa X', []],
  ['[Remoto] Full-stack Engineer React.js • UX Design • Node.js (Strider)', []],
];

for (const [titulo, esperado] of casosNivel) {
  test(`nível: ${titulo}`, () => {
    assert.deepEqual(extrairNiveisDoTitulo(titulo), esperado);
  });
}

// Passo 2: separar o trecho de local do resto do título

const casosSeparar = [
  ['[REMOTO] Back-end Developer JR - PORT LOUIS',
    { local: 'REMOTO', cargo: 'Back-end Developer JR - PORT LOUIS' }],
  ['[Híbrido / São Paulo, Brasil] Engenheiro de Software Backend Sênior (Híbrido, São Paulo) na Coodesh',
    { local: 'Híbrido / São Paulo, Brasil', cargo: 'Engenheiro de Software Backend Sênior (Híbrido, São Paulo) na Coodesh' }],
  ['(Full-remote) Senior Embedded Engineer - Jobsity',
    { local: 'Full-remote', cargo: 'Senior Embedded Engineer - Jobsity' }],
  ['[Remoto ]  Full-stack Engineer (HealthTech, EHR/EMR, Terraform, React) USD - Strider',
    { local: 'Remoto', cargo: 'Full-stack Engineer (HealthTech, EHR/EMR, Terraform, React) USD - Strider' }],
  ['[EN-US] - Rules for advertising job openings.',
    { local: 'EN-US', cargo: 'Rules for advertising job openings.' }],
  ['Desenvolvedor / Engenheiro de IA (AI Stack) - Programa AI Stack - Rio de Janeiro - RJ',
    { local: null, cargo: 'Desenvolvedor / Engenheiro de IA (AI Stack) - Programa AI Stack - Rio de Janeiro - RJ' }],
  ['[Remoto ou Híbrido - São Paulo/SP] Full Stack Developer - Cogfy',
    { local: 'Remoto ou Híbrido - São Paulo/SP', cargo: 'Full Stack Developer - Cogfy' }],
  ['[São Paulo, Brasil / Santiago, Chile + 3 cidades] Cloud Data and Analytics Consultant na Google',
    { local: 'São Paulo, Brasil / Santiago, Chile + 3 cidades', cargo: 'Cloud Data and Analytics Consultant na Google' }],
  ['[] Vaga com colchete vazio', { local: null, cargo: 'Vaga com colchete vazio' }],
  ['', { local: null, cargo: '' }],
];

for (const [titulo, esperado] of casosSeparar) {
  test(`separar: ${titulo || '(vazio)'}`, () => {
    assert.deepEqual(separarTitulo(titulo), esperado);
  });
}

// Passo 3: modalidade, cidade, UF e exterior a partir do trecho de local

const local = (modalidades = [], cidades = [], ufs = [], internacional = false) => ({
  modalidades, cidades, ufs, internacional,
});

const casosLocal = [
  ['REMOTO', local(['remoto'])],
  ['Remota', local(['remoto'])],
  ['Full-remote', local(['remoto'])],
  ['Home Office - Tempo Determinado/5 meses', local(['remoto'])],
  ['Híbrido / São Paulo, Brasil', local(['hibrido'], ['São Paulo'], ['SP'])],
  ['Remoto ou Híbrido - São Paulo/SP', local(['remoto', 'hibrido'], ['São Paulo'], ['SP'])],
  ['São Paulo ou Remoto, Brasil', local(['remoto'], ['São Paulo'], ['SP'])],
  ['Híbrido em SP', local(['hibrido'], [], ['SP'])],
  ['Híbrido-SP', local(['hibrido'], [], ['SP'])],
  ['Híbrido/Curitiba', local(['hibrido'], ['Curitiba'], ['PR'])],
  ['Remoto! Curitiba', local(['remoto'], ['Curitiba'], ['PR'])],
  ['Belo Horizonte ou São Paulo, Brasil', local([], ['Belo Horizonte', 'São Paulo'], ['MG', 'SP'])],
  ['Presencial - Santa Catarina', local(['presencial'], [], ['SC'])],
  ['Florianópolis/SC', local([], ['Florianópolis'], ['SC'])],
  ['Buenos Aires, Argentina / Cidade do México, México', local([], [], [], true)],
  ['São Paulo, Brasil / Santiago, Chile + 3 cidades', local([], ['São Paulo'], ['SP'], true)],
  ['Remoto - somente EUA/Canadá', local(['remoto'], [], [], true)],
  ['EN-US', local()],
  ['PT-BR', local()],
  [null, local()],
];

for (const [trecho, esperado] of casosLocal) {
  test(`local: ${trecho ?? '(sem trecho)'}`, () => {
    assert.deepEqual(extrairLocal(trecho), esperado);
  });
}