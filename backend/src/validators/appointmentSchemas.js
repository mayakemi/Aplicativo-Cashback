const { z } = require('zod');

const objectIdSchema = z
  .string()
  .regex(/^[a-fA-F0-9]{24}$/, 'Id inválido')
  .transform((s) => s);

const appointmentCreateSchema = z.object({
  appointmentAt: z.string().min(1, 'Informe a data/hora'),
  cep: z.string().min(8).max(10),
  patientId: objectIdSchema.optional(), // permitido apenas para secretário
});

const appointmentStatusUpdateSchema = z.object({
  status: z.enum(['scheduled', 'cancelled', 'completed']),
});

module.exports = { appointmentCreateSchema, appointmentStatusUpdateSchema };

