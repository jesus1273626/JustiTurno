export default function Pagination({ pagination, onChange }) {
  if (!pagination || pagination.totalPages <= 1) return null
  const { page, totalPages } = pagination
  const max = 5
  let end = Math.min(totalPages, Math.max(max, Math.min(page + Math.floor(max / 2), totalPages)))
  let start = Math.max(1, Math.min(page - Math.floor(max / 2), end - max + 1))
  const pages = []
  for (let i = start; i <= end; i += 1) pages.push(i)
  return <nav className="flex flex-wrap items-center justify-center gap-1" aria-label="Paginación"><button className="btn-ghost min-h-0 px-3 py-1.5" disabled={page <= 1} onClick={() => onChange(page - 1)}>Anterior</button>{start > 1 && <button className="min-h-0 rounded-lg px-3 py-1.5 text-sm font-semibold text-slate-600 hover:bg-slate-100" onClick={() => onChange(1)}>1</button>}{start > 2 && <span className="px-1 text-slate-400">…</span>}{pages.map((item) => <button key={item} className={`min-h-0 rounded-lg px-3 py-1.5 text-sm font-semibold ${item === page ? 'bg-primary text-white' : 'text-slate-600 hover:bg-slate-100'}`} onClick={() => onChange(item)} aria-current={item === page ? 'page' : undefined}>{item}</button>)}{end < totalPages - 1 && <span className="px-1 text-slate-400">…</span>}{end < totalPages && <button className="min-h-0 rounded-lg px-3 py-1.5 text-sm font-semibold text-slate-600 hover:bg-slate-100" onClick={() => onChange(totalPages)}>{totalPages}</button>}<button className="btn-ghost min-h-0 px-3 py-1.5" disabled={page >= totalPages} onClick={() => onChange(page + 1)}>Siguiente</button></nav>
}