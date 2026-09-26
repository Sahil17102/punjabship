import { Box, CircularProgress, IconButton, Tooltip } from '@mui/material'
import L, { type LatLngExpression, type LatLngLiteral, Marker as LeafletMarker } from 'leaflet'
import 'leaflet/dist/leaflet.css'
import React, { useRef, useState } from 'react'
import { MdMyLocation } from 'react-icons/md'
import { MapContainer, Marker, Popup, TileLayer, useMap } from 'react-leaflet'

// ⬇️ CSS for radar pulse and icon
const radarCSS = `
.radar-marker-wrapper {
  position: relative;
  width: 40px;
  height: 40px;
  transform: translate(-50%, -100%);
}

.radar-pulse {
  position: absolute;
  width: 60px;
  height: 60px;
  top: -10px;
  left: -10px;
  border-radius: 50%;
  background: rgba(33, 150, 243, 0.3);
  animation: radar-ping 2s infinite;
}

.marker-pin {
  position: absolute;
  width: 25px;
  height: 41px;
  background-image: url("https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png");
  background-size: contain;
  background-repeat: no-repeat;
  top: 0;
  left: 7px;
}

@keyframes radar-ping {
  0% {
    transform: scale(0.7);
    opacity: 1;
  }
  70% {
    transform: scale(1.3);
    opacity: 0;
  }
  100% {
    transform: scale(0.7);
    opacity: 0;
  }
}
`

const getCustomRadarIcon = () =>
  L.divIcon({
    className: '',
    html: `
      <div class="radar-marker-wrapper">
        <div class="radar-pulse"></div>
        <div class="marker-pin"></div>
      </div>
    `,
    iconSize: [40, 40],
    iconAnchor: [20, 40],
  })

const CurrentLocationButton = ({
  setCoords,
}: {
  setCoords?: (coords: LatLngLiteral) => void
  draggable?: boolean
}) => {
  const map = useMap()
  const [loading, setLoading] = useState(false)

  const locateUser = () => {
    setLoading(true)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords
        const newCoords = { lat: latitude, lng: longitude }
        setCoords?.(newCoords)
        map.setView(newCoords, map.getZoom())
        setLoading(false)
      },
      () => {
        alert('Failed to fetch location')
        setLoading(false)
      },
    )
  }

  return (
    <Tooltip title="Use Current Location">
      <Box
        sx={{
          position: 'absolute',
          top: 16,
          right: 16,
          zIndex: 1000,
          bgcolor: 'white',
          borderRadius: '50%',
          boxShadow: 2,
        }}
      >
        <IconButton onClick={locateUser}>
          {loading ? <CircularProgress size={20} /> : <MdMyLocation />}
        </IconButton>
      </Box>
    </Tooltip>
  )
}

interface MapViewerProps {
  coords: LatLngLiteral
  setCoords?: (coords: LatLngLiteral) => void
  height?: string
  draggable?: boolean
  zoom?: number
  currentLocation?: boolean
  width?: string
  popupText?: string
}

const MapViewer: React.FC<MapViewerProps> = ({
  coords,
  setCoords,
  height = '400px',
  width = '100%',
  draggable = true,
  zoom = 13,
  currentLocation = true,
  popupText = 'Drag to set location',
}) => {
  const markerRef = useRef<LeafletMarker>(null)

  const handleMarkerDrag = () => {
    const marker = markerRef.current
    if (marker) {
      const position = marker.getLatLng()
      setCoords?.({ lat: position.lat, lng: position.lng })
    }
  }

  return (
    <>
      <style>{radarCSS}</style>
      <Box
        sx={{
          height,
          width: width,
          position: 'relative',
          borderRadius: 2,
          overflow: 'hidden',
          boxShadow: 2,
        }}
      >
        <MapContainer
          center={[coords.lat, coords.lng] as LatLngExpression}
          zoom={zoom}
          scrollWheelZoom
          style={{ height: '100%', width: '100%' }}
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution="&copy; OpenStreetMap contributors"
          />

          <Marker
            ref={markerRef}
            position={[coords.lat, coords.lng]}
            icon={getCustomRadarIcon()}
            draggable={draggable}
            autoPan={false}
            eventHandlers={{ dragend: handleMarkerDrag }}
          >
            <Popup>{popupText}</Popup>
          </Marker>

          {currentLocation ? <CurrentLocationButton setCoords={setCoords} /> : null}
        </MapContainer>
      </Box>
    </>
  )
}

export default MapViewer
