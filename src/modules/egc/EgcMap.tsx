import { useEffect } from 'react'
import { MapContainer, TileLayer, Circle, Rectangle, Popup, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import type { EgcFormState } from './types'
import { isFormValid } from './egcCoder'
import { NAVAREA_BOUNDS } from './navareas'

const NM_TO_METERS = 1852

interface ZoneLayerProps {
  form: EgcFormState
}

function FitBounds({ bounds }: { bounds: L.LatLngBoundsExpression | null }) {
  const map = useMap()
  useEffect(() => {
    if (bounds) {
      map.fitBounds(bounds, { padding: [40, 40] })
    }
  }, [map, bounds])
  return null
}

function ZoneLayer({ form }: ZoneLayerProps) {
  if (!isFormValid(form)) return null

  const lat = parseInt(form.lat, 10)
  const lon = parseInt(form.lon, 10)
  const latSigned = form.latHemi === 'S' ? -lat : lat
  const lonSigned = form.lonHemi === 'W' ? -lon : lon

  if (form.c2 === '14' || form.c2 === '44') {
    const radiusM = parseInt(form.radius, 10) * NM_TO_METERS
    const center: [number, number] = [latSigned, lonSigned]
    const bounds = L.latLng(center).toBounds(radiusM * 2)
    return (
      <>
        <FitBounds bounds={bounds} />
        <Circle
          center={center}
          radius={radiusM}
          pathOptions={{ color: '#3b82f6', fillColor: '#3b82f6', fillOpacity: 0.15, weight: 2 }}
        >
          <Popup>
            <span className="text-xs">
              Centre : {form.lat}°{form.latHemi} {form.lon}°{form.lonHemi}<br />
              Rayon : {parseInt(form.radius, 10)} nm ({radiusM.toLocaleString()} m)
            </span>
          </Popup>
        </Circle>
      </>
    )
  }

  if (form.c2 === '34') {
    const height = parseInt(form.height, 10)
    const width = parseInt(form.width, 10)
    const sw: [number, number] = [latSigned, lonSigned]
    const ne: [number, number] = [latSigned + height, lonSigned + width]
    return (
      <>
        <FitBounds bounds={[sw, ne]} />
        <Rectangle
          bounds={[sw, ne]}
          pathOptions={{ color: '#22c55e', fillColor: '#22c55e', fillOpacity: 0.15, weight: 2 }}
        >
          <Popup>
            <span className="text-xs">
              Coin SW : {form.lat}°{form.latHemi} {form.lon}°{form.lonHemi}<br />
              Hauteur : {height}° | Largeur : {width}°
            </span>
          </Popup>
        </Rectangle>
      </>
    )
  }

  if (form.c2 === '31') {
    const key = form.navarea.padStart(2, '0')
    const info = NAVAREA_BOUNDS[key]
    if (!info) return null
    return (
      <>
        <FitBounds bounds={info.bounds} />
        <Rectangle
          bounds={info.bounds}
          pathOptions={{ color: '#f59e0b', fillColor: '#f59e0b', fillOpacity: 0.1, weight: 2, dashArray: '6 4' }}
        >
          <Popup>
            <span className="text-xs">
              {info.name}<br />
              Coordinateur : {info.coordinator}<br />
              <em>Limites approximatives — à titre indicatif uniquement</em>
            </span>
          </Popup>
        </Rectangle>
      </>
    )
  }

  return null
}

interface EgcMapProps {
  form: EgcFormState
}

export default function EgcMap({ form }: EgcMapProps) {
  const showGlobal = form.c2 === '00'

  return (
    <div className="relative w-full h-full">
      <MapContainer
        center={[48, -5]}
        zoom={showGlobal ? 2 : 5}
        className="w-full h-full"
        zoomControl
      >
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/">CARTO</a>'
          subdomains="abcd"
          maxZoom={19}
        />
        <ZoneLayer form={form} />
      </MapContainer>

      {showGlobal && (
        <div className="absolute bottom-3 left-3 z-[500] bg-slate-900/90 text-amber-400 text-xs px-3 py-1.5 rounded pointer-events-none">
          Appel global — tous navires couverts par le satellite sélectionné
        </div>
      )}

      {!isFormValid(form) && form.c2 !== '00' && (
        <div className="absolute bottom-3 left-3 z-[500] bg-slate-900/90 text-slate-400 text-xs px-3 py-1.5 rounded pointer-events-none">
          Renseignez les coordonnées pour visualiser la zone
        </div>
      )}
    </div>
  )
}
