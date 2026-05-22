export type SatCode = '0' | '1' | '2' | '3' | '4' | '9'
export type PriorityCode = '0' | '1' | '2' | '3'
export type ServiceCode = '00' | '14' | '31' | '34' | '44'
export type RepeatCode = '11' | '61' | '62' | '63' | '64' | '66' | '67' | '70' | '71'

export interface EgcFormState {
  sat: SatCode
  c1: PriorityCode
  c2: ServiceCode
  c4: RepeatCode
  // C3 fields for circular zones (C2 = 14 or 44)
  lat: string      // 2 digits, 00–90
  latHemi: 'N' | 'S'
  lon: string      // 3 digits, 000–180
  lonHemi: 'E' | 'W'
  radius: string   // 3 digits, 001–999 nm
  // C3 fields for rectangular zone (C2 = 34)
  height: string   // 2 digits, 01–90°
  width: string    // 3 digits, 001–360°
  // C3 field for NAVAREA zone (C2 = 31)
  navarea: string  // 2 digits, 01–21
}
