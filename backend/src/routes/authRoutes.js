const express = require('express');
const rateLimit = require('express-rate-limit');

const { register, login, me, searchPatients } = require('../controllers/authController');
const { authenticate } = require('../middleware/auth');
const { requireRole } = require('../middleware/roles');

const router = express.Router();

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 100,
  standardHeaders: true,
  legacyHeaders: false,
});

router.post('/register', limiter, register);
router.post('/login', limiter, login);
router.get('/me', authenticate, me);
router.get('/patients/search', authenticate, requireRole(['secretary']), searchPatients);

module.exports = router;

