export function parseWktCoords(wkt: string): { lat: number; lon: number } | null {
  const match = /POINT\s*\(\s*([-\d.]+)\s+([-\d.]+)\s*\)/i.exec((wkt ?? '').trim())
  if (!match) return null
  return { lon: parseFloat(match[1]), lat: parseFloat(match[2]) }
}

export function ddToDdm(dd: number, isLat: boolean): string {
  const neg = dd < 0
  const abs = Math.abs(dd)
  const deg = Math.floor(abs)
  const minStr = ((abs - deg) * 60).toFixed(2).replace('.', ',')
  return isLat
    ? `${deg}°${minStr}${neg ? 'S' : 'N'}`
    : `${String(deg).padStart(3, '0')}°${minStr}${neg ? 'W' : 'E'}`
}

export function ddToDms(deg: number, isLat: boolean): string {
  const direction = isLat ? (deg >= 0 ? 'N' : 'S') : (deg >= 0 ? 'E' : 'W')
  const abs = Math.abs(deg)
  const d = Math.floor(abs)
  const mFull = (abs - d) * 60
  const m = Math.floor(mFull)
  const s = ((mFull - m) * 60).toFixed(1).padStart(4, '0')
  return `${d}°${String(m).padStart(2, '0')}'${s}"${direction}`
}

export function parseWktToDms(wkt: string): string {
  try {
    const match = /POINT\(([-\d.]+)\s+([-\d.]+)\)/.exec(wkt.trim())
    if (match) {
      const lon = parseFloat(match[1])
      const lat = parseFloat(match[2])
      return `${ddToDms(lat, true)} ${ddToDms(lon, false)}`
    }
  } catch {
    // ignore
  }
  return '-'
}
