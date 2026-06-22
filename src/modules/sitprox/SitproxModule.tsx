import { useState, useRef, useEffect } from 'react'
import { Upload, Copy, Download, CheckCircle, AlertCircle } from 'lucide-react'
import { parseVtsCsv } from './csvParser'
import { prepareAlarms, deduplicate, buildRow } from './processor'
import { toTSV, copyToClipboard, downloadCsv } from './tsvExport'
import type { VtsAlarm, Pnav4Row, SitproxStats } from './types'

interface LoadedFile { name: string; alarms: VtsAlarm[] }

function Badge({ type }: { type: string }) {
  const rapp = type === 'SITUATION RAPPROCHÉE'
  return (
    <span className={`inline-block px-2 py-0.5 rounded text-xs font-bold whitespace-nowrap ${
      rapp ? 'bg-red-900 text-red-300' : 'bg-green-900 text-green-300'
    }`}>
      {type}
    </span>
  )
}

export default function SitproxModule() {
  const [files, setFiles] = useState<LoadedFile[]>([])
  const [rows, setRows] = useState<Pnav4Row[]>([])
  const [stats, setStats] = useState<SitproxStats | null>(null)
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const showToast = (msg: string, ok = true) => {
    setToast({ msg, ok })
    if (toastTimer.current) clearTimeout(toastTimer.current)
    toastTimer.current = setTimeout(() => setToast(null), 4000)
  }

  useEffect(() => () => { if (toastTimer.current) clearTimeout(toastTimer.current) }, [])

  const handleFiles = async (fileList: FileList | File[]) => {
    const list = Array.from(fileList).filter(f => f.name.toLowerCase().endsWith('.csv'))
    if (!list.length) return
    setError('')
    setLoading(true)
    try {
      const loaded: LoadedFile[] = await Promise.all(
        list.map(async f => ({ name: f.name, alarms: parseVtsCsv(await f.text()) }))
      )
      // Fusionner avec les fichiers déjà chargés (éviter les doublons de nom)
      setFiles(prev => {
        const map = new Map(prev.map(f => [f.name, f]))
        loaded.forEach(f => map.set(f.name, f))
        return [...map.values()]
      })
    } catch (e) {
      setError(`Erreur de lecture : ${e}`)
    } finally {
      setLoading(false)
    }
  }

  const removeFile = (name: string) => {
    setFiles(prev => prev.filter(f => f.name !== name))
    setRows([])
    setStats(null)
  }

  const generate = () => {
    if (!files.length) { setError('Aucun fichier chargé.'); return }
    setError('')

    const dtFrom = dateFrom ? new Date(dateFrom + 'T00:00:00Z') : null
    const dtTo   = dateTo   ? new Date(dateTo   + 'T23:59:59Z') : null

    const allAlarms = files.flatMap(f => f.alarms)
    const prepared  = prepareAlarms(allAlarms, dtFrom, dtTo)
    const deduped   = deduplicate(prepared)
    const generated = deduped.map(buildRow)

    const nRapp = generated.filter(r => r.type === 'SITUATION RAPPROCHÉE').length
    setRows(generated)
    setStats({
      files:      files.length,
      brut:       prepared.length,
      dedup:      deduped.length,
      rapprochee: nRapp,
      anticipee:  deduped.length - nRapp,
    })

    if (!generated.length) setError('Aucune alarme COLLISION_CONTROL dans la période sélectionnée.')
    else showToast(`${generated.length} ligne(s) générée(s).`)
  }

  const handleCopy = async () => {
    try {
      await copyToClipboard(toTSV(rows))
      showToast('TSV copié — cliquez sur la cellule C puis Ctrl+V dans Sheets.')
    } catch {
      showToast('Copie impossible — utilisez le téléchargement CSV.', false)
    }
  }

  const handleDownload = () => {
    const today = new Date().toISOString().slice(0, 10)
    downloadCsv(rows, `pnav4_${today}.csv`)
    showToast('Fichier CSV téléchargé.')
  }

  return (
    <div className="p-6 space-y-6 max-w-screen-xl mx-auto">

      {/* En-tête */}
      <div>
        <h1 className="text-xl font-bold text-blue-300">Suivi des situations de rapprochement</h1>
        <p className="text-sm text-slate-400 mt-1">
          Générez les lignes pnav4 depuis les exports CSV du SIG VTS (alarmes COLLISION_CONTROL).
        </p>
      </div>

      {/* Zone de chargement */}
      <div
        className="border-2 border-dashed border-slate-600 rounded-xl p-6 text-center hover:border-blue-500 transition-colors cursor-pointer"
        onClick={() => inputRef.current?.click()}
        onDragOver={e => e.preventDefault()}
        onDrop={e => { e.preventDefault(); handleFiles(e.dataTransfer.files) }}
      >
        <Upload size={28} className="mx-auto text-slate-500 mb-2" />
        <p className="text-sm text-slate-300">Glisser-déposer un ou plusieurs CSV SIG VTS</p>
        <p className="text-xs text-slate-500 mt-0.5">CROSS_JB_VTS_EVENTS_YYYY-MM_*.csv</p>
        <input ref={inputRef} type="file" accept=".csv" multiple className="hidden"
          onChange={e => { if (e.target.files?.length) { handleFiles(e.target.files); e.target.value = '' } }} />
      </div>

      {/* Fichiers chargés */}
      {files.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {files.map(f => (
            <span key={f.name} className="inline-flex items-center gap-2 bg-slate-700 rounded-full px-3 py-1 text-xs text-slate-200">
              📄 {f.name}
              <button onClick={() => removeFile(f.name)} className="text-slate-400 hover:text-red-400 leading-none">×</button>
            </span>
          ))}
        </div>
      )}

      {/* Filtre période */}
      <div className="flex flex-wrap gap-6 items-end">
        <div>
          <label className="block text-xs text-slate-400 mb-1">Du (UTC)</label>
          <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)}
            className="bg-slate-700 text-slate-200 text-sm px-2 py-1 rounded border border-slate-600" />
        </div>
        <div>
          <label className="block text-xs text-slate-400 mb-1">Au (UTC)</label>
          <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)}
            className="bg-slate-700 text-slate-200 text-sm px-2 py-1 rounded border border-slate-600" />
        </div>
        {(dateFrom || dateTo) && (
          <button onClick={() => { setDateFrom(''); setDateTo('') }}
            className="text-xs text-slate-400 hover:text-slate-200 underline pb-1">
            Effacer
          </button>
        )}
      </div>

      {/* Actions */}
      <div className="flex flex-wrap gap-3 items-center">
        <button onClick={generate}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg text-sm font-medium transition-colors">
          ▶ Générer
        </button>
        <button onClick={handleCopy} disabled={!rows.length}
          className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 disabled:opacity-40 rounded-lg text-sm font-medium transition-colors">
          <Copy size={14} /> Copier TSV (Sheets)
        </button>
        <button onClick={handleDownload} disabled={!rows.length}
          className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 disabled:opacity-40 rounded-lg text-sm font-medium transition-colors">
          <Download size={14} /> Télécharger CSV
        </button>
      </div>

      {loading && <p className="text-sm text-blue-400">Lecture des fichiers…</p>}
      {error   && <p className="text-sm text-red-400 bg-red-950 px-3 py-2 rounded">{error}</p>}

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {[
            { label: 'Fichier(s)',         value: stats.files },
            { label: 'Alarmes brutes',     value: stats.brut },
            { label: 'Après dédup 30 min', value: stats.dedup },
            { label: 'Rapprochées',        value: stats.rapprochee, red: true },
            { label: 'Anticipées',         value: stats.anticipee,  green: true },
          ].map(s => (
            <div key={s.label} className="bg-slate-800 rounded-xl p-3 text-center">
              <div className={`text-2xl font-bold ${s.red ? 'text-red-400' : s.green ? 'text-green-400' : 'text-blue-300'}`}>
                {s.value}
              </div>
              <div className="text-xs text-slate-400 mt-1">{s.label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Aperçu */}
      {rows.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs text-slate-400">
            ⚠️ Coller à partir de la colonne <strong className="text-slate-200">C</strong> dans Sheets
            (A et B = numéros de ligne, à remplir manuellement).
          </p>
          <div className="overflow-x-auto rounded-xl border border-slate-700">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-slate-700 text-slate-300">
                  {['DATE','HEURE z','TYPE','NAVIRE 1','IMO 1','T1','NAVIRE 2','IMO 2','T2',
                    'CPA (Nq)','TCPA (min)','LATITUDE','LONGITUDE','DESCRIPTION','OPÉRATEUR'].map(h => (
                    <th key={h} className="px-2 py-2 text-left font-medium whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((row, i) => (
                  <tr key={i} className={`border-t border-slate-700 ${i % 2 === 0 ? 'bg-slate-800' : 'bg-slate-750'} hover:bg-slate-700`}>
                    <td className="px-2 py-1.5 whitespace-nowrap">{row.date}</td>
                    <td className="px-2 py-1.5 whitespace-nowrap">{row.heure}</td>
                    <td className="px-2 py-1.5"><Badge type={row.type} /></td>
                    <td className="px-2 py-1.5 max-w-[120px] truncate" title={row.nav1}>{row.nav1}</td>
                    <td className="px-2 py-1.5 whitespace-nowrap">{row.imo1}</td>
                    <td className="px-2 py-1.5">{row.type1}</td>
                    <td className="px-2 py-1.5 max-w-[120px] truncate" title={row.nav2}>{row.nav2}</td>
                    <td className="px-2 py-1.5 whitespace-nowrap">{row.imo2}</td>
                    <td className="px-2 py-1.5">{row.type2}</td>
                    <td className="px-2 py-1.5 text-right">{row.cpa}</td>
                    <td className="px-2 py-1.5 text-right">{row.tcpa}</td>
                    <td className="px-2 py-1.5 whitespace-nowrap">{row.lat}</td>
                    <td className="px-2 py-1.5 whitespace-nowrap">{row.lon}</td>
                    <td className="px-2 py-1.5 max-w-[160px] truncate" title={row.desc}>{row.desc}</td>
                    <td className="px-2 py-1.5 max-w-[120px] truncate" title={row.oper}>{row.oper}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div className={`fixed bottom-6 right-6 flex items-center gap-2 px-4 py-3 rounded-xl shadow-lg text-sm font-medium transition-all ${
          toast.ok ? 'bg-green-800 text-green-100' : 'bg-red-800 text-red-100'
        }`}>
          {toast.ok ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
          {toast.msg}
        </div>
      )}
    </div>
  )
}
