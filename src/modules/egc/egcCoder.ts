import type { EgcFormState } from './types'

function pad(value: string, length: number): string {
  return value.padStart(length, '0')
}

export function buildC3(form: EgcFormState): string {
  switch (form.c2) {
    case '00':
      return '00'
    case '14':
    case '44':
      return (
        pad(form.lat, 2) +
        form.latHemi +
        pad(form.lon, 3) +
        form.lonHemi +
        pad(form.radius, 3)
      )
    case '31':
      return pad(form.navarea, 2)
    case '34':
      return (
        pad(form.lat, 2) +
        form.latHemi +
        pad(form.lon, 3) +
        form.lonHemi +
        pad(form.height, 2) +
        pad(form.width, 3)
      )
  }
}

export function buildEgcLine(form: EgcFormState): string {
  const c3 = buildC3(form)
  return `EGC ${form.sat} ${form.c1} ${form.c2} ${c3} ${form.c4} 00`
}

export function validateForm(form: EgcFormState): string[] {
  const errors: string[] = []
  const lat = parseInt(form.lat, 10)
  const lon = parseInt(form.lon, 10)

  if (form.c2 === '14' || form.c2 === '44') {
    if (isNaN(lat) || lat < 0 || lat > 90)
      errors.push('Latitude : valeur 00–90 requise')
    if (isNaN(lon) || lon < 0 || lon > 180)
      errors.push('Longitude : valeur 000–180 requise')
    const r = parseInt(form.radius, 10)
    if (isNaN(r) || r < 1 || r > 999)
      errors.push('Rayon : valeur 001–999 nm requise')
  }

  if (form.c2 === '34') {
    if (isNaN(lat) || lat < 0 || lat > 90)
      errors.push('Latitude coin SW : valeur 00–90 requise')
    if (isNaN(lon) || lon < 0 || lon > 180)
      errors.push('Longitude coin SW : valeur 000–180 requise')
    const h = parseInt(form.height, 10)
    if (isNaN(h) || h < 1 || h > 90)
      errors.push('Hauteur : valeur 01–90° requise')
    const w = parseInt(form.width, 10)
    if (isNaN(w) || w < 1 || w > 360)
      errors.push('Largeur : valeur 001–360° requise')
  }

  if (form.c2 === '31') {
    const n = parseInt(form.navarea, 10)
    if (isNaN(n) || n < 1 || n > 21)
      errors.push('Zone NAVAREA : valeur 01–21 requise')
  }

  return errors
}

// Returns true when the C3 fields contain valid values for map rendering
export function isFormValid(form: EgcFormState): boolean {
  return validateForm(form).length === 0
}
