import fs from 'node:fs/promises'
import path from 'node:path'
import { env } from '../config/env.js'
import { bucket } from '#platform'

const root = path.resolve(env.uploadDir, 'appointments')
function key(name) {
  if (!/^[0-9a-f-]{36}\.(pdf|jpg|png|webp)$/.test(name)) throw Object.assign(new Error('Adjunto no encontrado.'), {status:404})
  return 'appointments/' + name
}
export function attachmentStorage(r2) {
  return {
    async put(name, bytes, contentType) {
      const objectKey = key(name)
      if (r2) await r2.put(objectKey, bytes, {httpMetadata:{contentType}})
      else {
        await fs.mkdir(root, {recursive:true})
        await fs.writeFile(path.join(root, name), bytes, {flag:'wx'})
      }
      return objectKey
    },
    async read(name) {
      const objectKey = key(name)
      if (!r2) return fs.readFile(path.join(root, name))
      const object = await r2.get(objectKey)
      if (!object) throw Object.assign(new Error('Adjunto no encontrado.'), {status:404})
      return Buffer.from(await object.arrayBuffer())
    },
    async remove(name) {
      const objectKey = key(name)
      if (r2) await r2.delete(objectKey)
      else await fs.rm(path.join(root, name), {force:true})
    }
  }
}
export const storage = attachmentStorage(bucket)
