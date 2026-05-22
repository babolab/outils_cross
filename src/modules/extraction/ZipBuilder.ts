import JSZip from 'jszip'
import { buildGpxFromXmlStrings } from './GpxSplitter'

export async function downloadZip(groups: Map<string, string[]>, baseName: string): Promise<void> {
  const zip = new JSZip()
  for (const [key, wptXmls] of groups) {
    zip.file(`${key}.gpx`, buildGpxFromXmlStrings(key, wptXmls))
  }
  const blob = await zip.generateAsync({ type: 'blob' })
  trigger(blob, `${baseName}_decoupage_mothy.zip`)
}

export function downloadSingleGpx(key: string, wptXmls: string[]): void {
  const xml = buildGpxFromXmlStrings(key, wptXmls)
  trigger(new Blob([xml], { type: 'application/gpx+xml' }), `${key}.gpx`)
}

function trigger(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url; a.download = filename; a.click()
  URL.revokeObjectURL(url)
}
