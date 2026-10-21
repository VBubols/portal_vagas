import test from 'node:test';
import assert from 'node:assert/strict';
import { extrairNiveisDoTitulo, separarTitulo } from '../src/services/extracaoVaga.service.js';

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
    ['Desenvolvedor PL/SQL - Empresa X', []],
    ['[Remoto] Full-stack Engineer React.js • UX Design • Node.js (Strider)', []],
  ];
  
  for (const [titulo, esperado] of casosNivel) {
    test(`nível: ${titulo}`, () => {
      assert.deepEqual(extrairNiveisDoTitulo(titulo), esperado);
    });
  }

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