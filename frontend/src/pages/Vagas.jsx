import PaginaPendente from '../components/PaginaPendente.jsx';

export default function Vagas() {
  return (
    <PaginaPendente
      titulo="Vagas"
      tarefas={[
        'Abas "Recomendadas" (listarRecomendadas) e "Todas" (listarVagas) de api/vagas.js',
        'Filtros: busca, nível, modalidade e stack, com opcoes() de constants/rotulo.js',
        'Card: título, empresa, nível, modalidade, local, skills e a % de compatibilidade (null = sem %)',
        'Paginação com a resposta { dados, paginacao }',
        'Recomendadas sem currículo responde 404: mostrar convite para preencher o currículo',
      ]}
    />
  );
}
