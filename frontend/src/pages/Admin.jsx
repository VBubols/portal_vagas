import PaginaPendente from '../components/PaginaPendente.jsx';

export default function Admin() {
  return (
    <PaginaPendente
      titulo="Administração"
      tarefas={[
        'Botão "Sincronizar vagas" com sincronizarVagas() de api/admin.js e o resumo da resposta',
        'Lista de usuários com desativar e reativar',
        'Lista de vagas com listarVagasAdmin() (filtros por origem, ativa e oculta)',
        'Vagas internas: criar, editar e remover; qualquer vaga: ocultar e reexibir (funções em api/admin.js)',
      ]}
    />
  );
}
