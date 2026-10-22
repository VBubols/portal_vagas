import 'dotenv/config';
import sequelize from '../config/database.js';
import Skill from '../models/skill.model.js';
// Registra todos os models: o sync() abaixo cria todas as tabelas, não só a de skills.
// É assim que um banco novo (o do Supabase, por exemplo) recebe as tabelas.
import '../models/index.js';
import { normalizarTexto } from '../utils/texto.js';

// [nome canônico, [aliases]]
// O nome canônico é o que o usuário vê; os aliases ajudam a busca (autocomplete) e,
// depois, a sincronização de vagas a casar labels como "NodeJS" com "Node.js".
const SKILLS = [
    // Linguagens
    ['JavaScript', ['js', 'ecmascript']],
    ['TypeScript', ['ts']],
    ['Python', ['python3', 'py']],
    ['Java', []],
    ['C#', ['csharp', 'c sharp']],
    ['C++', ['cpp']],
    ['C', []],
    ['PHP', []],
    ['Go', ['golang']],
    ['Kotlin', []],
    ['Swift', []],
    ['Ruby', []],
    ['SQL', []],
    ['HTML', ['html5']],
    ['CSS', ['css3']],
    // Front-end
    ['React', ['reactjs', 'react.js']],
    ['React Native', ['reactnative']],
    ['Vue.js', ['vue', 'vuejs']],
    ['Angular', ['angularjs']],
    ['Next.js', ['next', 'nextjs']],
    ['Tailwind CSS', ['tailwind']],
    ['Bootstrap', []],
    ['Sass', ['scss']],
    ['Vite', []],
    // Back-end
    ['Node.js', ['node', 'nodejs']],
    ['Express', ['expressjs', 'express.js']],
    ['NestJS', ['nest', 'nest.js']],
    ['Django', []],
    ['Flask', []],
    ['FastAPI', []],
    ['Spring Boot', ['spring']],
    ['.NET', ['dotnet', 'asp.net', 'aspnet']],
    ['Laravel', []],
    ['REST API', ['rest', 'restful', 'api rest']],
    ['GraphQL', []],
    // Bancos de dados
    ['PostgreSQL', ['postgres', 'psql']],
    ['MySQL', []],
    ['MongoDB', ['mongo']],
    ['SQL Server', ['sqlserver', 'mssql']],
    ['Oracle', []],
    ['Redis', []],
    ['SQLite', []],
    ['Sequelize', []],
    ['Prisma', []],
    // DevOps / ferramentas
    ['Git', []],
    ['GitHub', []],
    ['GitHub Actions', ['actions']],
    ['Docker', []],
    ['Kubernetes', ['k8s']],
    ['Linux', []],
    ['AWS', ['amazon web services']],
    ['Azure', []],
    ['CI/CD', ['cicd', 'ci cd']],
    // Qualidade e processo
    ['Jest', []],
    ['Testes automatizados', ['testes unitarios', 'testes unitários']],
    ['Cypress', []],
    ['Scrum', []],
    ['Kanban', []],
    ['Figma', []],
    ['Postman', []],
    ['Metodologias ágeis', ['agile', 'agil', 'ágil']],
    // Dados / outros
    ['Power BI', ['powerbi']],
    ['Excel', []],
    ['Pandas', []],
    ['Machine Learning', ['ml', 'aprendizado de maquina']],
    ['Zod', []],
    ['JWT', ['json web token']],
];

// Idempotente: pode rodar quantas vezes quiser; não duplica nem apaga skills existentes.
// Uso (dentro de backend/): npm run seed:skills
try {
    await sequelize.sync();

    let criadas = 0;
    for (const [nome, aliases] of SKILLS) {
        const [, criada] = await Skill.findOrCreate({
            where: { nomeNormalizado: normalizarTexto(nome) },
            defaults: { nome, aliases },
        });
        if (criada) criadas += 1;
    }

    console.log(`Skills: ${criadas} criadas, ${SKILLS.length - criadas} já existiam.`);
} finally {
    await sequelize.close();
}