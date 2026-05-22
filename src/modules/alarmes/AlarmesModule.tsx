import { useState, useRef } from 'react'
import { Upload, Download, FileText } from 'lucide-react'
import { parseCsv } from './csvParser'
import { groupAlarms } from './alarmGrouper'
import { filterForShip, allShips } from './filters'
import { exportCsv } from './csvExport'
import { exportPdf } from './pdfExport'
import type { AlarmRow } from './types'

function fmtDate(d: Date): string {
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

function isoDate(d: Date): string {
  return d.toISOString().slice(0, 10)
}

export default function AlarmesModule() {
  const [grouped, setGrouped] = useState<AlarmRow[]>([])
  const [ships, setShips] = useState<string[]>([])
  const [selectedShips, setSelectedShips] = useState<string[]>([])
  const [dateStart, setDateStart] = useState('')
  const [dateEnd, setDateEnd] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [pdfLoading, setPdfLoading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleFile = async (file: File) => {
    setError('')
    setLoading(true)
    try {
      const text = await file.text()
      const rows = parseCsv(text)
      if (rows.length === 0) {
        setError('Aucune alarme COLLISION valide trouvée dans ce fichier.')
        return
      }
      const grp = groupAlarms(rows)
      setGrouped(grp)
      const s = allShips(grp)
      setShips(s)
      setSelectedShips([])
      const times = grp.map((r) => r.event_dt_local)
      setDateStart(isoDate(new Date(Math.min(...times.map((t) => t.getTime())))))
      setDateEnd(isoDate(new Date(Math.max(...times.map((t) => t.getTime())))))
    } catch (e) {
      setError(`Erreur : ${e}`)
    } finally {
      setLoading(false)
    }
  }

  const toggleShip = (ship: string) => {
    setSelectedShips((prev) =>
      prev.includes(ship) ? prev.filter((s) => s !== ship) : [...prev, ship],
    )
  }

  const shipsData = new Map<string, AlarmRow[]>()
  if (selectedShips.length > 0 && dateStart && dateEnd) {
    for (const ship of selectedShips) {
      shipsData.set(ship, filterForShip(grouped, ship, new Date(dateStart), new Date(dateEnd)))
    }
  }

  const totalAlarms = Array.from(shipsData.values()).reduce((s, a) => s + a.length, 0)

  const handlePdf = () => {
    setPdfLoading(true)
    try {
      exportPdf(shipsData, dateStart, dateEnd, `rapport_collision_${dateStart}_${dateEnd}.pdf`)
    } finally {
      setPdfLoading(false)
    }
  }

  return (
    <div className="p-6 space-y-6 max-w-6xl mx-auto">
      <div>
        <h1 className="text-xl font-bold text-blue-300">Alarmes de collision VTS</h1>
        <p className="text-sm text-slate-400 mt-1">
          Importez un CSV d'alarmes SIG VTS pour générer un rapport filtré par navire.
        </p>
      </div>

      <div
        className="border-2 border-dashed border-slate-600 rounded-xl p-6 text-center hover:border-blue-500 transition-colors cursor-pointer"
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault()
          const file = e.dataTransfer.files[0]
          if (file) handleFile(file)
        }}
      >
        <Upload size={28} className="mx-auto text-slate-500 mb-2" />
        <p className="text-sm text-slate-300">Glisser-déposer le CSV d'alarmes SIG VTS</p>
        <p className="text-xs text-slate-500 mt-0.5">Service NAVIGATION → Statistiques → Acquittement des alarmes</p>
        <input
          ref={inputRef}
          type="file"
          accept=".csv"
          className="hidden"
          onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
        />
      </div>

      {loading && <p className="text-sm text-blue-400">Traitement en cours…</p>}
      {error && <p className="text-sm text-red-400 bg-red-950 px-3 py-2 rounded">{error}</p>}

      {grouped.length > 0 && (
        <>
          <div className="bg-slate-800 rounded-xl p-4 space-y-4">
            <p className="text-xs text-slate-400">{grouped.length} alarme(s) regroupée(s) chargées</p>

            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">Navires</p>
              <div className="flex flex-wrap gap-2">
                {ships.map((ship) => (
                  <button
                    key={ship}
                    onClick={() => toggleShip(ship)}
                    className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                      selectedShips.includes(ship)
                        ? 'bg-blue-600 text-white'
                        : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                    }`}
                  >
                    {ship}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex gap-4">
              <div>
                <label className="text-xs text-slate-400 block mb-1">Date début</label>
                <input
                  type="date"
                  value={dateStart}
                  onChange={(e) => setDateStart(e.target.value)}
                  className="bg-slate-700 text-slate-200 text-sm px-2 py-1 rounded border border-slate-600"
                />
              </div>
              <div>
                <label className="text-xs text-slate-400 block mb-1">Date fin</label>
                <input
                  type="date"
                  value={dateEnd}
                  onChange={(e) => setDateEnd(e.target.value)}
                  className="bg-slate-700 text-slate-200 text-sm px-2 py-1 rounded border border-slate-600"
                />
              </div>
            </div>
          </div>

          {selectedShips.length === 0 && (
            <p className="text-sm text-slate-500">Sélectionnez au moins un navire pour afficher le rapport.</p>
          )}

          {selectedShips.length > 0 && (
            <>
              <div className="flex items-center gap-3">
                <p className="text-sm text-slate-300">{totalAlarms} alarme(s) — {selectedShips.length} navire(s)</p>
                <button
                  onClick={() => exportCsv(shipsData, `alarmes_collision_${dateStart}_${dateEnd}.csv`)}
                  className="flex items-center gap-2 px-3 py-1.5 bg-slate-700 hover:bg-slate-600 rounded-lg text-xs font-medium transition-colors"
                >
                  <Download size={14} />
                  CSV
                </button>
                <button
                  onClick={handlePdf}
                  disabled={pdfLoading}
                  className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 rounded-lg text-xs font-medium transition-colors"
                >
                  <FileText size={14} />
                  {pdfLoading ? 'Génération…' : 'PDF'}
                </button>
              </div>

              {Array.from(shipsData.entries()).map(([ship, alarms]) => (
                <div key={ship} className="space-y-2">
                  <div className="flex items-center gap-3 px-3 py-2 bg-[#1a3a5c] rounded-lg">
                    <span className="text-sm font-semibold text-white">Navire : {ship}</span>
                    <span className="text-xs text-blue-200">{alarms.length} alarme(s)</span>
                  </div>

                  {alarms.length === 0 ? (
                    <p className="text-sm text-slate-500 px-3">Aucune alarme dans la période sélectionnée.</p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs">
                        <thead>
                          <tr className="bg-slate-700 text-slate-300">
                            <th className="px-2 py-1.5 text-left font-medium">Navire</th>
                            <th className="px-2 py-1.5 text-left font-medium">Cible</th>
                            <th className="px-2 py-1.5 text-right font-medium">CPA (m)</th>
                            <th className="px-2 py-1.5 text-right font-medium">TCPA (min)</th>
                            <th className="px-2 py-1.5 text-left font-medium">Date/Heure</th>
                            <th className="px-2 py-1.5 text-left font-medium">Position</th>
                            <th className="px-2 py-1.5 text-left font-medium">Commentaire</th>
                          </tr>
                        </thead>
                        <tbody>
                          {alarms.map((r, i) => (
                            <tr
                              key={i}
                              className={`border-b border-slate-700 ${r.dcpam < 150 ? 'text-red-400 font-semibold' : 'text-slate-300'} ${i % 2 === 0 ? 'bg-slate-800' : 'bg-slate-750'}`}
                            >
                              <td className="px-2 py-1.5">{r.ship_name}</td>
                              <td className="px-2 py-1.5">{r.target_1_ship_name}</td>
                              <td className="px-2 py-1.5 text-right">{Math.round(r.dcpam)}</td>
                              <td className="px-2 py-1.5 text-right">{r.tcpa_min.toFixed(2)}</td>
                              <td className="px-2 py-1.5">{fmtDate(r.event_dt_local)}</td>
                              <td className="px-2 py-1.5">{r.position_dms}</td>
                              <td className="px-2 py-1.5">{r.comment_final}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              ))}
            </>
          )}
        </>
      )}
    </div>
  )
}
