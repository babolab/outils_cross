import { TileLayer } from 'react-leaflet'

// Esri World Ocean basemap (bathymetry + labels), no API key required.
// Darkened client-side via the `.basemap-dark-ocean` CSS filter (see index.css).
// Replaces CARTO dark_all, which now requires an API key.
const ESRI_OCEAN = 'https://server.arcgisonline.com/ArcGIS/rest/services/Ocean'
const ATTRIBUTION = 'Tiles &copy; Esri &mdash; GEBCO, NOAA, National Geographic, DeLorme, HERE, Geonames.org'

export function DarkOceanBasemap() {
  return (
    <>
      <TileLayer
        url={`${ESRI_OCEAN}/World_Ocean_Base/MapServer/tile/{z}/{y}/{x}`}
        attribution={ATTRIBUTION}
        className="basemap-dark-ocean"
        maxNativeZoom={16}
        maxZoom={19}
      />
      <TileLayer
        url={`${ESRI_OCEAN}/World_Ocean_Reference/MapServer/tile/{z}/{y}/{x}`}
        className="basemap-dark-ocean"
        maxNativeZoom={16}
        maxZoom={19}
      />
    </>
  )
}
