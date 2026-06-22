import type { Pnav4Row } from './types'

const CSV_HEADERS = [
  'DATE', 'HEURE z', 'TYPE', 'Module SEAMIS', 'Sous type', 'N° SEAMIS',
  'Type navire 1', 'IMO/Immat 1', 'Nom navire 1', 'DESCRIPTION', 'Nb diffusions', 'Lieu',
  'POSITION SIG', 'LATITUDE', 'LONGITUDE',
  'DEMANDE DE MOU', 'PV', 'NEARMISS', 'MISE EN DEMEURE', 'EEI',
  'Trig - opérateur', 'CMS', 'Principale règle enfreinte',
  'Type navire 2', 'IMO navire 2', 'Nom navire 2',
  'ACTION DU VTS', 'ISSUE DE LA SITUATION', 'PROCEDURE INITIEE',
  'CPA (Nq)', 'TCPA (min)',
]

function clean(v: string): string {
  return v.replace(/[\t\r\n]+/g, ' ')
}

export function toTSV(rows: Pnav4Row[]): string {
  return rows.map(r => r.cols.slice(2).map(clean).join('\t')).join('\n')
}

export async function copyToClipboard(text: string): Promise<void> {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text)
    return
  }
  const ta = Object.assign(document.createElement('textarea'), {
    value: text,
    style: 'position:fixed;opacity:0',
  })
  document.body.appendChild(ta)
  ta.select()
  document.execCommand('copy')
  document.body.removeChild(ta)
}

export function downloadCsv(rows: Pnav4Row[], filename: string): void {
  const q = (v: string) => `"${clean(v).replace(/"/g, '""')}"`
  const lines = [
    CSV_HEADERS.map(q).join(','),
    ...rows.map(r => r.cols.slice(2).map(q).join(',')),
  ]
  const blob = new Blob(['﻿' + lines.join('\n')], { type: 'text/csv;charset=utf-8' })
  const a = Object.assign(document.createElement('a'), {
    href: URL.createObjectURL(blob),
    download: filename,
  })
  a.click()
  URL.revokeObjectURL(a.href)
}
