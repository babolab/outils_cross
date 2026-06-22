export interface VtsAlarm {
  event_id: string
  ship_name: string
  ship_imo: string
  ship_mmsi: string
  ship_position: string
  ship2_name: string
  ship2_imo: string
  ship2_mmsi: string
  ship2_position: string
  cpa_meters: string
  tcpa_seconds: string
  event_dt_utc: string
  alarm_event_type: string
  event_reason: string
  vts_area_name: string
  is_ack: string
  ack_comment: string
  ack_username: string
  event_data_b64: string
  _dt: Date
  _b64: B64Data | null
}

export interface B64Data {
  TARGET_0?: { TARGET_DATA?: Record<string, unknown> }
  TARGET_1?: { TARGET_DATA?: Record<string, unknown> }
  SYSTEM_EVENT?: Record<string, unknown>
}

export interface Pnav4Row {
  cols: string[] // 33 éléments : A=0 … AG=32 ; TSV exporté depuis l'index 2 (col C)
  date: string
  heure: string
  type: string
  nav1: string
  imo1: string
  type1: string
  nav2: string
  imo2: string
  type2: string
  cpa: string
  tcpa: string
  lat: string
  lon: string
  desc: string
  oper: string
}

export interface SitproxStats {
  files: number
  brut: number
  dedup: number
  rapprochee: number
  anticipee: number
  nonAck: number
}
