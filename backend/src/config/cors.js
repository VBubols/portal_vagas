// Vite (frontend dev) roda em 5173; mantemos 3000 pra ferramentas locais.
const origensPermitidas = [
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:3000',
];

export const corsConfig = {
  origin(origin, callback) {
    // Permite requisições sem origin (Postman, curl) e as origens da lista
    if (!origin || origensPermitidas.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error('Origem não permitida pelo CORS'));
  },
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};
