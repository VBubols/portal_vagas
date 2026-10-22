import { Link as RouterLink } from 'react-router-dom';
import { Box, Link } from '@mui/material';
import PaginaPendente from '../components/PaginaPendente.jsx';

export default function Cadastro() {
  return (
    <Box sx={{ maxWidth: 720, mx: 'auto', p: 4 }}>
      <PaginaPendente
        titulo="Cadastro"
        tarefas={[
          'Formulário com nome, sobrenome, e-mail, senha, CPF, celular, telefone fixo (opcional), data de nascimento e país',
          'Enviar com cadastrar() de api/auth.js e mostrar os erros por campo com errosPorCampo() de api/client.js',
          'Depois de cadastrar, fazer login com entrar() do useAuth e ir para /curriculo',
        ]}
      />
      <Link component={RouterLink} to="/login" sx={{ display: 'block', mt: 2 }}>
        Voltar para o login
      </Link>
    </Box>
  );
}
