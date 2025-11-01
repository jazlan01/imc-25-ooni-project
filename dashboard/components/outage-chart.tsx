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

interface OutageData {
  date: string;
  dateShort?: string;
  hour?: string;
  availability?: number;
  throughput?: number;
  zScore?: number | null;
  fullDate: string;
  timestamp?: number;
}

interface OutageChartProps {
  data: OutageData[];
}

// Custom tooltip component for better styling
const CustomTooltip = ({ active, payload, label, isThroughput = false }: {
  active?: boolean;
  payload?: Array<{ name: string; value: number; color: string; dataKey: string }>;
  label?: string;
  isThroughput?: boolean;
}) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-background border border-border rounded-lg shadow-lg p-3">
        <p className="font-semibold text-sm mb-2">{label}</p>
        {payload.map((entry, index: number) => (
          <p key={index} className="text-sm" style={{ color: entry.color }}>
            <span className="font-medium">{entry.name}:</span> {isThroughput ? entry.value.toFixed(3) : entry.value}
            {entry.dataKey === "availability" && "%"}
            {entry.dataKey === "throughput" && !isThroughput && " Mbps"}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

// Chart component that can be reused in both normal and expanded views
function ChartContent({ data, averageValue, anomalyRegions, showDots, height = "500px", isThroughput = false }: {
  data: OutageData[];
  averageValue: number;
  anomalyRegions: Array<{ start: number; end: number }>;
  showDots: boolean;
  height?: string;
  isThroughput?: boolean;
}) {
  // Parse height to get numeric value for minHeight
  const heightValue = typeof height === 'string' ? parseInt(height) : height;
  
  // Calculate value range for bars to span full height
  const values = data.map(d => d.throughput ?? d.availability ?? 0);
  const maxValue = Math.max(...values);
  const minValue = Math.min(...values);
  
  // For z-score values, use absolute padding
  // For availability or other values, use absolute padding
  let yDomainMin, yDomainMax;
  if (isThroughput) {
    // For z-score - values typically range from -5 to 5, sometimes wider
    const padding = (maxValue - minValue) * 0.1 || 1; // 10% padding or min 1
    yDomainMin = Math.floor(minValue - padding);
    yDomainMax = Math.ceil(maxValue + padding);
  } else {
    // For availability or other values
    yDomainMin = Math.max(0, Math.floor(minValue - 5));
    yDomainMax = Math.ceil(maxValue + 5);
  }
  
  // Calculate bar value that spans from bottom to top of the fixed domain
  // Bars start from 0, so we use yDomainMax to ensure they reach the top
  const barValue = yDomainMax;
  
  // Create data with vertical bar markers and shaded area values
  const dataWithBars = data.map((item, index) => {
    // Check if this index is a boundary of any region
    const isBoundary = anomalyRegions.some(region => 
      region.start === index || region.end === index
    );
    // Check if this index is inside an anomaly region
    const isInAnomaly = anomalyRegions.some(region => 
      index >= region.start && index <= region.end
    );
    // For shaded areas: use max domain value for visible shading
    const shadedAreaValue = isInAnomaly ? yDomainMax : null;
    
    return {
      ...item,
      // Set bar value to span the full height - always show bars for boundaries
      // verticalBar: isBoundary ? barValue : null,
      verticalBar : null,
      // Shaded area value - for loss rate, use a value that creates visible shading
      shadedArea: shadedAreaValue,
    };
  });
  
  // Parse height properly for ResponsiveContainer
  const containerHeight = typeof height === 'string' && height.includes('px') 
    ? parseInt(height.replace('px', ''), 10) 
    : (typeof height === 'string' && height === '100%' ? 600 : (heightValue || 500));
  
  const responsiveHeight = height === '100%' ? '100%' : containerHeight;
  
  return (
    <div className="w-full overflow-visible flex flex-col" style={{ height: height === '100%' ? '100%' : `${containerHeight}px`, minHeight: containerHeight, minWidth: 0 }}>
      <ResponsiveContainer width="100%" height={responsiveHeight} minHeight={containerHeight} minWidth={300}>
          <ComposedChart
          data={dataWithBars}
          margin={{ top: 10, right: 100, left: 30, bottom: 60 }}
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
            label={{ value: isThroughput ? "Z-Score (z90MeanThroughputMbps)" : "Availability (%)", angle: -90, position: "insideLeft" }}
            className="text-xs"
            tick={{ fill: "currentColor" }}
            domain={[yDomainMin, yDomainMax]}
            allowDataOverflow={false}
          />
          
          <Tooltip content={<CustomTooltip isThroughput={isThroughput} />} />
          <Legend />
          
          {/* Vertical red bars using Bar component - visible for both availability and loss rate */}
          <Bar
            yAxisId="left"
            dataKey="verticalBar"
            fill="#ef4444"
            stroke="#ef4444"
            strokeWidth={0.5}
            maxBarSize={isThroughput ? 8 : 0.5}
            radius={[0, 0, 0, 0]}
            isAnimationActive={true}
            legendType="none"
            fillOpacity={0.3}
          />
          
          {/* Data line */}
          <Line
            yAxisId="left"
            type="monotone"
            dataKey={isThroughput ? "throughput" : "availability"}
            stroke="#3b82f6"
            strokeWidth={2}
            dot={showDots ? { r: 4, fill: "#3b82f6" } : false}
            activeDot={{ r: 6, fill: "#3b82f6" }}
            name={isThroughput ? "Z-Score (z90MeanThroughputMbps)" : "Availability (%)"}
          />
          
          {/* Red shaded regions using Area component - data-driven approach */}
          <Area
            yAxisId="left"
            type="monotone"
            dataKey="shadedArea"
            fill="#ef4444"
            fillOpacity={0.2}
            stroke="none"
            isAnimationActive={false}
            legendType="none"
            connectNulls={false}
            baseValue={yDomainMin}
          />
          
          {/* Reference line showing average */}
          <ReferenceLine
            yAxisId="left"
            y={Math.round(averageValue)}
            stroke="#6b7280"
            strokeWidth={1.5}
            strokeDasharray="3 3"
            strokeOpacity={0.5}
            label={{ 
              value: isThroughput ? `Avg: ${averageValue.toFixed(3)}` : `Avg: ${averageValue.toFixed(1)}%`, 
              position: "right", 
              fill: "#6b7280", 
              fontSize: 12,
              offset: 15
            }}
          />
          
          {!isThroughput && (
            /* Reference line showing outage threshold (95%) */
            <ReferenceLine
              yAxisId="left"
              y={95}
              stroke="#f59e0b"
              strokeWidth={1.5}
              strokeDasharray="3 3"
              strokeOpacity={0.7}
              label={{ 
                value: `Threshold: 95%`, 
                position: "right", 
                fill: "#f59e0b", 
                fontSize: 12,
                offset: 10
              }}
            />
          )}
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}

export function OutageChart({ data }: OutageChartProps) {
  const [open, setOpen] = useState(false);
  
  // Determine if we're using throughput data or availability data
  const isThroughput = data.length > 0 && data[0].throughput !== undefined;
  
  // Calculate average value
  const averageValue = data.reduce((sum, item) => {
    const value = isThroughput ? (item.throughput ?? 0) : (item.availability ?? 0);
    return sum + value;
  }, 0) / data.length;

  // Find contiguous regions where z-score is outside [-2, 2] for throughput, or availability < 95%
  const anomalyRegions: Array<{ start: number; end: number }> = [];
  let regionStart: number | null = null;

  data.forEach((item, index) => {
    let isAnomaly = false;
    
    if (isThroughput) {
      // For throughput: anomaly when z-score < -2 or > 2
      if (item.zScore !== null && item.zScore !== undefined) {
        isAnomaly = item.zScore < -1.5 || item.zScore > 1.5;
      }
    } else {
      // For availability: anomaly when < 95%
      const availability = item.availability ?? 0;
      isAnomaly = availability < 95;
    }
    
    if (isAnomaly && regionStart === null) {
      regionStart = index;
    } else if (!isAnomaly && regionStart !== null) {
      anomalyRegions.push({ start: regionStart, end: index - 1 });
      regionStart = null;
    }
  });

  // Close any open region at the end
  if (regionStart !== null) {
    anomalyRegions.push({ start: regionStart, end: data.length - 1 });
  }

  // Debug: Log anomalies found and data sample
  console.log(`Average ${isThroughput ? 'throughput' : 'availability'}: ${averageValue.toFixed(2)}${isThroughput ? ' Mbps' : '%'}`);
  console.log(`Found ${anomalyRegions.length} anomaly regions:`, anomalyRegions);
  if (anomalyRegions.length > 0 && data.length > 0) {
    const firstAnomaly = anomalyRegions[0];
    console.log(`First anomaly dates:`, {
      startDate: data[firstAnomaly.start].date,
      endDate: data[firstAnomaly.end].date,
      startValue: isThroughput ? data[firstAnomaly.start].throughput : data[firstAnomaly.start].availability,
      endValue: isThroughput ? data[firstAnomaly.end].throughput : data[firstAnomaly.end].availability
    });
  }

  // Hide dots if there are too many data points
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
          averageValue={averageValue}
          anomalyRegions={anomalyRegions}
          showDots={showDots}
          height="450px"
          isThroughput={isThroughput}
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
          <DialogTitle>{isThroughput ? 'Throughput Chart' : 'Outage Chart'} - Expanded View</DialogTitle>
          <DialogDescription>
            {isThroughput 
              ? 'Interactive throughput visualization with z-score anomaly regions highlighted (z < -2 or z > 2)'
              : 'Interactive availability visualization with outage regions highlighted'}
          </DialogDescription>
        </DialogHeader>
        <div className="flex-1 min-h-0 overflow-visible" style={{ height: 'calc(85vh - 120px)', minHeight: '500px' }}>
          <ChartContent
            data={data}
            averageValue={averageValue}
            anomalyRegions={anomalyRegions}
            showDots={showDots}
            height="100%"
            isThroughput={isThroughput}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}

