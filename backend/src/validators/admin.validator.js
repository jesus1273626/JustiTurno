import { z } from 'zod'

const time = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/)
const scheduleFields = {
  serviceId: z.string().min(1), dayOfWeek: z.number().int().min(0).max(6),
  startTime: time, endTime: time, slotDuration: z.number().int().positive(), capacity: z.number().int().positive()
}
export const scheduleSchema = z.object(scheduleFields).refine((value) => value.startTime < value.endTime, { message: 'La hora de inicio debe ser anterior a la hora de finalización.' })
export const scheduleUpdateSchema = z.object(scheduleFields).partial()
export const serviceSchema = z.object({ name: z.string().trim().min(3), slug: z.string().trim().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/), description: z.string().trim().min(10), category: z.string().trim().min(2), durationMinutes: z.number().int().positive() })
