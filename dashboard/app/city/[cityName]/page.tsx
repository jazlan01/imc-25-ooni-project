"use client";

import { use, useState, useEffect } from "react";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { OutageChart } from "@/components/outage-chart";
import dynamic from "next/dynamic";
import { ArrowLeft, MapPin, Activity, Globe, Navigation, Calendar } from "lucide-react";

// Dynamically import CityMap to avoid SSR issues with Leaflet
const CityMap = dynamic(() => import("@/components/city-map").then((mod) => ({ default: mod.CityMap })), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[500px] rounded-lg border border-border flex items-center justify-center bg-muted/50">
      <p className="text-muted-foreground">Loading map...</p>
    </div>
  ),
});

type TimeRange = "7d" | "30d" | "90d" | "1y";

interface CityPageProps {
  params: Promise<{ cityName: string }>;
}

// CSV data interface
interface ThroughputData {
  date: string;
  dateShort: string;
  throughput?: number;
  zScore: number | null;
  zLossRate: number | null;
  fullDate: string;
  timestamp: number;
}

// Load CSV data from public folder
async function loadCSVData(cityId: string): Promise<ThroughputData[]> {
  try {
    // Try to load city-specific CSV, fallback to bhubaneswar if not found
    const csvPath = `/data/${cityId}_rolling_zscore.csv`;
    const response = await fetch(csvPath);
    
    if (!response.ok) {
      // Fallback to bhubaneswar data
      const fallbackResponse = await fetch('/data/bhubaneswar_rolling_zscore.csv');
      if (!fallbackResponse.ok) {
        throw new Error('CSV file not found');
      }
      const text = await fallbackResponse.text();
      return parseCSV(text);
    }
    
    const text = await response.text();
    return parseCSV(text);
  } catch (error) {
    console.error('Error loading CSV data:', error);
    // Return empty array or generate mock data as fallback
    return generateMockData();
  }
}

// Parse CSV text into data array
function parseCSV(csvText: string): ThroughputData[] {
  const lines = csvText.trim().split('\n');
  const headers = lines[0].split(',');
  const data: ThroughputData[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',');
    if (values.length < headers.length) continue;

    const row: Record<string, string> = {};
    headers.forEach((header, index) => {
      row[header.trim()] = values[index]?.trim() || '';
    });

    const dateStr = row.Date;
    // Parse z90MeanThroughputMbps column - handle empty strings and whitespace
    const zScoreValue = row.z90MeanThroughputMbps?.trim();
    const zScore = zScoreValue && zScoreValue !== '' ? parseFloat(zScoreValue) : null;
    const zLossRateValue = row.z90LossRate?.trim();
    const zLossRate = zLossRateValue && zLossRateValue !== '' ? parseFloat(zLossRateValue) : null;

    if (!dateStr) continue;
    
    // Skip rows where z-score is null/empty (we're plotting z90MeanThroughputMbps z-scores)
    if (zScore === null || isNaN(zScore)) continue;

    const date = new Date(dateStr);
    const dateShort = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    // If date string doesn't include time, just use the date
    const dateFull = dateStr.includes('T') || dateStr.includes(' ') 
      ? `${dateShort} ${date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}`
      : dateShort;

    data.push({
      date: dateFull,
      dateShort: dateShort,
      throughput: zScore, // Plot z-score as the main value
      zScore: zScore,
      zLossRate: zLossRate,
      fullDate: dateStr,
      timestamp: date.getTime(),
    });
  }

  return data;
}

// Generate mock data as fallback
function generateMockData(): ThroughputData[] {
  const data: ThroughputData[] = [];
  const now = new Date();

  for (let i = 30; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    
    const zScore = (Math.random() - 0.5) * 5; // Random z-score between -2.5 and 2.5
    const zLossRate = (Math.random() - 0.5) * 5; // Random z-score for loss rate
    
    const dateShort = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    const dateFull = `${dateShort} ${date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}`;

    data.push({
      date: dateFull,
      dateShort: dateShort,
      throughput: Math.round(zScore * 100) / 100, // Plot z-score as the main value
      zScore: Math.round(zScore * 100) / 100,
      zLossRate: Math.round(zLossRate * 100) / 100,
      fullDate: date.toISOString().split('T')[0],
      timestamp: date.getTime(),
    });
  }

  return data;
}

function getCityDisplayName(cityId: string): string {
  const cityMap: Record<string, string> = {
    "new-york": "New York",
    "london": "London",
    "tokyo": "Tokyo",
    "paris": "Paris",
    "sydney": "Sydney",
    "dubai": "Dubai",
    "singapore": "Singapore",
    "mumbai": "Mumbai",
    "bhubaneswar": "Bhubaneswar",
  };
  return cityMap[cityId] || cityId.charAt(0).toUpperCase() + cityId.slice(1).replace(/-/g, " ");
}

interface CityInfo {
  lat: number;
  lng: number;
  name: string;
  country: string;
  region?: string;
  timezone?: string;
}

function getCityInfo(cityId: string): CityInfo {
  const cityData: Record<string, CityInfo> = {
    "new-york": { 
      lat: 40.7128, 
      lng: -74.0060, 
      name: "New York", 
      country: "United States",
      region: "New York",
      timezone: "America/New_York"
    },
    "london": { 
      lat: 51.5074, 
      lng: -0.1278, 
      name: "London", 
      country: "United Kingdom",
      region: "England",
      timezone: "Europe/London"
    },
    "tokyo": { 
      lat: 35.6762, 
      lng: 139.6503, 
      name: "Tokyo", 
      country: "Japan",
      region: "Kantō",
      timezone: "Asia/Tokyo"
    },
    "paris": { 
      lat: 48.8566, 
      lng: 2.3522, 
      name: "Paris", 
      country: "France",
      region: "Île-de-France",
      timezone: "Europe/Paris"
    },
    "sydney": { 
      lat: -33.8688, 
      lng: 151.2093, 
      name: "Sydney", 
      country: "Australia",
      region: "New South Wales",
      timezone: "Australia/Sydney"
    },
    "dubai": { 
      lat: 25.2048, 
      lng: 55.2708, 
      name: "Dubai", 
      country: "United Arab Emirates",
      region: "Dubai",
      timezone: "Asia/Dubai"
    },
    "singapore": { 
      lat: 1.3521, 
      lng: 103.8198, 
      name: "Singapore", 
      country: "Singapore",
      timezone: "Asia/Singapore"
    },
    "mumbai": { 
      lat: 19.0760, 
      lng: 72.8777, 
      name: "Mumbai", 
      country: "India",
      region: "Maharashtra",
      timezone: "Asia/Kolkata"
    },
    "bhubaneswar": {
      lat: 20.2961,
      lng: 85.8245,
      name: "Bhubaneswar",
      country: "India",
      region: "Odisha",
      timezone: "Asia/Kolkata"
    },
  };
  return cityData[cityId] || { lat: 0, lng: 0, name: getCityDisplayName(cityId), country: "Unknown" };
}

export default function CityPage({ params }: CityPageProps) {
  const { cityName } = use(params);
  const [timeRange, setTimeRange] = useState<TimeRange>("7d");
  const [throughputData, setThroughputData] = useState<ThroughputData[]>([]);
  const [loading, setLoading] = useState(true);

  // Load CSV data on mount
  useEffect(() => {
    loadCSVData(cityName).then((data) => {
      setThroughputData(data);
      setLoading(false);
    });
  }, [cityName]);

  const displayName = getCityDisplayName(cityName);
  const cityInfo = getCityInfo(cityName);
  const cityCoordinates = { lat: cityInfo.lat, lng: cityInfo.lng, name: cityInfo.name };

  return (
    <div className="flex min-h-screen bg-zinc-50 font-sans dark:bg-black">
      <main className="flex w-full flex-col py-8 px-4 sm:px-8 max-w-7xl mx-auto">
        {/* Breadcrumb */}
        <div className="mb-6">
          <div className="flex items-center gap-2">
            <Link href="/">
              <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Cities
              </Button>
            </Link>
            <span className="text-muted-foreground">/</span>
            <span className="text-sm font-medium text-foreground">{displayName}</span>
          </div>
        </div>

        {/* Hero Section */}
        <Card className="mb-8">
          <div className="flex flex-col lg:flex-row gap-8 p-8 items-stretch">
            {/* Left side: Location info and details */}
            <div className="flex flex-col gap-6 flex-1 min-w-0">
              {/* City Header */}
              <div className="flex items-start gap-4">
                <div className="flex items-center justify-center w-14 h-14 rounded-lg bg-primary/10 dark:bg-primary/20 shrink-0">
                  <MapPin className="h-7 w-7 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <h1 className="text-4xl font-bold tracking-tight text-foreground mb-1">
                    {displayName}
                  </h1>
                  <div className="flex flex-wrap items-center gap-3 text-muted-foreground mb-3">
                    <div className="flex items-center gap-1.5">
                      <Globe className="h-4 w-4" />
                      <span className="text-sm font-medium">{cityInfo.country}</span>
                    </div>
                    {cityInfo.region && cityInfo.region !== cityInfo.name && (
                      <>
                        <span className="text-muted-foreground">•</span>
                        <span className="text-sm">{cityInfo.region}</span>
                      </>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Activity className="h-4 w-4 shrink-0" />
                    <span className="text-sm">Network outage monitoring and analytics</span>
                  </div>
                </div>
              </div>

              {/* Location Details Grid */}
              <div className="flex gap-4 pt-2">
                <div className="flex flex-col gap-1.5 px-4 py-3 rounded-lg bg-muted/50 w-[200px]">
                  <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                    <Navigation className="h-3.5 w-3.5" />
                    Coordinates
                  </div>
                  <div className="text-sm font-semibold">
                    {cityInfo.lat.toFixed(4)}, {cityInfo.lng.toFixed(4)}
                  </div>
                </div>
                {cityInfo.timezone && (
                  <div className="flex flex-col gap-1.5 px-4 py-3 rounded-lg bg-muted/50 w-[200px]">
                    <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                      <Calendar className="h-3.5 w-3.5" />
                      Timezone
                    </div>
                    <div className="text-sm font-semibold truncate">
                      {cityInfo.timezone.split('/')[1] || cityInfo.timezone}
                    </div>
                  </div>
                )}
              </div>
              
              {/* Time Range Options */}
              <div className="pt-2">
                <h3 className="text-sm font-semibold mb-4">Time Range</h3>
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant={timeRange === "7d" ? "default" : "outline"}
                    onClick={() => setTimeRange("7d")}
                    size="sm"
                  >
                    7 Days
                  </Button>
                  <Button
                    variant={timeRange === "30d" ? "default" : "outline"}
                    onClick={() => setTimeRange("30d")}
                    size="sm"
                  >
                    30 Days
                  </Button>
                  <Button
                    variant={timeRange === "90d" ? "default" : "outline"}
                    onClick={() => setTimeRange("90d")}
                    size="sm"
                  >
                    90 Days
                  </Button>
                  <Button
                    variant={timeRange === "1y" ? "default" : "outline"}
                    onClick={() => setTimeRange("1y")}
                    size="sm"
                  >
                    1 Year
                  </Button>
                </div>
              </div>
            </div>

            {/* Right side: Map - dynamic width, aligned right */}
            <div className="flex flex-col items-end lg:items-end">
              <div className="w-full lg:w-[400px] xl:w-[450px] shrink-0 bg-muted/20 rounded-lg overflow-hidden border border-border" style={{ height: '300px', minHeight: '300px', minWidth: '300px' }}>
                <CityMap city={cityCoordinates} height="300px" />
              </div>
            </div>
          </div>
        </Card>

        {/* Graph - Full width, prominent (CURRENT) */}
        <Card className="flex flex-col min-h-[600px]" style={{ paddingTop: 0, paddingBottom: 0 }}>
          <CardHeader className="shrink-0 pt-6">
            <CardTitle>Network Throughput Z-Score Analytics</CardTitle>
            <CardDescription>
              Z-score of mean throughput (z90MeanThroughputMbps) with anomaly regions highlighted (z-score &lt; -2 or &gt; 2)
            </CardDescription>
          </CardHeader>
          <CardContent className="flex-1 min-h-0 overflow-visible px-6 pb-4" style={{ minHeight: '500px', height: '500px' }}>
            {loading ? (
              <div className="flex items-center justify-center h-[500px]">
                <p className="text-muted-foreground">Loading data...</p>
              </div>
            ) : (
              <OutageChart data={throughputData.map(d => ({
                date: d.date,
                dateShort: d.dateShort,
                throughput: d.throughput ?? undefined, // Plot z90MeanThroughputMbps as the main value
                zScore: d.zScore, // Use z90MeanThroughputMbps for anomaly detection
                fullDate: d.fullDate,
                timestamp: d.timestamp,
              }))} />
            )}
          </CardContent>
        </Card>

        
        
      </main>
    </div>
  );
}

