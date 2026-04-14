const mongoose = require('mongoose');

const appointmentSchema = new mongoose.Schema(
  {
    patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    secretaryId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    appointmentAt: { type: Date, required: true },
    status: { type: String, required: true, enum: ['scheduled', 'cancelled', 'completed'], default: 'scheduled' },

    // Endereço preenchido automaticamente via CEP
    cep: { type: String, required: true },
    address: {
      logradouro: { type: String, default: '' },
      bairro: { type: String, default: '' },
      localidade: { type: String, default: '' }, // cidade
      uf: { type: String, default: '' },
    },

    // Alerta de chuva (melhor esforço via API externa)
    weather: {
      willRain: { type: Boolean, default: null },
      rainProbabilityMax: { type: Number, default: null }, // 0..1
      checkedAt: { type: Date, default: null },
      provider: { type: String, default: '' },
      note: { type: String, default: '' },
    },
  },
  { timestamps: true }
);

// Índice para acelerar busca por data
appointmentSchema.index({ appointmentAt: 1 });

module.exports = mongoose.model('Appointment', appointmentSchema);

