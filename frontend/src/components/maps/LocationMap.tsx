'use client'

import { useEffect, useMemo } from 'react'
import L from 'leaflet'
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  useMap,
  useMapEvents,
} from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import {
  TOGO_MAP_CENTER,
  DEFAULT_MAP_ZOOM,
  DETAIL_MAP_ZOOM,
  type MapMarker,
} from '@/lib/geo-utils'

// Corrige les icônes Leaflet sous Webpack / Next.js
const markerIcon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
})

function MapClickHandler({
  onPositionChange,
}: {
  onPositionChange: (lat: number, lng: number) => void
}) {
  useMapEvents({
    click(e) {
      onPositionChange(e.latlng.lat, e.latlng.lng)
    },
  })
  return null
}

function MapViewController({
  lat,
  lng,
  zoom,
}: {
  lat: number
  lng: number
  zoom: number
}) {
  const map = useMap()
  useEffect(() => {
    map.setView([lat, lng], zoom, { animate: true })
  }, [lat, lng, zoom, map])
  return null
}

function FitMarkersBounds({ markers }: { markers: MapMarker[] }) {
  const map = useMap()
  useEffect(() => {
    if (markers.length < 2) return
    const bounds = L.latLngBounds(markers.map((m) => [m.lat, m.lng]))
    map.fitBounds(bounds, { padding: [40, 40], maxZoom: DETAIL_MAP_ZOOM })
  }, [markers, map])
  return null
}

export type LocationMapProps = {
  latitude?: number | null
  longitude?: number | null
  markers?: MapMarker[]
  interactive?: boolean
  onPositionChange?: (lat: number, lng: number) => void
  height?: string
  className?: string
}

export function LocationMap({
  latitude,
  longitude,
  markers: markersProp,
  interactive = false,
  onPositionChange,
  height = '280px',
  className = '',
}: LocationMapProps) {
  const markers = useMemo(() => {
    if (markersProp && markersProp.length > 0) return markersProp
    if (latitude != null && longitude != null && (latitude !== 0 || longitude !== 0)) {
      return [{ lat: latitude, lng: longitude }]
    }
    return []
  }, [markersProp, latitude, longitude])

  const center = useMemo<[number, number]>(() => {
    if (markers.length > 0) return [markers[0].lat, markers[0].lng]
    return [TOGO_MAP_CENTER.lat, TOGO_MAP_CENTER.lng]
  }, [markers])

  const zoom =
    markers.length === 0
      ? DEFAULT_MAP_ZOOM
      : markers.length === 1
        ? DETAIL_MAP_ZOOM
        : DEFAULT_MAP_ZOOM

  const primary = markers[0]

  return (
    <div
      className={`location-map-wrapper ${className}`}
      style={{ height, minHeight: height }}
      aria-label="Carte OpenStreetMap"
    >
      <MapContainer
        center={center}
        zoom={zoom}
        scrollWheelZoom={interactive}
        className="h-full w-full rounded-xl z-0"
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <MapViewController lat={center[0]} lng={center[1]} zoom={zoom} />
        {markers.length > 1 && <FitMarkersBounds markers={markers} />}
        {interactive && onPositionChange && (
          <MapClickHandler onPositionChange={onPositionChange} />
        )}
        {markers.map((m) => (
          <Marker
            key={m.id ?? `${m.lat}-${m.lng}-${m.label ?? ''}`}
            position={[m.lat, m.lng]}
            icon={markerIcon}
          >
            {m.label && <Popup>{m.label}</Popup>}
          </Marker>
        ))}
        {interactive && !primary && (
          <p className="sr-only">Cliquez sur la carte pour placer un marqueur</p>
        )}
      </MapContainer>
      {interactive && (
        <p className="text-xs text-[var(--color-muted)] mt-1 px-1">
          Cliquez sur la carte pour choisir un point, ou utilisez le bouton GPS.
        </p>
      )}
    </div>
  )
}
