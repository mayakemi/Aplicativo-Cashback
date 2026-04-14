const bcrypt = require('bcryptjs');
const User = require('../models/User');
const { registerSchema, loginSchema } = require('../validators/authSchemas');
const { signAccessToken } = require('../utils/jwt');
const { getEnv } = require('../config/env');
const { asyncHandler } = require('../utils/asyncHandler');

function sanitizeUser(user) {
  return {
    id: String(user._id),
    name: user.name,
    email: user.email,
    role: user.role,
  };
}

const register = asyncHandler(async (req, res) => {
  const parsed = registerSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: 'Dados inválidos', errors: parsed.error.flatten() });
  }

  const { name, email, password, role: roleInput, secretaryCode } = parsed.data;
  const role = roleInput || 'patient';

  if (role === 'secretary') {
    const invite = getEnv('SECRETARY_INVITE_CODE');
    if (!secretaryCode || secretaryCode !== invite) {
      return res.status(403).json({ message: 'Código de secretário inválido' });
    }
  }

  const existing = await User.findOne({ email });
  if (existing) {
    return res.status(409).json({ message: 'E-mail já cadastrado' });
  }

  const passwordHash = await bcrypt.hash(password, 10);

  const user = await User.create({
    name,
    email,
    passwordHash,
    role,
  });

  const token = signAccessToken(user);
  return res.status(201).json({ token, user: sanitizeUser(user) });
});

const login = asyncHandler(async (req, res) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: 'Dados inválidos', errors: parsed.error.flatten() });
  }

  const { email, password } = parsed.data;
  const user = await User.findOne({ email }).select('+passwordHash');
  if (!user) {
    return res.status(401).json({ message: 'E-mail ou senha inválidos' });
  }

  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) {
    return res.status(401).json({ message: 'E-mail ou senha inválidos' });
  }

  const token = signAccessToken(user);
  return res.json({ token, user: sanitizeUser(user) });
});

const me = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id);
  if (!user) return res.status(404).json({ message: 'Usuário não encontrado' });
  return res.json({ user: sanitizeUser(user) });
});

const searchPatients = asyncHandler(async (req, res) => {
  const { email } = req.query;
  if (!email) return res.status(400).json({ message: 'Informe o e-mail do paciente' });

  const regex = new RegExp(String(email).trim(), 'i');
  const patients = await User.find({ role: 'patient', email: { $regex: regex } })
    .limit(10)
    .select('name email');

  return res.json({ patients: patients.map((p) => ({ id: String(p._id), name: p.name, email: p.email })) });
});

module.exports = { register, login, me, searchPatients };

