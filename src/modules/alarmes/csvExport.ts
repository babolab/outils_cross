import type { AlarmRow } from './types'

function fmtDate(d: Date): string {
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}:${String(d.getSeconds()).padStart(2, '0')}`
}

export function exportCsv(shipsData: Map<string, AlarmRow[]>, filename: string): void {
  const headers = ['Navire', 'Navire cible', 'CPA (m)', 'TCPA (min)', 'Date/Heure', 'Position (DMS)', 'Commentaire']
  const rows: string[][] = [headers]

  for (const alarms of shipsData.values()) {
    for (const r of alarms) {
      rows.push([
        r.ship_name,
        r.target_1_ship_name,
        String(Math.round(r.dcpam)),
        r.tcpa_min.toFixed(2),
        fmtDate(r.event_dt_local),
        r.position_dms,
        r.comment_final,
      ])
    }
  }

  const csv = '﻿' + rows.map((r) => r.map((c) => `"${c}"`).join(';')).join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}
