require('dotenv').config();

const createApp = require('./app');
const { connectDB } = require('./config/db');
const { getEnv } = require('./config/env');

const PORT = getEnv('PORT', '4000');
const app = createApp();

async function main() {
  // Garantia mínima de segurança: exige JWT_SECRET para iniciar o servidor.
  // (Mantemos fallback no módulo para não quebrar smoke-test/bundlers.)
  getEnv('JWT_SECRET');
  await connectDB();
  app.listen(PORT, () => {
    // eslint-disable-next-line no-console
    console.log(`API rodando em http://localhost:${PORT}`);
  });
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error('Falha ao iniciar servidor:', err);
  process.exit(1);
});

