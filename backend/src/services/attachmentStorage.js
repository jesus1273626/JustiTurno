import fs from 'node:fs/promises'
import path from 'node:path'
import { env } from '../config/env.js'

export const databaseStorage = 'postgresql'

function legacyFile(name) {
  if (!/^[0-9a-f-]{36}\.(pdf|jpg|png|webp)$/.test(name)) {
    throw Object.assign(new Error('Adjunto no encontrado.'), { status: 404 })
  }
  return path.resolve(env.uploadDir, 'appointments', name)
}

export async function readLegacyFile(name) {
  try {
    return await fs.readFile(legacyFile(name))
  } catch (error) {
    if (error.code === 'ENOENT') return null
    throw error
  }
}

export const removeLegacyFile = name => fs.rm(legacyFile(name), { force: true })
