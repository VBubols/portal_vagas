import { Alert, Paper, Stack, Typography } from '@mui/material';

// Ocupa o lugar de uma tela que ainda vai ser feita: mostra o que ela precisa fazer.
export default function PaginaPendente({ titulo, tarefas = [] }) {
  return (
    <Paper variant="outlined" sx={{ p: 4 }}>
      <Stack spacing={2}>
        <Typography variant="h5" component="h1">
          {titulo}
        </Typography>
        <Alert severity="info">Tela ainda não implementada.</Alert>
        <Typography component="ul" sx={{ pl: 2, m: 0 }}>
          {tarefas.map((tarefa) => (
            <li key={tarefa}>{tarefa}</li>
          ))}
        </Typography>
      </Stack>
    </Paper>
  );
}
