export interface MothyWaypoint {
  lat: number
  lon: number
  time: Date
  name?: string
}

export interface VtsTrackPoint {
  lat: number
  lon: number
  time?: Date
}

export interface VtsTrack {
  name: string
  points: VtsTrackPoint[]
}

export interface AnaisVessel {
  mmsi: string
  lat: number
  lon: number
  time: Date
}

export type LayerVisibility = {
  mothy: boolean
  barycenter: boolean
  vts: boolean
  anais: boolean
}
