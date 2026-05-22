export interface AlarmRow {
  ship_name: string
  target_1_ship_name: string
  event_type: string
  event_dt_local: Date
  dcpam: number
  tcpamsec: number
  tcpa_min: number
  event_pos_wkt: string
  position_dms: string
  ack_comment: string
  couple_key: string
  comment_final: string
}
