// Approximate NAVAREA zone boundaries — for visualization purposes ONLY.
// Actual boundaries are defined by IMO/IHO and may differ from these rectangles.
export interface NavareaInfo {
  name: string
  coordinator: string
  bounds: [[number, number], [number, number]] // [[lat_sw, lon_sw], [lat_ne, lon_ne]]
}

export const NAVAREA_BOUNDS: Record<string, NavareaInfo> = {
  '01': { name: 'NAVAREA I',    coordinator: 'Royaume-Uni',      bounds: [[ 30, -80 ], [ 72,  0   ]] },
  '02': { name: 'NAVAREA II',   coordinator: 'France',           bounds: [[ -5, -40 ], [ 48,  15  ]] },
  '03': { name: 'NAVAREA III',  coordinator: 'Espagne',          bounds: [[-48, -20 ], [ -5,  15  ]] },
  '04': { name: 'NAVAREA IV',   coordinator: 'États-Unis',       bounds: [[ 30, -105], [ 72, -40  ]] },
  '05': { name: 'NAVAREA V',    coordinator: 'Brésil',           bounds: [[-55, -70 ], [ -5, -30  ]] },
  '06': { name: 'NAVAREA VI',   coordinator: 'États-Unis',       bounds: [[ 30, -180], [ 72, -100 ]] },
  '07': { name: 'NAVAREA VII',  coordinator: 'Japon',            bounds: [[  0,  100], [ 72,  180 ]] },
  '08': { name: 'NAVAREA VIII', coordinator: 'Inde',             bounds: [[-10,  45 ], [ 30,  105 ]] },
  '09': { name: 'NAVAREA IX',   coordinator: 'Australie',        bounds: [[-55,  20 ], [-10,  90  ]] },
  '10': { name: 'NAVAREA X',    coordinator: 'Grèce',            bounds: [[ 28,  -6 ], [ 47,  42  ]] },
  '11': { name: 'NAVAREA XI',   coordinator: 'Chili',            bounds: [[-60, -130], [  0, -60  ]] },
  '12': { name: 'NAVAREA XII',  coordinator: 'Australie',        bounds: [[-55,  90 ], [  0,  180 ]] },
  '13': { name: 'NAVAREA XIII', coordinator: 'International',    bounds: [[-90, -180], [-55,  180 ]] },
  '14': { name: 'NAVAREA XIV',  coordinator: 'Arabie Saoudite',  bounds: [[  8,  44 ], [ 30,  72  ]] },
  '15': { name: 'NAVAREA XV',   coordinator: 'Afrique du Sud',   bounds: [[-55, -30 ], [  0,  25  ]] },
  '16': { name: 'NAVAREA XVI',  coordinator: 'Russie / Norvège', bounds: [[ 72, -30 ], [ 90,  70  ]] },
  '17': { name: 'NAVAREA XVII', coordinator: 'Russie',           bounds: [[ 60,  70 ], [ 90,  140 ]] },
  '18': { name: 'NAVAREA XVIII',coordinator: 'Russie',           bounds: [[ 60,  140], [ 90,  180 ]] },
  '19': { name: 'NAVAREA XIX',  coordinator: 'Canada',           bounds: [[ 72, -110], [ 90, -30  ]] },
  '20': { name: 'NAVAREA XX',   coordinator: 'Norvège',          bounds: [[ 72, -80 ], [ 90, -10  ]] },
  '21': { name: 'NAVAREA XXI',  coordinator: 'Russie',           bounds: [[ 60, -180], [ 90, -160 ]] },
}
