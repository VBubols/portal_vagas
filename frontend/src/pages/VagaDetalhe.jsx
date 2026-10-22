import PaginaPendente from '../components/PaginaPendente.jsx';

export default function VagaDetalhe() {
  return (
    <PaginaPendente
      titulo="Detalhe da vaga"
      tarefas={[
        'Carregar com obterVaga(id) de api/vagas.js: { vaga, match }',
        'Mostrar a % e as skills que o usuário tem e as que faltam (match.skillsQueTem e skillsQueFaltam)',
        'Descrição vem em markdown com HTML: renderizar com react-markdown e sanitizar',
        'Botão "Ver vaga" abre vaga.link em nova aba',
      ]}
    />
  );
}
