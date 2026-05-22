import { useState, useRef } from 'react'
import { Upload, Download, Archive } from 'lucide-react'
import { parseAndGroupGpx } from './GpxSplitter'
import { downloadZip, downloadSingleGpx } from './ZipBuilder'

export default function ExtractionModule() {
  const [groups, setGroups] = useState<Map<string, string[]>>(new Map())
  const [baseName, setBaseName] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleFile = async (file: File) => {
    setError(''); setLoading(true)
    try {
      const grps = await parseAndGroupGpx(file)
      setGroups(grps)
      setBaseName(file.name.replace(/\.gpx$/i, ''))
    } catch (e) {
      setError(String(e))
    } finally {
      setLoading(false)
    }
  }

  const totalWpts = Array.from(groups.values()).reduce((s, a) => s + a.length, 0)

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-xl font-bold text-blue-300">Découpe horaire de fichiers Mothy</h1>
        <p className="text-sm text-slate-400 mt-1">
          Permet de séparer le fichier Mothy en un fichier par heure (UTC), pour projection dans un SIG ne gérant pas la temporalité des dérives.
        </p>
      </div>

      <div
        className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${loading ? 'border-blue-500' : 'border-slate-600 hover:border-blue-500'}`}
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) handleFile(f) }}
      >
        <Upload size={36} className="mx-auto text-slate-500 mb-3" />
        <p className="text-sm text-slate-300">
          Insérez le fichier GPX créé par Mothy pour le découper heure par heure
        </p>
        <p className="text-xs text-slate-500 mt-1">Glisser-déposer ou cliquer</p>
        <input ref={inputRef} type="file" accept=".gpx" className="hidden"
          onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f) }} />
      </div>

      {loading && <p className="text-sm text-blue-400 animate-pulse">Traitement en cours…</p>}
      {error && <p className="text-sm text-red-400 bg-red-950/50 px-3 py-2 rounded-lg">{error}</p>}

      {groups.size > 0 && (
        <>
          <div className="bg-slate-800 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-slate-200">
                  Découpage effectué avec succès !
                </p>
                <p className="text-xs text-slate-400 mt-0.5">
                  {groups.size} fichier(s) horaire(s) — {totalWpts} point(s) total — {baseName}.gpx
                </p>
                <p className="text-xs text-slate-500 mt-0.5">
                  N'oubliez pas de dézipper avant de glisser dans un SIG.
                </p>
              </div>
              <button
                onClick={() => downloadZip(groups, baseName)}
                className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 rounded-lg text-xs font-medium transition-colors shrink-0"
              >
                <Archive size={14} />
                Télécharger le ZIP
              </button>
            </div>

            <div className="space-y-1.5 max-h-96 overflow-y-auto">
              {Array.from(groups.entries()).map(([key, wptXmls]) => (
                <div key={key} className="flex items-center justify-between bg-slate-700 hover:bg-slate-650 rounded-lg px-3 py-2">
                  <div>
                    <span className="text-sm font-mono text-slate-200">
                      Fichier horaire (UTC) {key}.gpx
                    </span>
                    <span className="ml-3 text-xs text-slate-400">{wptXmls.length} point(s)</span>
                  </div>
                  <button
                    onClick={() => downloadSingleGpx(key, wptXmls)}
                    className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-600 hover:bg-slate-500 rounded text-xs transition-colors"
                  >
                    <Download size={12} /> GPX
                  </button>
                </div>
              ))}
            </div>
          </div>

          <button
            onClick={() => { setGroups(new Map()); setBaseName(''); setError('') }}
            className="text-xs text-slate-500 hover:text-slate-300 transition-colors"
          >
            Réinitialiser
          </button>
        </>
      )}
    </div>
  )
}
