const express = require('express');

const { authenticate } = require('../middleware/auth');
const { requireRole } = require('../middleware/roles');
const {
  createAppointment,
  getAddressByCep,
  listAdmin,
  listForMe,
  getById,
  updateStatus,
} = require('../controllers/appointmentController');

const router = express.Router();

router.post('/', authenticate, createAppointment);

// Consulta de endereço pelo CEP (para preencher automaticamente o formulário)
router.get('/address', getAddressByCep);

// Painel administrativo (secretários)
router.get('/', authenticate, requireRole(['secretary']), listAdmin);

// Agendamentos do paciente
router.get('/me', authenticate, requireRole(['patient']), listForMe);

router.get('/:id', authenticate, getById);
router.patch('/:id/status', authenticate, updateStatus);

module.exports = router;

