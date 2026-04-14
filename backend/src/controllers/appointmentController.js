const Appointment = require('../models/Appointment');
const User = require('../models/User');
const { appointmentCreateSchema, appointmentStatusUpdateSchema } = require('../validators/appointmentSchemas');
const { fetchAddressByCep, normalizeCep } = require('../services/cepService');
const { checkRainForecast } = require('../services/weatherService');
const { asyncHandler } = require('../utils/asyncHandler');

function toSafeISOStringDate(d) {
  return d instanceof Date ? d.toISOString() : '';
}

async function createAppointment(req, res) {
  const parsed = appointmentCreateSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: 'Dados inválidos', errors: parsed.error.flatten() });
  }

  const { appointmentAt: appointmentAtRaw, cep, patientId: patientIdMaybe } = parsed.data;

  const appointmentAt = new Date(appointmentAtRaw);
  if (Number.isNaN(appointmentAt.getTime())) {
    return res.status(400).json({ message: 'Data/hora de consulta inválida' });
  }

  // Evita agendamento passado (ajuste se o trabalho aceitar)
  if (appointmentAt.getTime() < Date.now() - 2 * 60 * 1000) {
    return res.status(400).json({ message: 'Não é possível agendar no passado' });
  }

  const cepNormalized = normalizeCep(cep);
  const address = await fetchAddressByCep(cepNormalized);

  const isPatient = req.user.role === 'patient';
  const patientId = isPatient ? req.user.id : patientIdMaybe;
  if (!patientId) {
    return res.status(400).json({ message: 'patientId é obrigatório para secretários' });
  }

  const patient = await User.findById(patientId);
  if (!patient) {
    return res.status(404).json({ message: 'Paciente não encontrado' });
  }

  // Disponibilidade por slot: impede múltiplos agendamentos na mesma data/hora (exceto cancelados)
  const existing = await Appointment.findOne({
    appointmentAt,
    status: { $ne: 'cancelled' },
  });

  if (existing) {
    return res.status(409).json({ message: 'Horário indisponível' });
  }

  const weather = await checkRainForecast({
    appointmentAt,
    city: address.localidade,
    uf: address.uf,
  });

  const appointment = await Appointment.create({
    patientId,
    secretaryId: req.user.id,
    appointmentAt,
    status: 'scheduled',
    cep: address.cep,
    address: {
      logradouro: address.logradouro,
      bairro: address.bairro,
      localidade: address.localidade,
      uf: address.uf,
    },
    weather: {
      willRain: weather.willRain,
      rainProbabilityMax: weather.rainProbabilityMax,
      checkedAt: weather.checkedAt || new Date(),
      provider: weather.provider || 'OpenWeatherMap',
      note: weather.note || '',
    },
  });

  const populated = await Appointment.findById(appointment._id).populate('patientId', 'name email').populate('secretaryId', 'name email');

  return res.status(201).json({ appointment: populated });
}

const getAddressByCep = asyncHandler(async (req, res) => {
  const { cep } = req.query;
  if (!cep) return res.status(400).json({ message: 'Informe o CEP' });

  const address = await fetchAddressByCep(normalizeCep(cep));
  return res.json({ address });
});

const listAdmin = asyncHandler(async (req, res) => {
  const { from, to, status } = req.query;

  const filter = {};
  if (status) filter.status = status;
  if (from) filter.appointmentAt = { ...(filter.appointmentAt || {}), $gte: new Date(from) };
  if (to) filter.appointmentAt = { ...(filter.appointmentAt || {}), $lte: new Date(to) };

  const appointments = await Appointment.find(filter)
    .sort({ appointmentAt: 1 })
    .populate('patientId', 'name email')
    .populate('secretaryId', 'name email');

  return res.json({ appointments });
});

const listForMe = asyncHandler(async (req, res) => {
  const { status } = req.query;
  const filter = { patientId: req.user.id };
  if (status) filter.status = status;

  const appointments = await Appointment.find(filter).sort({ appointmentAt: 1 }).populate('secretaryId', 'name email');
  return res.json({ appointments });
});

const getById = asyncHandler(async (req, res) => {
  const appointment = await Appointment.findById(req.params.id)
    .populate('patientId', 'name email')
    .populate('secretaryId', 'name email');

  if (!appointment) return res.status(404).json({ message: 'Agendamento não encontrado' });

  const isPatient = req.user.role === 'patient';
  if (isPatient && String(appointment.patientId._id) !== String(req.user.id)) {
    return res.status(403).json({ message: 'Acesso negado' });
  }

  return res.json({ appointment });
});

const updateStatus = asyncHandler(async (req, res) => {
  const parsed = appointmentStatusUpdateSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: 'Dados inválidos', errors: parsed.error.flatten() });
  }

  const { status } = parsed.data;

  const appointment = await Appointment.findById(req.params.id);
  if (!appointment) return res.status(404).json({ message: 'Agendamento não encontrado' });

  if (req.user.role === 'patient') {
    if (String(appointment.patientId) !== String(req.user.id)) return res.status(403).json({ message: 'Acesso negado' });
    // Paciente só pode cancelar (se já não foi cancelado/relizado)
    if (status !== 'cancelled') return res.status(403).json({ message: 'Paciente só pode cancelar agendamentos' });
  }

  appointment.status = status;
  await appointment.save();

  const populated = await Appointment.findById(appointment._id).populate('patientId', 'name email').populate('secretaryId', 'name email');
  return res.json({ appointment: populated });
});

module.exports = {
  createAppointment,
  getAddressByCep,
  listAdmin,
  listForMe,
  getById,
  updateStatus,
};

