import { z } from 'zod'
export const updateProfileSchema = z.object({
  firstName: z.string().trim().min(2, 'El nombre debe tener al menos 2 caracteres.').optional(),
  lastName: z.string().trim().min(2, 'Los apellidos deben tener al menos 2 caracteres.').optional(),
  phone: z.string().trim().regex(/^[0-9+()\s-]{7,20}$/, 'Ingresa un teléfono válido.').optional(),
  email: z.string().trim().email('Ingresa un correo electrónico válido.').transform((email) => email.toLowerCase()).optional()
}).refine((value) => Object.keys(value).length > 0, { message: 'No se enviaron cambios para actualizar.' })
export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'La contraseña actual es obligatoria.'),
  newPassword: z.string().min(8, 'La contraseña debe tener al menos 8 caracteres.'),
  confirmPassword: z.string().min(1, 'La confirmación es obligatoria.')
}).refine((value) => value.newPassword === value.confirmPassword, { message: 'Las contraseñas no coinciden.' })