import test from 'node:test';
import assert from 'node:assert/strict';
import {
  extrairNiveisDoTitulo, separarTitulo, extrairLocal, montarVaga, criarIndiceSkills, extrairSkills,
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

// Passo 4: montar a vaga juntando labels e título

const issue = (titulo, { fonte = 'backend-br/vagas', labels = [], descricao = '' } = {}) => ({
  githubId: 5868130015,
  numero: 12470,
  fonte,
  titulo,
  descricao,
  labels: labels.map((nome) => ({ nome, descricao: '' })),
  url: 'https://github.com/backend-br/vagas/issues/12470',
  criadaEm: '2026-10-15T14:33:24Z',
  atualizadaEm: '2026-10-15T14:34:10Z',
});

// Compara só os campos que importam em cada caso.
const campos = (resultado, ...nomes) => Object.fromEntries(nomes.map((n) => [n, resultado.vaga[n]]));

test('vaga: nível do título ganha das labels', () => {
  const r = montarVaga(issue('[Remoto] Full Stack Developer Pleno na Rotha IA', {
    fonte: 'frontendbr/vagas', labels: ['Júnior', 'Pleno', 'Remoto'],
  }));
  assert.deepEqual(campos(r, 'nivel', 'modalidade', 'stack', 'empresa', 'titulo'), {
    nivel: 'pleno', modalidade: 'remoto', stack: 'fullstack', empresa: 'Rotha IA',
    titulo: 'Full Stack Developer Pleno na Rotha IA',
  });
});

test('vaga: sem nível no título, usa o menor das labels', () => {
  const r = montarVaga(issue('[Remoto] Back-end Developer Python - Shipwell', {
    labels: ['Pleno', 'Sênior', 'Remoto', 'Python'],
  }));
  assert.deepEqual(campos(r, 'nivel', 'modalidade', 'stack', 'empresa'), {
    nivel: 'pleno', modalidade: 'remoto', stack: 'backend', empresa: null,
  });
  assert.deepEqual(r.skillsDasLabels, ['Python']);
});

test('vaga: modalidade do título ganha das labels, cidade vem com UF', () => {
  const r = montarVaga(issue('[Híbrido/Curitiba] Front-end Developer React-USD (Jcal)', {
    fonte: 'frontendbr/vagas', labels: ['Especialista', 'Remoto', 'Sênior', 'Híbrido'],
  }));
  assert.deepEqual(campos(r, 'nivel', 'modalidade', 'cidade', 'uf', 'cidadeNormalizada', 'stack'), {
    nivel: 'senior', modalidade: 'hibrido', cidade: 'Curitiba', uf: 'PR',
    cidadeNormalizada: 'curitiba', stack: 'frontend',
  });
});

test('vaga: Google sem labels, tudo sai do título', () => {
  const r = montarVaga(issue(
    '[Belo Horizonte ou São Paulo, Brasil] Software Engineer, Early Career (For Women in Tech Candidates) na Google',
  ));
  assert.deepEqual(campos(r, 'nivel', 'modalidade', 'cidade', 'uf', 'empresa', 'stack'), {
    nivel: 'junior', modalidade: null, cidade: 'Belo Horizonte', uf: 'MG', empresa: 'Google', stack: 'backend',
  });
});

test('vaga: só no exterior grava cidade Exterior', () => {
  const r = montarVaga(issue('[Cidade do México, México] Senior Software Engineer, Chrome Test Infrastructure na Google'));
  assert.deepEqual(campos(r, 'nivel', 'cidade', 'uf', 'cidadeNormalizada'), {
    nivel: 'senior', cidade: 'Exterior', uf: null, cidadeNormalizada: 'exterior',
  });
});

test('vaga: Brasil e exterior juntos, fica a cidade brasileira', () => {
  const r = montarVaga(issue('[São Paulo, Brasil / Santiago, Chile + 3 cidades] Cloud Data and Analytics Consultant na Google'));
  assert.deepEqual(campos(r, 'cidade', 'uf'), { cidade: 'São Paulo', uf: 'SP' });
});

test('vaga: UF e contratação pelas labels', () => {
  const r = montarVaga(issue('[Híbrido] Developer Full Stack Python AI/LLM - Convolut', {
    fonte: 'frontendbr/vagas', labels: ['Estágio', 'Híbrido', 'PJ', 'São Paulo', 'Sênior'],
  }));
  assert.deepEqual(campos(r, 'modalidade', 'cidade', 'uf', 'contratacao', 'stack'), {
    modalidade: 'hibrido', cidade: null, uf: 'SP', contratacao: 'pj', stack: 'fullstack',
  });
});

test('vaga: label Exterior sem local no título', () => {
  const r = montarVaga(issue('Front-end Developer na Empresa X', {
    fonte: 'frontendbr/vagas', labels: ['Exterior'],
  }));
  assert.deepEqual(campos(r, 'cidade', 'uf', 'empresa'), { cidade: 'Exterior', uf: null, empresa: 'Empresa X' });
});

test('vaga: stack pela categoria da Coodesh quando o título não diz', () => {
  const r = montarVaga(issue('[Belo Horizonte, Brasil] Senior Software Engineer, Kids and Families na Google', {
    fonte: 'frontendbr/vagas',
    descricao: '## Labels\n#### Alocação\nAlocado\n#### Categoria\nFull-Stack',
  }));
  assert.equal(r.vaga.stack, 'fullstack');
});

test('vaga: contratação na ordem padrão e emoji fora da empresa', () => {
  const r = montarVaga(issue('[Híbrido-SP] Fullstack developer Python/React & IA na Evertec 🧡', {
    labels: ['PJ', 'CLT'],
  }));
  assert.deepEqual(campos(r, 'contratacao', 'empresa', 'uf'), { contratacao: 'clt', empresa: 'Evertec', uf: 'SP' });
});

test('vaga: campos fixos da origem GitHub', () => {
  const r = montarVaga(issue('[Remoto] Engenheiro de Software- Micro 1'));
  assert.deepEqual(campos(r, 'origem', 'fonte', 'githubIssueId', 'link', 'ativa', 'publicadaEm'), {
    origem: 'github',
    fonte: 'backend-br/vagas',
    githubIssueId: 5868130015,
    link: 'https://github.com/backend-br/vagas/issues/12470',
    ativa: true,
    publicadaEm: '2026-10-15T14:33:24Z',
  });
  assert.equal('oculta' in r.vaga, false); // a gravação não pode sobrescrever o que o admin decidiu
});

test('vaga: descarta Avisos, Stale e as regras do repositório', () => {
  assert.equal(montarVaga(issue('Atenção: leia nossas regras', { fonte: 'frontendbr/vagas', labels: ['⚠️ Avisos'] })), null);
  assert.equal(montarVaga(issue('[Remoto] Dev Java - Empresa X', { labels: ['Stale'] })), null);
  assert.equal(montarVaga(issue('[PT-BR] - Regras para divulgação de vagas.')), null);
  assert.equal(montarVaga(issue('[EN-US] - Rules for advertising job openings.')), null);
});

test('vaga: título longo é cortado no limite do banco', () => {
  const r = montarVaga(issue(`[Remoto] ${'Engenheiro '.repeat(40)}`));
  assert.equal(r.vaga.titulo.length <= 255, true);
});

// Passo 5: skills pelas labels, pelo título e pela descrição

// Amostra do seed de skills, com o próprio nome como id para facilitar a leitura.
const indice = criarIndiceSkills([
  ['JavaScript', ['js', 'ecmascript']], ['TypeScript', ['ts']], ['Python', ['python3', 'py']],
  ['Java', []], ['C#', ['csharp']], ['C++', ['cpp']], ['C', []], ['Go', ['golang']],
  ['SQL', []], ['MySQL', []], ['PostgreSQL', ['postgres']], ['SQL Server', ['sqlserver']],
  ['React', ['reactjs', 'react.js']], ['React Native', ['reactnative']], ['Next.js', ['next', 'nextjs']],
  ['Node.js', ['node', 'nodejs']], ['Express', ['expressjs', 'express.js']], ['.NET', ['dotnet', 'asp.net']],
  ['REST API', ['rest', 'restful']], ['GitHub', []], ['GitHub Actions', ['actions']], ['Docker', []],
].map(([nome, aliases]) => ({ id: nome, nome, aliases })));

const skillsDe = (entrada) => extrairSkills(entrada, indice).ids.sort();

const casosSkills = [
  ['labels casam pelo nome e pelos aliases', { labels: ['Python', 'Node.js', 'golang'] }, ['Go', 'Node.js', 'Python']],
  ['label curta vale', { labels: ['Go', 'C'] }, ['C', 'Go']],
  ['Java e JavaScript são skills diferentes', { descricao: 'Experiência com Java e JavaScript' }, ['Java', 'JavaScript']],
  ['JavaScript não puxa Java', { descricao: 'Conhecimento em JavaScript' }, ['JavaScript']],
  ['Google não é Go', { descricao: 'Golang e Google Cloud' }, ['Go']],
  ['"go" solto no texto não vale', { descricao: "Let's go! Vaga para quem quer crescer" }, []],
  ['C# e ASP.NET, sem puxar C', { descricao: 'C# e .NET Core, ASP.NET MVC' }, ['.NET', 'C#']],
  ['C/C++ puxa só C++ (C de uma letra só vale por label)', { descricao: 'Experiência com C/C++' }, ['C++']],
  ['React Native não puxa React', { descricao: 'App em React Native e Flutter' }, ['React Native']],
  ['HTML da descrição é ignorado', { descricao: '<li>3 years with <b>React</b> and TypeScript</li>' }, ['React', 'TypeScript']],
  ['links são ignorados', { descricao: 'Candidate-se: https://coodesh.com/jobs/dev-python-123?utm_source=github' }, []],
  ['palavras comuns em inglês não viram skill', { descricao: 'Next steps: express interest, the rest is with us' }, []],
  ['a forma completa vale', { descricao: 'Next.js, Express.js e APIs RESTful' }, ['Express', 'Next.js', 'REST API']],
  ['MySQL e PostgreSQL não puxam SQL', { descricao: 'MySQL e PostgreSQL' }, ['MySQL', 'PostgreSQL']],
  ['SQL Server não puxa SQL', { descricao: 'Banco SQL Server' }, ['SQL Server']],
  ['GitHub Actions não puxa GitHub', { descricao: 'CI com GitHub Actions e Docker' }, ['Docker', 'GitHub Actions']],
  ['título também conta', { titulo: '[Híbrido-SP] Fullstack developer Python/React & IA' }, ['Python', 'React']],
  ['sem repetição entre label e texto', { labels: ['Python'], descricao: 'Python 3 e python3' }, ['Python']],
];

for (const [nome, entrada, esperado] of casosSkills) {
  test(`skills: ${nome}`, () => {
    assert.deepEqual(skillsDe(entrada), esperado);
  });
}

test('skills: label sem skill cadastrada volta em naoEncontradas', () => {
  const { naoEncontradas } = extrairSkills({ labels: ['Python', 'Apache Kafka', 'DDD'] }, indice);
  assert.deepEqual(naoEncontradas, ['Apache Kafka', 'DDD']);
});
