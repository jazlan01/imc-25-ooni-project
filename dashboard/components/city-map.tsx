"use client";

import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";

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
    popupAnchor: [0, -32],
  });
};

interface CityCoordinates {
  lat: number;
  lng: number;
  name: string;
}

interface MapLayer {
  id: string;
  type: "marker" | "circle" | "polygon" | "heatmap";
  data: any;
  options?: L.CircleMarkerOptions | L.PathOptions;
}

interface CityMapProps {
  city: CityCoordinates;
  zoom?: number;
  layers?: MapLayer[];
  height?: string;
}

// Component to handle map updates when city changes
function MapUpdater({ center, zoom }: { center: [number, number]; zoom: number }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, zoom);
    // Invalidate size to ensure map renders correctly
    setTimeout(() => {
      map.invalidateSize();
    }, 100);
  }, [map, center, zoom]);
  return null;
}

export function CityMap({ city, zoom = 11, layers = [], height = "500px" }: CityMapProps) {
  const [isMounted, setIsMounted] = useState(false);
  const center: [number, number] = [city.lat, city.lng];

  useEffect(() => {
    // Delay mounting to ensure container has proper dimensions
    const timer = setTimeout(() => {
      setIsMounted(true);
    }, 200);
    return () => clearTimeout(timer);
  }, []);

  const heightValue = typeof height === 'string' && height.includes('px') ? height : '300px';
  const heightNum = parseInt(heightValue.replace('px', ''), 10);
  const heightStyle = { height: heightValue, minHeight: heightValue };

  if (!isMounted) {
    return (
      <div className="w-full flex items-center justify-center bg-muted/50" style={heightStyle}>
        <p className="text-muted-foreground">Loading map...</p>
      </div>
    );
  }

  return (
    <div 
      className="w-full" 
      style={{ 
        height: `${heightNum}px`, 
        width: '100%',
        position: 'relative', 
        minHeight: `${heightNum}px`,
        minWidth: '200px'
      }}
    >
      <MapContainer
        center={center}
        zoom={zoom}
        scrollWheelZoom={true}
        style={{ 
          height: `${heightNum}px`, 
          width: "100%", 
          minHeight: `${heightNum}px`,
          minWidth: '450px'
        }}
        className="z-0"
        key={`${city.lat}-${city.lng}-${isMounted}`}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
          subdomains="abcd"
        />
        <MapUpdater center={center} zoom={zoom} />
        
        {/* Default city marker */}
        <Marker position={center} icon={createCustomIcon("#3b82f6")}>
          <Popup className="custom-popup">
            <div className="font-semibold">{city.name}</div>
            <div className="text-sm text-muted-foreground">
              {city.lat.toFixed(4)}, {city.lng.toFixed(4)}
            </div>
          </Popup>
        </Marker>

        {/* Additional layers for future data */}
        {layers.map((layer) => {
          switch (layer.type) {
            case "marker":
              return (
                <Marker key={layer.id} position={layer.data.position} {...layer.options}>
                  {layer.data.popup && <Popup>{layer.data.popup}</Popup>}
                </Marker>
              );
            case "circle":
              // For future circle/polygon layers
              // You can extend this with react-leaflet's Circle or CircleMarker
              return null;
            default:
              return null;
          }
        })}
      </MapContainer>
    </div>
  );
}

