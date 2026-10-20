import test from 'node:test';
import assert from 'node:assert/strict';
import { extrairNiveisDoTitulo } from '../src/services/extracaoVaga.service.js';

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