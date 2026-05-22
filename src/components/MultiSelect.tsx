import { useState, useRef, useEffect } from 'react'
import { X, ChevronDown } from 'lucide-react'

interface Props {
  options: string[]
  selected: string[]
  onChange: (selected: string[]) => void
  placeholder?: string
}

export default function MultiSelect({ options, selected, onChange, placeholder = 'Rechercher…' }: Props) {
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const filtered = options.filter(
    (o) => !selected.includes(o) && o.toLowerCase().includes(query.toLowerCase()),
  )

  const add = (ship: string) => {
    onChange([...selected, ship])
    setQuery('')
  }

  const remove = (ship: string) => onChange(selected.filter((s) => s !== ship))

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  return (
    <div ref={containerRef} className="relative">
      {/* Selected chips + input */}
      <div
        className="min-h-10 flex flex-wrap gap-1.5 items-center px-2.5 py-1.5 bg-slate-700 border border-slate-600 rounded-lg cursor-text focus-within:border-blue-500 transition-colors"
        onClick={() => { setOpen(true); containerRef.current?.querySelector('input')?.focus() }}
      >
        {selected.map((ship) => (
          <span
            key={ship}
            className="flex items-center gap-1 px-2 py-0.5 bg-blue-600 text-white text-xs rounded-full"
          >
            {ship}
            <button
              onClick={(e) => { e.stopPropagation(); remove(ship) }}
              className="hover:text-blue-200 transition-colors"
            >
              <X size={10} />
            </button>
          </span>
        ))}
        <input
          type="text"
          value={query}
          placeholder={selected.length === 0 ? placeholder : ''}
          onChange={(e) => { setQuery(e.target.value); setOpen(true) }}
          onFocus={() => setOpen(true)}
          className="flex-1 min-w-24 bg-transparent text-sm text-slate-200 placeholder-slate-500 outline-none"
        />
        <ChevronDown size={14} className={`text-slate-400 shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} />
      </div>

      {/* Dropdown */}
      {open && (
        <div className="absolute z-50 mt-1 w-full bg-slate-800 border border-slate-600 rounded-lg shadow-xl max-h-60 overflow-y-auto">
          {filtered.length === 0 ? (
            <p className="px-3 py-2.5 text-xs text-slate-500">
              {query ? 'Aucun résultat' : 'Tous les navires sélectionnés'}
            </p>
          ) : (
            filtered.map((ship) => (
              <button
                key={ship}
                onMouseDown={(e) => { e.preventDefault(); add(ship) }}
                className="w-full text-left px-3 py-2 text-sm text-slate-300 hover:bg-slate-700 hover:text-white transition-colors"
              >
                {ship}
              </button>
            ))
          )}
          {selected.length > 0 && (
            <div className="border-t border-slate-700 px-3 py-2">
              <button
                onMouseDown={(e) => { e.preventDefault(); onChange([]) }}
                className="text-xs text-red-400 hover:text-red-300"
              >
                Tout désélectionner
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
