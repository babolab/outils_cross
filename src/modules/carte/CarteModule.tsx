import { useState, useCallback, useMemo, useRef, useEffect } from 'react'
import { MapContainer, TileLayer, CircleMarker, Polyline, Popup, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { Upload, Play, Pause, SkipBack, SkipForward, X, Anchor, Navigation } from 'lucide-react'
import { detectAndParse, type DriftData, type VesselTrack } from './parsers'

const VESSEL_COLORS = [
  '#e74c3c', '#2ecc71', '#9b59b6', '#e67e22', '#1abc9c',
  '#f39c12', '#3498db', '#e91e63', '#00bcd4', '#8bc34a',
]
const DRIFT_COLOR = '#3498db'
const BARY_COLOR = '#e74c3c'

function FitBounds({ drift, vessels }: { drift: DriftData | null; vessels: VesselTrack[] }) {
  const map = useMap()
  const fittedRef = useRef(false)

  useEffect(() => {
    const lats: number[] = [], lons: number[] = []
    drift?.points.forEach((p) => { lats.push(p.lat); lons.push(p.lon) })
    vessels.forEach((v) => v.points.forEach((p) => { lats.push(p.lat); lons.push(p.lon) }))

    if (lats.length > 0 && !fittedRef.current) {
      map.fitBounds(
        L.latLngBounds([Math.min(...lats), Math.min(...lons)], [Math.max(...lats), Math.max(...lons)]),
        { padding: [30, 30] },
      )
      fittedRef.current = true
    }
  }, [drift, vessels, map])

  return null
}

export default function CarteModule() {
  const [drift, setDrift] = useState<DriftData | null>(null)
  const [vessels, setVessels] = useState<VesselTrack[]>([])
  const [loadedFiles, setLoadedFiles] = useState<string[]>([])
  const [timeIndex, setTimeIndex] = useState(0)
  const [playing, setPlaying] = useState(false)
  const [showDrift, setShowDrift] = useState(true)
  const [showVessels, setShowVessels] = useState(true)
  const [showBarycentre, setShowBarycentre] = useState(true)
  const [showPanel, setShowPanel] = useState(true)
  const [dragOver, setDragOver] = useState(false)
  const [errors, setErrors] = useState<string[]>([])
  const playRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const allTimestamps = useMemo(() => {
    const s = new Set<string>()
    drift?.timesteps.forEach((t) => s.add(t))
    vessels.forEach((v) => v.points.forEach((p) => { if (p.time) s.add(p.time) }))
    return Array.from(s).sort((a, b) => new Date(a).getTime() - new Date(b).getTime())
  }, [drift, vessels])

  const currentTime = allTimestamps[timeIndex] || null
  const currentDate = currentTime ? new Date(currentTime) : null

  const processFiles = useCallback(async (files: FileList | File[]) => {
    let colorIdx = vessels.length
    const newVessels: VesselTrack[] = []
    let newDrift: DriftData | null = null
    const newErrors: string[] = []

    for (const file of Array.from(files)) {
      if (loadedFiles.includes(file.name)) continue
      try {
        const text = await file.text()
        const result = detectAndParse(text, file.name)
        if (result.type === 'mothy' && result.drift) {
          newDrift = result.drift
        } else if (result.type === 'vessel' && result.vessel) {
          result.vessel.color = VESSEL_COLORS[colorIdx % VESSEL_COLORS.length]
          colorIdx++
          newVessels.push(result.vessel)
        } else if (result.type === 'fleet' && result.fleet) {
          result.fleet.forEach((v) => {
            v.color = VESSEL_COLORS[colorIdx % VESSEL_COLORS.length]
            colorIdx++
            newVessels.push(v)
          })
        }
        setLoadedFiles((prev) => [...prev, file.name])
      } catch (e) {
        newErrors.push(`${file.name} : ${e}`)
      }
    }

    if (newDrift) setDrift(newDrift)
    if (newVessels.length > 0) setVessels((prev) => [...prev, ...newVessels])
    if (newErrors.length > 0) setErrors((prev) => [...prev, ...newErrors])
  }, [vessels.length, loadedFiles])

  // Playback
  useEffect(() => {
    if (playing && allTimestamps.length > 1) {
      playRef.current = setInterval(() => {
        setTimeIndex((prev) => {
          if (prev >= allTimestamps.length - 1) { setPlaying(false); return prev }
          return prev + 1
        })
      }, 500)
    }
    return () => { if (playRef.current) clearInterval(playRef.current) }
  }, [playing, allTimestamps.length])

  const driftPointsAtTime = useMemo(() => {
    if (!drift || !currentTime) return []
    const ct = new Date(currentTime).getTime()
    let closest: string | null = null
    for (const ts of drift.timesteps) {
      if (new Date(ts).getTime() <= ct) closest = ts
    }
    if (!closest) return []
    return drift.points.filter((p) => p.time === closest)
  }, [drift, currentTime])

  const vesselTrailsAtTime = useMemo(() => {
    if (!currentTime) return vessels.map((v) => ({ ...v, activePoints: v.points }))
    const ct = new Date(currentTime).getTime()
    return vessels.map((v) => ({
      ...v,
      activePoints: v.points.filter((p) => new Date(p.time).getTime() <= ct),
    }))
  }, [vessels, currentTime])

  const hasData = drift !== null || vessels.length > 0

  const resetAll = () => {
    setDrift(null); setVessels([]); setLoadedFiles([])
    setTimeIndex(0); setPlaying(false); setErrors([])
  }

  const fmt = (d: Date) =>
    d.toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', timeZone: 'UTC' }) + ' UTC'

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="bg-slate-800 border-b border-slate-700 px-3 py-2 flex items-center gap-3 shrink-0">
        <Anchor size={16} className="text-sky-400 shrink-0" />
        <span className="text-sm font-semibold text-slate-200">Visualisation maritime</span>
        <button
          onClick={() => fileInputRef.current?.click()}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 rounded-lg text-xs font-medium transition-colors"
        >
          <Upload size={13} /> Charger
        </button>
        <input ref={fileInputRef} type="file" multiple accept=".gpx,.csv" className="hidden"
          onChange={(e) => e.target.files && processFiles(e.target.files)} />
        <button
          onClick={() => setShowPanel(!showPanel)}
          className="flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-700 hover:bg-slate-600 rounded-lg text-xs transition-colors"
        >
          Couches
        </button>
        {hasData && (
          <button onClick={resetAll} className="ml-auto text-slate-500 hover:text-slate-300">
            <X size={16} />
          </button>
        )}
      </div>

      {errors.length > 0 && (
        <div className="bg-red-950 text-red-300 text-xs px-3 py-1.5 shrink-0">
          {errors.map((e, i) => <div key={i}>{e}</div>)}
        </div>
      )}

      {/* Map + Panel */}
      <div className="flex-1 relative overflow-hidden">
        <MapContainer center={[49.7, -1.9]} zoom={9} className="h-full w-full z-0" zoomControl={false}>
          <TileLayer
            url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
            attribution='&copy; <a href="https://carto.com/">CARTO</a>'
          />
          {hasData && <FitBounds drift={drift} vessels={vessels} />}

          {showDrift && driftPointsAtTime.map((p, i) => {
            const isBary = p.name === 'barycentre'
            if (isBary && !showBarycentre) return null
            return (
              <CircleMarker key={i} center={[p.lat, p.lon]}
                radius={isBary ? 7 : 4}
                pathOptions={{ color: isBary ? BARY_COLOR : DRIFT_COLOR, fillColor: isBary ? BARY_COLOR : DRIFT_COLOR, fillOpacity: isBary ? 0.9 : 0.7, weight: isBary ? 2 : 1 }}>
                <Popup>
                  <div className="text-xs">
                    <strong>{isBary ? 'Barycentre' : 'Particule'}</strong><br />
                    ID: {p.particleId} — Pas: {p.timestep}<br />
                    {p.lat.toFixed(4)}°N {Math.abs(p.lon).toFixed(4)}°W
                  </div>
                </Popup>
              </CircleMarker>
            )
          })}

          {showVessels && vesselTrailsAtTime.map((v, vi) => {
            if (v.activePoints.length === 0) return null
            const color = v.color ?? VESSEL_COLORS[vi % VESSEL_COLORS.length]
            const last = v.activePoints[v.activePoints.length - 1]
            return (
              <span key={vi}>
                <Polyline positions={v.activePoints.map((p) => [p.lat, p.lon] as [number, number])}
                  pathOptions={{ color, weight: 2.5, opacity: 0.8 }} />
                <CircleMarker center={[last.lat, last.lon]} radius={5}
                  pathOptions={{ color: '#fff', fillColor: color, fillOpacity: 1, weight: 2 }}>
                  <Popup>
                    <div className="text-xs">
                      <strong>{v.name}</strong><br />
                      Source: {v.source}
                      {v.mmsi && <><br />MMSI: {v.mmsi}</>}
                      {last.sog !== undefined && <><br />SOG: {last.sog.toFixed(1)} kn</>}
                    </div>
                  </Popup>
                </CircleMarker>
              </span>
            )
          })}
        </MapContainer>

        {/* Drop overlay when empty */}
        {!hasData && (
          <div
            className={`absolute inset-0 z-10 flex items-center justify-center ${dragOver ? 'bg-sky-500/20' : 'bg-black/50'}`}
            onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => { e.preventDefault(); setDragOver(false); processFiles(e.dataTransfer.files) }}
          >
            <div className="bg-slate-800/95 border border-slate-600 rounded-xl p-8 text-center max-w-sm">
              <Upload size={40} className={`mx-auto mb-3 ${dragOver ? 'text-sky-400' : 'text-slate-500'}`} />
              <p className="text-sm font-semibold mb-1">Charger des fichiers</p>
              <p className="text-xs text-slate-400 mb-4">
                GPX Mothy (dérive), GPX VTS Histoire (navires), CSV ANAIS (flotte)
              </p>
              <button onClick={() => fileInputRef.current?.click()}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg text-sm font-medium transition-colors">
                Parcourir
              </button>
            </div>
          </div>
        )}

        {/* Layers panel */}
        {showPanel && hasData && (
          <div className="absolute top-3 right-3 z-10 w-60 bg-slate-900/95 backdrop-blur border border-slate-700 rounded-lg p-3 space-y-3">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Couches</p>

            {drift && (
              <div className="space-y-1.5">
                <label className="flex items-center justify-between cursor-pointer">
                  <span className="flex items-center gap-2 text-xs text-slate-300">
                    <span className="w-3 h-3 rounded-full" style={{ background: DRIFT_COLOR }} />
                    Dérive MOTHY
                  </span>
                  <input type="checkbox" checked={showDrift} onChange={(e) => setShowDrift(e.target.checked)} />
                </label>
                <label className="flex items-center justify-between cursor-pointer pl-5">
                  <span className="flex items-center gap-2 text-xs text-slate-300">
                    <span className="w-3 h-3 rounded-full" style={{ background: BARY_COLOR }} />
                    Barycentre
                  </span>
                  <input type="checkbox" checked={showBarycentre} onChange={(e) => setShowBarycentre(e.target.checked)} />
                </label>
              </div>
            )}

            {vessels.length > 0 && (
              <div className="space-y-1.5">
                <label className="flex items-center justify-between cursor-pointer">
                  <span className="flex items-center gap-2 text-xs text-slate-300">
                    <Navigation size={12} className="text-slate-400" />
                    Navires ({vessels.length})
                  </span>
                  <input type="checkbox" checked={showVessels} onChange={(e) => setShowVessels(e.target.checked)} />
                </label>
                <div className="pl-4 space-y-1 max-h-40 overflow-y-auto">
                  {vessels.map((v, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: v.color }} />
                      <span className="text-xs text-slate-400 truncate">{v.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="pt-2 border-t border-slate-700 text-xs text-slate-500">
              {loadedFiles.length} fichier(s) chargé(s)
            </div>
          </div>
        )}

        {/* Timeline */}
        {hasData && allTimestamps.length > 1 && (
          <div className="absolute bottom-4 left-4 right-4 z-10 bg-slate-900/95 backdrop-blur border border-slate-700 rounded-lg p-3">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1 shrink-0">
                <button onClick={() => { setTimeIndex(0); setPlaying(false) }}
                  className="p-1.5 hover:bg-slate-700 rounded">
                  <SkipBack size={14} />
                </button>
                <button onClick={() => setPlaying(!playing)}
                  className="p-1.5 hover:bg-slate-700 rounded">
                  {playing ? <Pause size={14} /> : <Play size={14} />}
                </button>
                <button onClick={() => { setTimeIndex(allTimestamps.length - 1); setPlaying(false) }}
                  className="p-1.5 hover:bg-slate-700 rounded">
                  <SkipForward size={14} />
                </button>
              </div>
              <input type="range" min={0} max={allTimestamps.length - 1} step={1} value={timeIndex}
                onChange={(e) => { setTimeIndex(Number(e.target.value)); setPlaying(false) }}
                className="flex-1" />
              <span className="text-xs font-mono text-slate-400 shrink-0 min-w-44">
                {currentDate ? fmt(currentDate) : '—'}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
