import type { VtsAlarm } from './types'

function parseRfc4180(text: string): string[][] {
  const rows: string[][] = []
  let i = 0
  const n = text.length

  while (i < n) {
    const row: string[] = []
    // eslint-disable-next-line no-constant-condition
    while (true) {
      let field = ''
      if (i < n && text[i] === '"') {
        i++
        while (i < n) {
          if (text[i] === '"') {
            i++
            if (i < n && text[i] === '"') { field += '"'; i++ }
            else break
          } else {
            field += text[i++]
          }
        }
      } else {
        while (i < n && text[i] !== ',' && text[i] !== '\r' && text[i] !== '\n') {
          field += text[i++]
        }
      }
      row.push(field)
      if (i < n && text[i] === ',') { i++; continue }
      break
    }
    if (i < n && text[i] === '\r') i++
    if (i < n && text[i] === '\n') i++
    if (row.length > 1 || (row.length === 1 && row[0] !== '')) rows.push(row)
  }
  return rows
}

function csvToObjects(rows: string[][]): Record<string, string>[] {
  if (rows.length < 2) return []
  const headers = rows[0].map(h => h.trim())
  return rows.slice(1).map(row => {
    const obj: Record<string, string> = {}
    headers.forEach((h, i) => { obj[h] = (row[i] ?? '').trim() })
    return obj
  })
}

export function parseVtsCsv(text: string): VtsAlarm[] {
  const rows = parseRfc4180(text)
  const objects = csvToObjects(rows)
  return objects
    .filter(r => r['alarm_event_type'] === 'COLLISION_CONTROL')
    .map(r => ({
      event_id:         r['event_id']         ?? '',
      ship_name:        r['ship_name']         ?? '',
      ship_imo:         r['ship_imo']          ?? '',
      ship_mmsi:        r['ship_mmsi']         ?? '',
      ship_position:    r['ship_position']     ?? '',
      ship2_name:       r['ship2_name']        ?? '',
      ship2_imo:        r['ship2_imo']         ?? '',
      ship2_mmsi:       r['ship2_mmsi']        ?? '',
      ship2_position:   r['ship2_position']    ?? '',
      cpa_meters:       r['cpa_meters']        ?? '',
      tcpa_seconds:     r['tcpa_seconds']      ?? '',
      event_dt_utc:     r['event_dt_utc']      ?? '',
      alarm_event_type: r['alarm_event_type']  ?? '',
      event_reason:     r['event_reason']      ?? '',
      vts_area_name:    r['vts_area_name']     ?? '',
      is_ack:           r['is_ack']            ?? '',
      ack_comment:      r['ack_comment']       ?? '',
      ack_username:     r['ack_username']      ?? '',
      event_data_b64:   r['event_data_b64']    ?? '',
      _dt: new Date(0),
      _b64: null,
    } satisfies VtsAlarm))
}
