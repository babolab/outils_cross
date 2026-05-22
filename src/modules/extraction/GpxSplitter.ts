// Ported from extraction_derive/app2.py
// Groups MOTHY GPX waypoints by UTC date+hour, preserving original XML

export interface WaypointEntry {
  hourKey: string // e.g. "2024-03-15_10h"
  xmlStr: string  // raw serialized <wpt ...>...</wpt>
}

export async function parseAndGroupGpx(file: File): Promise<Map<string, string[]>> {
  const text = await file.text()
  const doc = new DOMParser().parseFromString(text, 'application/xml')
  const wpts = Array.from(doc.querySelectorAll('wpt'))

  if (wpts.length === 0) throw new Error('Aucun waypoint trouvé dans ce fichier GPX.')

  const groups = new Map<string, string[]>()
  const serializer = new XMLSerializer()

  for (const wpt of wpts) {
    const timeEl = wpt.querySelector('time')
    if (!timeEl?.textContent) continue

    // Parse UTC timestamp — format: 2024-03-15T10:30:00Z
    const dt = new Date(timeEl.textContent)
    if (isNaN(dt.getTime())) continue

    const dateStr = `${dt.getUTCFullYear()}-${String(dt.getUTCMonth() + 1).padStart(2, '0')}-${String(dt.getUTCDate()).padStart(2, '0')}`
    const hourStr = String(dt.getUTCHours()).padStart(2, '0')
    const key = `${dateStr}_${hourStr}h`

    const arr = groups.get(key) ?? []
    arr.push(serializer.serializeToString(wpt))
    groups.set(key, arr)
  }

  if (groups.size === 0) throw new Error('Aucun waypoint avec timestamp valide trouvé.')

  // Return sorted by key
  return new Map([...groups.entries()].sort(([a], [b]) => a.localeCompare(b)))
}

export function buildGpxFromXmlStrings(key: string, wptXmlStrings: string[]): string {
  const wptLines = wptXmlStrings
    .map((s) => {
      // Strip namespace declarations added by XMLSerializer
      return s.replace(/ xmlns(:\w+)?="[^"]*"/g, '').trim()
    })
    .join('\n  ')

  return `<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1" creator="CROSS Jobourg outils" xmlns="http://www.topografix.com/GPX/1/1">
  <metadata><name>${key}</name></metadata>
  ${wptLines}
</gpx>`
}
