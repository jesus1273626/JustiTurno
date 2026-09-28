import { z } from 'zod'
const date = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'La fecha debe usar formato YYYY-MM-DD.')
const time = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'El horario debe usar formato HH:MM.')
export const availabilitySchema = z.object({ date })
export const createAppointmentSchema = z.object({ serviceId: z.string().min(1), date, time, reason: z.string().trim().min(10, 'El motivo debe tener al menos 10 caracteres.').max(1000) })
export const rejectSchema = z.object({ reason: z.string().trim().min(5, 'El motivo es obligatorio.').max(1000) })
export const rescheduleSchema = z.object({ date, time, reason: z.string().trim().min(5, 'El motivo es obligatorio.').max(1000) })
export const observationSchema = z.object({ message: z.string().trim().min(2).max(1500), visibleToCitizen: z.boolean().default(true) })
export const appointmentFiltersSchema = z.object({ status: z.string().optional(), date: date.optional(), search: z.string().trim().optional(), serviceId: z.string().optional(), assignedToMe: z.enum(['true', 'false']).optional(), upcoming: z.enum(['true', 'false']).optional(), history: z.enum(['true', 'false']).optional(), page: z.coerce.number().int().min(1).default(1), limit: z.coerce.number().int().min(1).max(100).default(20) })
