import type { VtsAlarm, Pnav4Row, B64Data } from './types'
import { parseWktCoords, ddToDdm } from '../../lib/geo'

const WINDOW_MS = 45 * 60 * 1000

// ─── b64 ────────────────────────────────────────────────────────────────────

function decodeB64(str: string): B64Data | null {
  if (!str) return null
  try { return JSON.parse(atob(str)) as B64Data }
  catch { return null }
}

function deepGet(obj: unknown, path: string): unknown {
  return path.split('.').reduce<unknown>((acc, k) => {
    if (acc != null && typeof acc === 'object') return (acc as Record<string, unknown>)[k]
    return undefined
  }, obj)
}

// ─── Type navire ─────────────────────────────────────────────────────────────

type ShipKind = 'FV' | 'SV' | 'MV'

function shipType(name: string, targetData: Record<string, unknown> | undefined): ShipKind {
  const n = name.toUpperCase()
  if (/\bF\/V\b|\bF\.V\.|^FV\s|\bFISH\b/.test(n))      return 'FV'
  if (/\bS\/V\b|\bS\.V\.|^SV\s|SOLO SAILOR/.test(n))    return 'SV'
  if (targetData) {
    const bu = String(targetData['BU'] ?? '').toUpperCase()
    if (/FISH|PECH|TRAWL|CHALUT/.test(bu))                return 'FV'
    if (/SAIL|VOILE|PLAISANCE|YACHT|PLEASURE/.test(bu))   return 'SV'
    const code = parseInt(String(targetData['BV'] ?? '0'), 10)
    if (code >= 30 && code <= 35) return 'FV'
    if (code === 36 || code === 37) return 'SV'
  }
  return 'MV'
}

// ─── IMO / MMSI ──────────────────────────────────────────────────────────────

function imoOrMmsi(imo: string, mmsi: string): string {
  const s = imo.replace(/\D/g, '')
  return s.length === 7 ? s : mmsi
}

// ─── Formatage dates ─────────────────────────────────────────────────────────

function pad2(n: number): string { return String(n).padStart(2, '0') }

function fmtDate(d: Date): string {
  return `${pad2(d.getUTCDate())}/${pad2(d.getUTCMonth() + 1)}/${d.getUTCFullYear()}`
}

function fmtTime(d: Date): string {
  return `${pad2(d.getUTCHours())}:${pad2(d.getUTCMinutes())}`
}

export function parseUTC(s: string): Date | null {
  if (!s) return null
  const d = new Date(s.replace(' ', 'T') + 'Z')
  return isNaN(d.getTime()) ? null : d
}

// ─── Déduplication ───────────────────────────────────────────────────────────

function bestCPA(burst: VtsAlarm[]): VtsAlarm {
  return burst.reduce((acc, cur) => {
    const ca = parseFloat(acc.cpa_meters)
    const cc = parseFloat(cur.cpa_meters)
    return (isNaN(cc) ? Infinity : cc) < (isNaN(ca) ? Infinity : ca) ? cur : acc
  })
}

export function deduplicate(alarms: VtsAlarm[]): VtsAlarm[] {
  const byPair = new Map<string, VtsAlarm[]>()
  const isolated: VtsAlarm[] = []

  for (const a of alarms) {
    const m1 = parseInt(a.ship_mmsi, 10) || 0
    const m2 = parseInt(a.ship2_mmsi, 10) || 0
    if (!m1 && !m2) { isolated.push(a); continue }
    const key = `${Math.min(m1, m2)}_${Math.max(m1, m2)}`
    if (!byPair.has(key)) byPair.set(key, [])
    byPair.get(key)!.push(a)
  }

  const result: VtsAlarm[] = [...isolated]

  for (const pairAlarms of byPair.values()) {
    pairAlarms.sort((a, b) => a._dt.getTime() - b._dt.getTime())
    let burst: VtsAlarm[] = [pairAlarms[0]]
    for (let i = 1; i < pairAlarms.length; i++) {
      if (pairAlarms[i]._dt.getTime() - pairAlarms[i - 1]._dt.getTime() < WINDOW_MS) {
        burst.push(pairAlarms[i])
      } else {
        result.push(bestCPA(burst))
        burst = [pairAlarms[i]]
      }
    }
    result.push(bestCPA(burst))
  }

  result.sort((a, b) => a._dt.getTime() - b._dt.getTime())
  return result
}

// ─── Préparation (filtre période + décodage b64) ──────────────────────────────

export function prepareAlarms(
  alarms: VtsAlarm[],
  dtFrom: Date | null,
  dtTo: Date | null,
): VtsAlarm[] {
  const result: VtsAlarm[] = []
  for (const a of alarms) {
    const dt = parseUTC(a.event_dt_utc)
    if (!dt) continue
    if (dtFrom && dt < dtFrom) continue
    if (dtTo && dt > dtTo) continue
    result.push({ ...a, _dt: dt, _b64: decodeB64(a.event_data_b64) })
  }
  return result
}

// ─── Mapping colonnes pnav4 (A=0 … AG=32, TSV depuis index 2) ─────────────────

export function buildRow(alarm: VtsAlarm): Pnav4Row {
  const dt  = alarm._dt
  const b64 = alarm._b64

  const sysE = (b64?.SYSTEM_EVENT ?? null) as Record<string, unknown> | null
  const t0   = b64?.TARGET_0?.TARGET_DATA
  const t1   = b64?.TARGET_1?.TARGET_DATA

  const pos     = parseWktCoords(alarm.ship_position)
  const latStr  = pos ? ddToDdm(pos.lat, true)  : ''
  const lonStr  = pos ? ddToDdm(pos.lon, false) : ''
  const posJson = pos
    ? JSON.stringify({ format: 'DMS', lat: +pos.lat.toFixed(6), lon: +pos.lon.toFixed(6) })
    : ''

  const operator = alarm.ack_username
    || (String(deepGet(sysE, 'F.A.A.D') ?? ''))
    || 'non acquitté'

  const cpam    = alarm.cpa_meters   !== '' ? parseFloat(alarm.cpa_meters)   : NaN
  const tcpaSec = alarm.tcpa_seconds !== '' ? parseFloat(alarm.tcpa_seconds) : NaN
  const cpaNq   = cpam / 1852
  const typeE   = !isNaN(cpam) && cpaNq < 0.7 ? 'SITUATION RAPPROCHÉE' : 'SITUATION ANTICIPÉE'
  const cpaFmt  = isNaN(cpam)    ? '' : cpaNq.toFixed(2)
  const tcpaFmt = isNaN(tcpaSec) ? '' : (tcpaSec / 60).toFixed(1)

  const cols = new Array<string>(33).fill('')
  cols[2]  = fmtDate(dt)
  cols[3]  = fmtTime(dt)
  cols[4]  = typeE
  // F(5) G(6) H(7) : vides
  cols[8]  = shipType(alarm.ship_name,  t0)
  cols[9]  = imoOrMmsi(alarm.ship_imo,  alarm.ship_mmsi)
  cols[10] = alarm.ship_name
  cols[11] = alarm.ack_comment
  // M(12) N(13) : vides
  cols[14] = posJson
  cols[15] = latStr
  cols[16] = lonStr
  // R(17)→V(21) : vides
  cols[22] = operator
  // X(23) Y(24) : vides
  cols[25] = shipType(alarm.ship2_name, t1)
  cols[26] = imoOrMmsi(alarm.ship2_imo, alarm.ship2_mmsi)
  cols[27] = alarm.ship2_name
  // AC(28) AD(29) AE(30) : vides
  cols[31] = cpaFmt
  cols[32] = tcpaFmt

  return {
    cols,
    date: cols[2], heure: cols[3], type: typeE,
    nav1: alarm.ship_name,  imo1: cols[9],  type1: cols[8],
    nav2: alarm.ship2_name, imo2: cols[26], type2: cols[25],
    cpa: cpaFmt, tcpa: tcpaFmt,
    lat: latStr, lon: lonStr,
    desc: alarm.ack_comment,
    oper: operator,
  }
}
