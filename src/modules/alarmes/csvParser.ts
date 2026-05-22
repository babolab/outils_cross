import { parseWktToDms } from '../../lib/geo'
import type { AlarmRow } from './types'

function detectSep(firstLine: string): string {
  return firstLine.includes(';') ? ';' : ','
}

export function parseCsv(text: string): AlarmRow[] {
  const lines = text.trim().split('\n')
  if (lines.length < 2) return []

  const sep = detectSep(lines[0])
  const headers = lines[0].split(sep).map((h) => h.trim().replace(/^"/, '').replace(/"$/, ''))

  const idx = (name: string) => headers.indexOf(name)

  const results: AlarmRow[] = []

  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(sep).map((c) => c.trim().replace(/^"/, '').replace(/"$/, ''))
    const get = (name: string) => cols[idx(name)] ?? ''

    const ship = get('ship_name').trim()
    const target = get('target_1_ship_name').trim()
    if (!ship || !target) continue

    const eventType = get('event_type').toUpperCase()
    if (eventType !== 'COLLISION') continue

    const dtStr = get('event_dt_local')
    const event_dt_local = new Date(dtStr)
    if (isNaN(event_dt_local.getTime())) continue

    const dcpam = parseFloat(get('dcpam'))
    const tcpamsec = parseFloat(get('tcpamsec'))
    if (isNaN(dcpam) || isNaN(tcpamsec)) continue

    const tcpa_min = tcpamsec / 1000.0 / 60.0
    if (tcpa_min < 0 || tcpa_min > 7) continue

    const wkt = get('event_pos_wkt')
    const sorted = [ship, target].sort()
    results.push({
      ship_name: ship,
      target_1_ship_name: target,
      event_type: eventType,
      event_dt_local,
      dcpam,
      tcpamsec,
      tcpa_min,
      event_pos_wkt: wkt,
      position_dms: parseWktToDms(wkt),
      ack_comment: get('ack_comment').trim(),
      couple_key: sorted.join('||'),
      comment_final: '',
    })
  }

  return results
}
