// Limites de tamanho e quantidade do currículo (combinados com o grupo).
// Usados pelo schema de validação e pela documentação Swagger: para mudar, é só editar aqui.
export const LIMITES_CURRICULO = {
  // textos
  nomeCompleto: 100,
  titulo: 80,
  resumo: 600,
  descricaoExperiencia: 500,
  descricaoProjeto: 400,
  nomeProjeto: 80,
  tecnologia: 40,
  textoCurto: 100, // empresa, cargo, instituição, curso, cidade
  idioma: 50,
  url: 200,
  // quantidade de itens por lista
  experiencias: 10,
  formacoes: 6,
  cursos: 15,
  idiomas: 6,
  links: 6,
  locais: 5,
  projetos: 6,
  skills: 30,
  tecnologias: 10,
};
