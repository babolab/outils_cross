import { LayerGroup, LayersControl, TileLayer, useMapEvents } from 'react-leaflet'
import type { ControlPosition } from 'leaflet'

// Esri World Ocean basemap (bathymetry + labels), no API key required.
// Dark variant is rendered client-side via the `.basemap-dark-ocean` CSS filter (see index.css).
// Replaces CARTO dark_all, which now requires an API key.
const ESRI_OCEAN = 'https://server.arcgisonline.com/ArcGIS/rest/services/Ocean'
const ATTRIBUTION = 'Tiles &copy; Esri &mdash; GEBCO, NOAA, National Geographic, DeLorme, HERE, Geonames.org'

const DARK = 'Océan sombre'
const LIGHT = 'Océan clair'
const STORAGE_KEY = 'basemap'

function readChoice(): string {
  try {
    return localStorage.getItem(STORAGE_KEY) === LIGHT ? LIGHT : DARK
  } catch {
    return DARK
  }
}

// Remember the user's basemap choice across maps and sessions
function PersistChoice() {
  useMapEvents({
    baselayerchange: (e) => {
      try {
        localStorage.setItem(STORAGE_KEY, e.name)
      } catch {
        // storage unavailable: choice simply isn't remembered
      }
    },
  })
  return null
}

function OceanLayers({ className }: { className?: string }) {
  return (
    <LayerGroup>
      <TileLayer
        url={`${ESRI_OCEAN}/World_Ocean_Base/MapServer/tile/{z}/{y}/{x}`}
        attribution={ATTRIBUTION}
        className={className}
        maxNativeZoom={16}
        maxZoom={19}
      />
      <TileLayer
        url={`${ESRI_OCEAN}/World_Ocean_Reference/MapServer/tile/{z}/{y}/{x}`}
        className={className}
        maxNativeZoom={16}
        maxZoom={19}
      />
    </LayerGroup>
  )
}

export function DarkOceanBasemap({ position = 'topright' }: { position?: ControlPosition }) {
  const choice = readChoice()
  return (
    <>
      <LayersControl position={position}>
        <LayersControl.BaseLayer name={DARK} checked={choice === DARK}>
          <OceanLayers className="basemap-dark-ocean" />
        </LayersControl.BaseLayer>
        <LayersControl.BaseLayer name={LIGHT} checked={choice === LIGHT}>
          <OceanLayers />
        </LayersControl.BaseLayer>
      </LayersControl>
      <PersistChoice />
    </>
  )
}
