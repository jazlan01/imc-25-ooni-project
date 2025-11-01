"use client";

import { useEffect } from "react";
import { MapContainer, TileLayer, Marker, Circle, useMap } from "react-leaflet";
import L from "leaflet";

interface CityCoordinates {
  lat: number;
  lng: number;
  name: string;
  id: string;
}

interface CitiesMapProps {
  cities: CityCoordinates[];
  height?: string;
}

// Create a custom modern marker icon
const createCustomIcon = (color: string = "#3b82f6") => {
  return L.divIcon({
    className: "custom-marker",
    html: `
      <div style="
        position: relative;
        width: 32px;
        height: 32px;
      ">
        <div style="
          position: absolute;
          top: 0;
          left: 0;
          width: 32px;
          height: 32px;
          background-color: ${color};
          border-radius: 50% 50% 50% 0;
          transform: rotate(-45deg);
          border: 3px solid white;
          box-shadow: 0 2px 12px rgba(0,0,0,0.15);
        "></div>
        <div style="
          position: absolute;
          top: 4px;
          left: 4px;
          width: 18px;
          height: 18px;
          background-color: white;
          border-radius: 50%;
          transform: rotate(45deg);
          display: flex;
          align-items: center;
          justify-content: center;
        "></div>
      </div>
    `,
    iconSize: [32, 32],
    iconAnchor: [16, 32],
  });
};

// Component to fit map bounds to show all cities
function MapBounds({ cities }: { cities: CityCoordinates[] }) {
  const map = useMap();
  
  useEffect(() => {
    if (cities.length > 0) {
      const bounds = L.latLngBounds(cities.map(city => [city.lat, city.lng]));
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [map, cities]);
  
  return null;
}

export function CitiesMap({ cities, height = "500px" }: CitiesMapProps) {
  // Calculate center point (average of all cities)
  const centerLat = cities.reduce((sum, city) => sum + city.lat, 0) / cities.length;
  const centerLng = cities.reduce((sum, city) => sum + city.lng, 0) / cities.length;
  const center: [number, number] = [centerLat, centerLng];

  return (
    <div className="w-full rounded-lg overflow-hidden border border-border" style={{ height }}>
      <MapContainer
        center={center}
        zoom={2}
        scrollWheelZoom={true}
        style={{ height: "100%", width: "100%" }}
        className="z-0"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
          subdomains="abcd"
        />
        <MapBounds cities={cities} />
        
        {cities.map((city) => (
          <div key={city.id}>
            {/* Translucent red circle around each city */}
            <Circle
              center={[city.lat, city.lng]}
              radius={50000} // 50km radius
              pathOptions={{
                fillColor: "#ef4444",
                fillOpacity: 0.2,
                color: "#ef4444",
                weight: 2,
                opacity: 0.5,
              }}
            />
            {/* City marker */}
            <Marker position={[city.lat, city.lng]} icon={createCustomIcon("#ef4444")} />
          </div>
        ))}
      </MapContainer>
    </div>
  );
}

