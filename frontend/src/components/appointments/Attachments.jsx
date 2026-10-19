import { useCallback, useEffect, useRef, useState } from 'react'
import { Download, FileUp, Paperclip, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { attachmentService } from '../../services/attachmentService'

const size = (value) => `${Math.max(1, Math.round(value / 1024))} KB`

export default function Attachments({ appointment, canUpload, canDelete }) {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const input = useRef(null)
  const appointmentId = appointment.id

  const load = useCallback(() => {
    setLoading(true)
    attachmentService.list({ id: appointmentId })
      .then(setItems)
      .catch((error) => toast.error(error.message))
      .finally(() => setLoading(false))
  }, [appointmentId])

  useEffect(() => { load() }, [load])

  const upload = async (event) => {
    const file = event.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      const attachment = await attachmentService.upload(appointmentId, file)
      setItems((current) => [attachment, ...current])
      toast.success('Documento adjuntado.')
    } catch (error) { toast.error(error.message) } finally {
      setUploading(false)
      event.target.value = ''
    }
  }

  const remove = async (item) => {
    try {
      await attachmentService.remove(appointmentId, item.id)
      setItems((current) => current.filter((entry) => entry.id !== item.id))
      toast.success('Documento eliminado.')
    } catch (error) { toast.error(error.message) }
  }

  return <section className="mt-6 rounded-xl border p-4">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <h2 className="flex items-center gap-2 font-bold text-navy"><Paperclip size={18}/>Documentos de soporte</h2>
      {canUpload && <><input ref={input} className="hidden" type="file" accept=".pdf,image/jpeg,image/png,image/webp" onChange={upload}/><button className="btn-secondary" disabled={uploading} onClick={() => input.current?.click()}><FileUp size={16}/>{uploading ? 'Adjuntando…' : 'Adjuntar documento'}</button></>}
    </div>
    <p className="mt-2 text-xs text-slate-500">PDF, JPG, PNG o WEBP · máximo 5 MB · hasta 5 archivos.</p>
    {loading ? <p className="mt-4 text-sm text-slate-500">Cargando documentos…</p> : !items.length ? <p className="mt-4 text-sm text-slate-500">No hay documentos adjuntos.</p> : <ul className="mt-4 divide-y">{items.map((item) => <li className="flex items-center justify-between gap-3 py-3 text-sm" key={item.id}><span className="min-w-0"><strong className="block truncate text-navy">{item.originalName}</strong><small className="text-slate-500">{item.mimeType} · {size(item.size)}</small></span><span className="flex shrink-0 gap-1"><button aria-label={`Descargar ${item.originalName}`} className="btn-ghost min-h-0 p-2" onClick={() => attachmentService.download(appointmentId, item).catch((error) => toast.error(error.message))}><Download size={16}/></button>{canDelete && <button aria-label={`Eliminar ${item.originalName}`} className="btn-ghost min-h-0 p-2 text-red-700" onClick={() => remove(item)}><Trash2 size={16}/></button>}</span></li>)}</ul>}
  </section>
}
