"use client";

import React, { useState } from "react";
import {
  ComposedChart,
  Line,
  Area,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  ReferenceLine,
  ReferenceArea,
} from "recharts";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Maximize2 } from "lucide-react";

interface WeatherData {
  date: string;
  dateShort?: string;
  hour?: string;
  temperature: number;
  humidity?: number;
  windSpeed?: number;
  fullDate: string;
  timestamp?: number;
}

interface TemperatureChartProps {
  data: WeatherData[];
}

// Custom tooltip component for better styling
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-background border border-border rounded-lg shadow-lg p-3">
        <p className="font-semibold text-sm mb-2">{label}</p>
        {payload.map((entry: any, index: number) => (
          <p key={index} className="text-sm" style={{ color: entry.color }}>
            <span className="font-medium">{entry.name}:</span> {entry.value}
            {entry.dataKey === "temperature" && "°C"}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

// Chart component that can be reused in both normal and expanded views
function ChartContent({ data, averageTemp, aboveAverageRegions, showDots, height = "500px" }: {
  data: WeatherData[];
  averageTemp: number;
  aboveAverageRegions: Array<{ start: number; end: number }>;
  showDots: boolean;
  height?: string;
}) {
  // Parse height to get numeric value for minHeight
  const heightValue = typeof height === 'string' ? parseInt(height) : height;
  
  // Calculate temperature range for bars to span full height
  const maxTemp = Math.max(...data.map(d => d.temperature));
  const minTemp = Math.min(...data.map(d => d.temperature));
  // Fixed domain bounds - use clean rounding to avoid weird decimals
  const yDomainMin = Math.max(0, Math.floor(minTemp - 2));
  const yDomainMax = Math.ceil(maxTemp + 2);
  // Calculate bar value that spans from bottom to top of the fixed domain
  // Bars start from 0 (or domain min), so we need value that spans full visible height
  // Since domain is [yDomainMin, yDomainMax], bar should go from yDomainMin to yDomainMax
  // But bars default to starting at 0, so we use yDomainMax to ensure it reaches the top
  const barValue = yDomainMax; // Bars will render from 0 to yDomainMax, visible portion is yDomainMin to yDomainMax
  
  // Create data with vertical bar markers and shaded area values
  const dataWithBars = data.map((item, index) => {
    // Check if this index is a boundary of any region
    const isBoundary = aboveAverageRegions.some(region => 
      region.start === index || region.end === index
    );
    // Check if this index is inside an above-average region
    const isInRegion = aboveAverageRegions.some(region => 
      index >= region.start && index <= region.end
    );
    // For shaded areas: return a high value if in region, null otherwise
    const shadedAreaValue = isInRegion ? yDomainMax : null;
    
    return {
      ...item,
      // Set bar value to span the full height
      verticalBar: isBoundary ? barValue : null,
      // Shaded area value - returns max domain value for regions, null otherwise
      shadedArea: shadedAreaValue,
    };
  });
  
  return (
    <div className="w-full overflow-visible flex flex-col" style={{ height: heightValue || '500px', minHeight: heightValue || 500, minWidth: 0 }}>
      <ResponsiveContainer width="100%" height="100%" minHeight={heightValue || 500} minWidth={300}>
        <ComposedChart
          data={dataWithBars}
          margin={{ top: 10, right: 80, left: 30, bottom: 60 }}
        >
          <CartesianGrid strokeDasharray="3 3" className="stroke-zinc-300 dark:stroke-zinc-700" />
          <XAxis
            dataKey="date"
            type="category"
            className="text-xs"
            tick={{ fill: "currentColor", fontSize: 10 }}
            angle={-45}
            textAnchor="end"
            height={60}
            interval="preserveStartEnd"
          />
          <YAxis
            yAxisId="left"
            label={{ value: "Temperature (°C)", angle: -90, position: "insideLeft" }}
            className="text-xs"
            tick={{ fill: "currentColor" }}
            domain={[yDomainMin, yDomainMax]}
            allowDataOverflow={false}
          />
          
          <Tooltip content={<CustomTooltip />} />
          <Legend />
          
          {/* Vertical red bars using Bar component - thinner, full height */}
          <Bar
            yAxisId="left"
            dataKey="verticalBar"
            fill="#ef4444"
            stroke="#ef4444"
            strokeWidth={0.25}
            maxBarSize={0.5}
            radius={[0, 0, 0, 0]}
            isAnimationActive={true}
            legendType="none"
            fillOpacity={0.1}
          />
          
          {/* Temperature line */}
          <Line
            yAxisId="left"
            type="monotone"
            dataKey="temperature"
            stroke="#3b82f6"
            strokeWidth={2}
            dot={showDots ? { r: 4, fill: "#3b82f6" } : false}
            activeDot={{ r: 6, fill: "#3b82f6" }}
            name="Temperature (°C)"
          />
          
          {/* Gray shaded regions using Area component - data-driven approach */}
          <Area
            yAxisId="left"
            type="monotone"
            dataKey="shadedArea"
            fill="#9ca3af"
            fillOpacity={0.2}
            stroke="none"
            isAnimationActive={false}
            legendType="none"
            connectNulls={false}
            baseValue={yDomainMin}
          />
          
          {/* Reference line showing average temperature */}
          <ReferenceLine
            yAxisId="left"
            y={Math.round(averageTemp)}
            stroke="#6b7280"
            strokeWidth={1.5}
            strokeDasharray="3 3"
            strokeOpacity={0.5}
            label={{ 
              value: `Avg: ${averageTemp.toFixed(1)}°C`, 
              position: "right", 
              fill: "#6b7280", 
              fontSize: 12,
              offset: 15
            }}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}

export function TemperatureChart({ data }: TemperatureChartProps) {
  const [open, setOpen] = useState(false);
  // Calculate average temperature
  const averageTemp = data.reduce((sum, item) => sum + item.temperature, 0) / data.length;

  // Find contiguous regions where temperature is above average
  const aboveAverageRegions: Array<{ start: number; end: number }> = [];
  let regionStart: number | null = null;

  data.forEach((item, index) => {
    const isAboveAverage = item.temperature > averageTemp;
    
    if (isAboveAverage && regionStart === null) {
      regionStart = index;
    } else if (!isAboveAverage && regionStart !== null) {
      aboveAverageRegions.push({ start: regionStart, end: index - 1 });
      regionStart = null;
    }
  });

  // Close any open region at the end
  if (regionStart !== null) {
    aboveAverageRegions.push({ start: regionStart, end: data.length - 1 });
  }

  // Debug: Log regions found and data sample
  console.log(`Average temperature: ${averageTemp.toFixed(2)}°C`);
  console.log(`Found ${aboveAverageRegions.length} above-average regions:`, aboveAverageRegions);
  if (aboveAverageRegions.length > 0 && data.length > 0) {
    const firstRegion = aboveAverageRegions[0];
    console.log(`First region dates:`, {
      startDate: data[firstRegion.start].date,
      endDate: data[firstRegion.end].date,
      startTemp: data[firstRegion.start].temperature,
      endTemp: data[firstRegion.end].temperature
    });
  }
  if (data.length > 0) {
    console.log(`Sample data dates:`, data.slice(0, 3).map(d => d.date));
  }

  // Hide dots if there are too many data points (hourly data)
  const showDots = data.length <= 50;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <div className="relative w-full h-full min-h-[500px] overflow-visible flex flex-col">
        <DialogTrigger asChild>
          <Button
            variant="outline"
            size="icon"
            className="absolute top-2 right-2 z-10 bg-background/90 backdrop-blur-sm hover:bg-background shadow-sm"
            aria-label="Expand chart"
          >
            <Maximize2 className="h-4 w-4" />
          </Button>
        </DialogTrigger>
        
      {/* Regular chart view */}
      <div className="flex-1 min-h-0" style={{ height: '450px', minHeight: '450px', minWidth: '300px' }}>
        <ChartContent
          data={data}
          averageTemp={averageTemp}
          aboveAverageRegions={aboveAverageRegions}
          showDots={showDots}
          height="450px"
        />
      </div>
      </div>

      <DialogContent 
        className="w-[98vw] max-h-[85vh] h-[85vh] m-0 p-6 flex flex-col gap-4 rounded-lg shadow-2xl"
        style={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          maxWidth: 'calc(100vw - 2rem)',
        }}
      >
        <DialogHeader className="shrink-0">
          <DialogTitle>Temperature Chart - Expanded View</DialogTitle>
          <DialogDescription>
            Interactive temperature visualization with above-average regions highlighted
          </DialogDescription>
        </DialogHeader>
        <div className="flex-1 min-h-0 overflow-visible">
          <ChartContent
            data={data}
            averageTemp={averageTemp}
            aboveAverageRegions={aboveAverageRegions}
            showDots={showDots}
            height="100%"
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}

