import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import type { AlarmRow } from './types'

function fmtDate(d: Date): string {
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`
}

function fmtTime(d: Date): string {
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}:${String(d.getSeconds()).padStart(2, '0')}`
}

export function exportPdf(
  shipsData: Map<string, AlarmRow[]>,
  dateStart: string,
  dateEnd: string,
  filename: string,
  logoDataUrl?: string,
): void {
  const doc = new jsPDF({ orientation: 'landscape' })
  const pageW = doc.internal.pageSize.getWidth()

  // Logo in top-right corner
  if (logoDataUrl) {
    try {
      doc.addImage(logoDataUrl, 'JPEG', pageW - 36, 6, 22, 22)
    } catch {
      // ignore if image fails
    }
  }

  doc.setFontSize(14)
  doc.setFont('helvetica', 'bold')
  doc.text("Rapport d'alarmes de collision", 14, 16)

  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  doc.text(`Période : ${dateStart} → ${dateEnd}`, 14, 23)
  doc.setFontSize(8)
  doc.setTextColor(100)
  doc.text('Alarmes groupées par couple de navires et par intervalle de 15 minutes.', 14, 29)
  doc.setTextColor(0)

  let y = 35

  for (const [ship, alarms] of shipsData) {
    if (y > 170) { doc.addPage(); y = 14 }

    doc.setFillColor(26, 58, 92)
    doc.setTextColor(255, 255, 255)
    doc.setFontSize(11)
    doc.setFont('helvetica', 'bold')
    doc.rect(14, y, doc.internal.pageSize.getWidth() - 28, 8, 'F')
    doc.text(`Navire : ${ship}`, 16, y + 5.5)
    doc.setTextColor(0)
    y += 10

    if (alarms.length === 0) {
      doc.setFontSize(9)
      doc.setFont('helvetica', 'italic')
      doc.text('Aucune alarme pour ce navire.', 14, y + 5)
      y += 12
      continue
    }

    autoTable(doc, {
      startY: y,
      head: [['Navire', 'Cible', 'CPA(m)', 'TCPA(min)', 'Date', 'Heure', 'Position', 'Commentaire']],
      body: alarms.map((r) => [
        r.ship_name.slice(0, 25),
        r.target_1_ship_name.slice(0, 25),
        String(Math.round(r.dcpam)),
        r.tcpa_min.toFixed(2),
        fmtDate(r.event_dt_local),
        fmtTime(r.event_dt_local),
        r.position_dms.slice(0, 35),
        r.comment_final.slice(0, 60),
      ]),
      headStyles: { fillColor: [200, 210, 230], textColor: 0, fontSize: 8 },
      bodyStyles: { fontSize: 7 },
      columnStyles: {
        0: { cellWidth: 35 }, 1: { cellWidth: 35 }, 2: { cellWidth: 18 },
        3: { cellWidth: 18 }, 4: { cellWidth: 22 }, 5: { cellWidth: 18 },
        6: { cellWidth: 50 }, 7: { cellWidth: 60 },
      },
      didParseCell(data) {
        if (data.section === 'body') {
          const alarm = alarms[data.row.index]
          if (alarm && alarm.dcpam < 150) {
            data.cell.styles.textColor = [200, 0, 0]
          }
        }
      },
      margin: { left: 14, right: 14 },
    })

    y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 8
  }

  doc.save(filename)
}
