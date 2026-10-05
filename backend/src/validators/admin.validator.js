import { z } from 'zod'

const time = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/)
const scheduleFields = {
  serviceId: z.string().min(1), dayOfWeek: z.number().int().min(0).max(6),
  startTime: time, endTime: time, slotDuration: z.number().int().positive(), capacity: z.number().int().positive()
}
export const scheduleSchema = z.object(scheduleFields).refine((value) => value.startTime < value.endTime, { message: 'La hora de inicio debe ser anterior a la hora de finalización.' })
export const scheduleUpdateSchema = z.object(scheduleFields).partial()
export const serviceSchema = z.object({ name: z.string().trim().min(3), slug: z.string().trim().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/), description: z.string().trim().min(10), category: z.string().trim().min(2), durationMinutes: z.number().int().positive() })
export const activeSchema = z.object({ active: z.boolean() })

const employeeFields = {
  firstName: z.string().trim().min(2, 'El nombre debe tener al menos 2 caracteres.'),
  lastName: z.string().trim().min(2, 'Los apellidos deben tener al menos 2 caracteres.'),
  document: z.string().trim().min(5, 'Ingresa un documento válido.'),
  phone: z.string().trim().regex(/^[0-9+()\s-]{7,20}$/, 'Ingresa un teléfono válido.'),
  email: z.string().trim().email('Ingresa un correo electrónico válido.').transform((email) => email.toLowerCase())
}
export const employeeCreateSchema = z.object({
  ...employeeFields,
  password: z.string().min(8, 'La contraseña debe tener al menos 8 caracteres.'),
  serviceIds: z.array(z.string().min(1)).optional().default([])
})
export const employeeUpdateSchema = z.object({
  firstName: employeeFields.firstName.optional(),
  lastName: employeeFields.lastName.optional(),
  phone: employeeFields.phone.optional(),
  email: employeeFields.email.optional()
}).refine((value) => Object.keys(value).length > 0, { message: 'No se enviaron cambios para actualizar.' })
export const employeeServicesSchema = z.object({ serviceIds: z.array(z.string().min(1)).min(0, 'La lista de servicios es obligatoria.') })
export const userStatusSchema = z.object({ active: z.boolean() })
export const requirementCreateSchema = z.object({
  title: z.string().trim().min(2, 'El título debe tener al menos 2 caracteres.').max(200),
  description: z.string().trim().max(500).optional(),
  required: z.boolean().default(true)
})
export const requirementUpdateSchema = z.object({
  title: z.string().trim().min(2, 'El título debe tener al menos 2 caracteres.').max(200).optional(),
  description: z.string().trim().max(500).optional(),
  required: z.boolean().optional()
})
export const auditFiltersSchema = z.object({
  action: z.string().trim().optional(),
  actorId: z.string().trim().optional(),
  entityType: z.string().trim().optional(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'La fecha debe usar formato YYYY-MM-DD.').optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20)
})
export const employeeFiltersSchema = z.object({
  active: z.enum(['true', 'false']).optional(),
  search: z.string().trim().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20)
})
export const userFiltersSchema = z.object({
  role: z.enum(['CITIZEN', 'EMPLOYEE', 'ADMIN']).optional(),
  active: z.enum(['true', 'false']).optional(),
  search: z.string().trim().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20)
})