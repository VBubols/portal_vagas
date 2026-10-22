import PaginaPendente from '../components/PaginaPendente.jsx';

export default function Curriculo() {
  return (
    <PaginaPendente
      titulo="Meu currículo"
      tarefas={[
        'Carregar com obterCurriculo(): 404 quer dizer que ainda não tem, então o formulário começa vazio',
        'Salvar com criarCurriculo() na primeira vez e atualizarCurriculo() nas seguintes',
        'Skills com Autocomplete do MUI usando buscarSkills() de api/skills.js (envia a lista de ids)',
        'Listas dinâmicas: experiências, formações, cursos, idiomas, links e projetos',
        'Botão "Exportar PDF" com baixarCurriculoPdf()',
      ]}
    />
  );
}
