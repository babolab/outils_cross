// Ported from suivi-pollution-cross/client/src/lib/parsers.ts

export interface DriftPoint {
  lat: number
  lon: number
  time: string
  name: string // 'surface' | 'barycentre'
  particleId: string
  timestep: string
}

export interface TrackPoint {
  lat: number
  lon: number
  time: string
  sog?: number
  cog?: number
}

export interface VesselTrack {
  name: string
  source: 'VTS' | 'ANAIS'
  mmsi?: string
  points: TrackPoint[]
  color?: string
}

export interface DriftData {
  sourceName: string
  points: DriftPoint[]
  timesteps: string[]
}

export interface ParseResult {
  type: 'mothy' | 'vessel' | 'fleet'
  drift?: DriftData
  vessel?: VesselTrack
  fleet?: VesselTrack[]
  fileName: string
}

function parseXML(content: string): Document {
  return new DOMParser().parseFromString(content, 'application/xml')
}

export function parseMothyGpx(content: string, filename: string): DriftData {
  const doc = parseXML(content)
  const drift: DriftData = { sourceName: filename, points: [], timesteps: [] }
  const timesSet = new Set<string>()

  doc.querySelectorAll('wpt').forEach((wpt) => {
    const lat = parseFloat(wpt.getAttribute('lat') || '0')
    const lon = parseFloat(wpt.getAttribute('lon') || '0')
    const name = wpt.querySelector('name')?.textContent || 'surface'
    const timestep = wpt.querySelector('cmt')?.textContent || ''
    const particleId = wpt.querySelector('desc')?.textContent || ''
    const timeStr = wpt.querySelector('time')?.textContent || ''
    if (timeStr) timesSet.add(timeStr)
    drift.points.push({ lat, lon, time: timeStr, name, particleId, timestep })
  })

  drift.timesteps = Array.from(timesSet).sort((a, b) => new Date(a).getTime() - new Date(b).getTime())
  return drift
}

export function parseHistoireGpx(content: string, filename: string): VesselTrack {
  const doc = parseXML(content)
  let name = filename.replace(/\.gpx$/i, '')
  const match = name.match(/^(.+?)_Histoire/)
  if (match) name = match[1].replace(/[-_]/g, ' ')

  const track: VesselTrack = { name, source: 'VTS', points: [] }

  doc.querySelectorAll('trkpt').forEach((pt) => {
    track.points.push({
      lat: parseFloat(pt.getAttribute('lat') || '0'),
      lon: parseFloat(pt.getAttribute('lon') || '0'),
      time: pt.querySelector('time')?.textContent || '',
    })
  })

  // fallback: some files use <wpt> instead of <trk>
  doc.querySelectorAll('wpt').forEach((wpt) => {
    track.points.push({
      lat: parseFloat(wpt.getAttribute('lat') || '0'),
      lon: parseFloat(wpt.getAttribute('lon') || '0'),
      time: wpt.querySelector('time')?.textContent || '',
    })
  })

  track.points.sort((a, b) => new Date(a.time).getTime() - new Date(b.time).getTime())
  return track
}

export function parseAnaisCsv(content: string, filename: string): VesselTrack[] {
  const lines = content.trim().split('\n')
  if (lines.length < 2) return []

  const headers = lines[0].split(',').map((h) => h.trim().toLowerCase())
  const idx = (n: string) => headers.indexOf(n)
  const tsIdx = idx('timestamp'), mmsiIdx = idx('mmsi'), lonIdx = idx('lon'), latIdx = idx('lat')
  const sogIdx = idx('sog'), cogIdx = idx('cog')

  if (tsIdx === -1 || mmsiIdx === -1 || lonIdx === -1 || latIdx === -1)
    throw new Error('Colonnes CSV manquantes (timestamp, mmsi, lon, lat requises)')

  const byMmsi: Record<string, TrackPoint[]> = {}

  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(',')
    if (cols.length < headers.length) continue
    const mmsi = cols[mmsiIdx].trim()
    const lat = parseFloat(cols[latIdx])
    const lon = parseFloat(cols[lonIdx])
    if (isNaN(lat) || isNaN(lon)) continue
    const sog = sogIdx >= 0 ? parseFloat(cols[sogIdx]) : undefined
    const cog = cogIdx >= 0 ? parseFloat(cols[cogIdx]) : undefined
    if (!byMmsi[mmsi]) byMmsi[mmsi] = []
    byMmsi[mmsi].push({
      lat, lon, time: cols[tsIdx].trim(),
      sog: sog !== undefined && !isNaN(sog) ? sog : undefined,
      cog: cog !== undefined && !isNaN(cog) ? cog : undefined,
    })
  }

  return Object.entries(byMmsi).map(([mmsi, points]) => {
    points.sort((a, b) => new Date(a.time).getTime() - new Date(b.time).getTime())
    return { name: `MMSI ${mmsi}`, source: 'ANAIS' as const, mmsi, points }
  })
}

export function detectAndParse(content: string, filename: string): ParseResult {
  const ext = filename.toLowerCase().split('.').pop() || ''

  if (ext === 'csv') return { type: 'fleet', fleet: parseAnaisCsv(content, filename), fileName: filename }

  if (ext === 'gpx') {
    const hasWpt = content.includes('<wpt ')
    const hasTrk = content.includes('<trk>') || content.includes('<trk ')

    if (hasWpt && !hasTrk) return { type: 'mothy', drift: parseMothyGpx(content, filename), fileName: filename }
    if (hasTrk) return { type: 'vessel', vessel: parseHistoireGpx(content, filename), fileName: filename }

    const drift = parseMothyGpx(content, filename)
    if (drift.points.length > 0) return { type: 'mothy', drift, fileName: filename }
    return { type: 'vessel', vessel: parseHistoireGpx(content, filename), fileName: filename }
  }

  throw new Error(`Format non supporté : .${ext}`)
}
