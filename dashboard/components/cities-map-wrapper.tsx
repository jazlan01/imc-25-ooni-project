"use client";

import dynamic from "next/dynamic";

// Dynamically import CitiesMap to avoid SSR issues with Leaflet
const CitiesMap = dynamic(() => import("@/components/cities-map").then((mod) => ({ default: mod.CitiesMap })), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[500px] rounded-lg border border-border flex items-center justify-center bg-muted/50">
      <p className="text-muted-foreground">Loading map...</p>
    </div>
  ),
});

interface CityCoordinates {
  lat: number;
  lng: number;
  name: string;
  id: string;
}

interface CitiesMapWrapperProps {
  cities: CityCoordinates[];
  height?: string;
}

export function CitiesMapWrapper({ cities, height = "500px" }: CitiesMapWrapperProps) {
  return <CitiesMap cities={cities} height={height} />;
}

