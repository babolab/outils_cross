import { useEffect, useMemo } from 'react'
import { MapContainer, TileLayer, CircleMarker, Polyline, Tooltip, useMap } from 'react-leaflet'
import type { MothyWaypoint, VtsTrack, AnaisVessel, LayerVisibility } from './types'

const TRACK_COLORS = ['#60a5fa', '#34d399', '#f472b6', '#fb923c', '#a78bfa', '#facc15']

function FitBounds({ waypoints, tracks, vessels }: {
  waypoints: MothyWaypoint[]
  tracks: VtsTrack[]
  vessels: AnaisVessel[]
}) {
  const map = useMap()
  useEffect(() => {
    const points: [number, number][] = [
      ...waypoints.map((w): [number, number] => [w.lat, w.lon]),
      ...tracks.flatMap((t) => t.points.map((p): [number, number] => [p.lat, p.lon])),
      ...vessels.map((v): [number, number] => [v.lat, v.lon]),
    ]
    if (points.length > 0) {
      map.fitBounds(points, { padding: [20, 20] })
    }
  }, [map, waypoints, tracks, vessels])
  return null
}

function barycenter(pts: { lat: number; lon: number }[]): [number, number] | null {
  if (pts.length === 0) return null
  const lat = pts.reduce((s, p) => s + p.lat, 0) / pts.length
  const lon = pts.reduce((s, p) => s + p.lon, 0) / pts.length
  return [lat, lon]
}

interface MapViewProps {
  mothyPoints: MothyWaypoint[]
  vtsTracks: VtsTrack[]
  anaisVessels: AnaisVessel[]
  visibility: LayerVisibility
  currentTime: Date | null
}

export default function MapView({ mothyPoints, vtsTracks, anaisVessels, visibility, currentTime }: MapViewProps) {
  const filteredMothy = useMemo(() => {
    if (!currentTime) return mothyPoints
    const t = currentTime.getTime()
    return mothyPoints.filter((w) => Math.abs(w.time.getTime() - t) < 30 * 60 * 1000)
  }, [mothyPoints, currentTime])

  const bary = useMemo(() => barycenter(filteredMothy), [filteredMothy])

  return (
    <MapContainer
      center={[49.5, -1.5]}
      zoom={8}
      style={{ height: '100%', width: '100%' }}
      className="z-0"
    >
      <TileLayer
        url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        attribution='&copy; <a href="https://carto.com/">CARTO</a>'
      />

      {visibility.mothy && filteredMothy.map((w, i) => (
        <CircleMarker key={i} center={[w.lat, w.lon]} radius={4} pathOptions={{ color: '#06b6d4', fillOpacity: 0.7 }}>
          <Tooltip>{w.name ?? w.time.toISOString()}</Tooltip>
        </CircleMarker>
      ))}

      {visibility.barycenter && bary && (
        <CircleMarker center={bary} radius={8} pathOptions={{ color: '#ef4444', fillOpacity: 0.9 }}>
          <Tooltip>Barycentre</Tooltip>
        </CircleMarker>
      )}

      {visibility.vts && vtsTracks.map((track, ti) => (
        <Polyline
          key={ti}
          positions={track.points.map((p) => [p.lat, p.lon])}
          pathOptions={{ color: TRACK_COLORS[ti % TRACK_COLORS.length], weight: 2 }}
        >
          <Tooltip sticky>{track.name}</Tooltip>
        </Polyline>
      ))}

      {visibility.anais && anaisVessels.map((v, i) => (
        <CircleMarker key={i} center={[v.lat, v.lon]} radius={5} pathOptions={{ color: '#22c55e', fillOpacity: 0.8 }}>
          <Tooltip>MMSI: {v.mmsi}</Tooltip>
        </CircleMarker>
      ))}

      <FitBounds
        waypoints={mothyPoints}
        tracks={vtsTracks}
        vessels={anaisVessels}
      />
    </MapContainer>
  )
}
