const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const morgan = require('morgan');

const authRoutes = require('./routes/authRoutes');
const appointmentRoutes = require('./routes/appointmentRoutes');

function createApp() {
  const app = express();

  app.use(helmet());
  app.use(cors({ origin: true, credentials: false }));
  app.use(express.json({ limit: '1mb' }));
  app.use(morgan('dev'));

  app.get('/api/health', (req, res) => {
    res.json({ ok: true });
  });

  app.use('/api/auth', authRoutes);
  app.use('/api/appointments', appointmentRoutes);

  // 404 handler
  app.use((req, res) => {
    res.status(404).json({ message: 'Rota não encontrada' });
  });

  // Centralized error handler
  // eslint-disable-next-line no-unused-vars
  app.use((err, req, res, next) => {
    const status = err.statusCode || 500;
    const message = err.message || 'Erro interno do servidor';
    // Avoid leaking stack traces in production
    res.status(status).json({ message });
  });

  return app;
}

module.exports = createApp;

