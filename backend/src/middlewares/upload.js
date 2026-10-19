import multer from 'multer'
import { env } from '../config/env.js'

const allowed = new Set(['application/pdf', 'image/jpeg', 'image/png', 'image/webp'])
export const appointmentUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: env.maxUploadSizeMb * 1024 * 1024 },
  fileFilter: (_req, file, callback) => {
    if (allowed.has(file.mimetype)) return callback(null, true)
    return callback(Object.assign(new Error('Tipo de archivo no permitido.'), { status: 400 }))
  }
})
