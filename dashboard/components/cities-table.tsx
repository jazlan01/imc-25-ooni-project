"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { ArrowUpDown, ArrowUp, ArrowDown, AlertCircle } from "lucide-react";

interface City {
  name: string;
  id: string;
  lat: number;
  lng: number;
  country: string;
  latestOutage?: Date | null;
}

type SortField = "name" | "country" | "coordinates" | "latestOutage";
type SortDirection = "asc" | "desc";

interface CitiesTableProps {
  cities: City[];
}

// SortButton component defined outside to avoid React warnings
const SortButton = ({ 
  field, 
  children, 
  align = "left",
  sortField,
  sortDirection,
  onSort
}: { 
  field: SortField; 
  children: React.ReactNode; 
  align?: "left" | "right";
  sortField: SortField;
  sortDirection: SortDirection;
  onSort: (field: SortField) => void;
}) => {
  const isActive = sortField === field;
  return (
    <Button
      variant="ghost"
      size="sm"
      className={`h-8 data-[state=open]:bg-accent ${align === "right" ? "ml-auto" : ""}`}
      onClick={() => onSort(field)}
    >
      {children}
      {isActive ? (
        sortDirection === "asc" ? (
          <ArrowUp className="ml-2 h-4 w-4" />
        ) : (
          <ArrowDown className="ml-2 h-4 w-4" />
        )
      ) : (
        <ArrowUpDown className="ml-2 h-4 w-4 opacity-50" />
      )}
    </Button>
  );
};

export function CitiesTable({ cities }: CitiesTableProps) {
  const [sortField, setSortField] = useState<SortField>("latestOutage");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const sortedCities = useMemo(() => {
    const sorted = [...cities].sort((a, b) => {
      switch (sortField) {
        case "name":
          return sortDirection === "asc"
            ? a.name.localeCompare(b.name)
            : b.name.localeCompare(a.name);
        case "country":
          return sortDirection === "asc"
            ? a.country.localeCompare(b.country)
            : b.country.localeCompare(a.country);
        case "coordinates":
          // Sort by latitude first, then longitude
          if (a.lat !== b.lat) {
            return sortDirection === "asc" ? a.lat - b.lat : b.lat - a.lat;
          }
          return sortDirection === "asc" ? a.lng - b.lng : b.lng - a.lng;
        case "latestOutage":
          const aOutage = a.latestOutage?.getTime() ?? 0;
          const bOutage = b.latestOutage?.getTime() ?? 0;
          return sortDirection === "asc" ? aOutage - bOutage : bOutage - aOutage;
        default:
          return a.name.localeCompare(b.name);
      }
    });

    return sorted;
  }, [cities, sortField, sortDirection]);

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>
              <SortButton field="name" sortField={sortField} sortDirection={sortDirection} onSort={handleSort}>City</SortButton>
            </TableHead>
            <TableHead>
              <SortButton field="country" sortField={sortField} sortDirection={sortDirection} onSort={handleSort}>Country</SortButton>
            </TableHead>
            <TableHead className="text-right">
              <div className="flex justify-end">
                <SortButton field="coordinates" align="right" sortField={sortField} sortDirection={sortDirection} onSort={handleSort}>Coordinates</SortButton>
              </div>
            </TableHead>
            <TableHead className="text-right">
              <div className="flex justify-end">
                <SortButton field="latestOutage" align="right" sortField={sortField} sortDirection={sortDirection} onSort={handleSort}>Latest Outage</SortButton>
              </div>
            </TableHead>
            <TableHead className="text-right">Action</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedCities.map((city) => {
            const formatOutage = (date: Date | null | undefined) => {
              if (!date) {
                return (
                  <span className="text-muted-foreground flex items-center gap-1 justify-end">
                    <span>No recent outage</span>
                  </span>
                );
              }
              const now = new Date();
              const diffMs = now.getTime() - date.getTime();
              const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
              const diffDays = Math.floor(diffHours / 24);
              
              if (diffDays > 0) {
                return (
                  <span className="flex items-center gap-1 text-orange-600 dark:text-orange-400 justify-end">
                    <AlertCircle className="h-3.5 w-3.5" />
                    <span>{diffDays} day{diffDays !== 1 ? 's' : ''} ago</span>
                  </span>
                );
              } else if (diffHours > 0) {
                return (
                  <span className="flex items-center gap-1 text-red-600 dark:text-red-400 justify-end">
                    <AlertCircle className="h-3.5 w-3.5" />
                    <span>{diffHours} hour{diffHours !== 1 ? 's' : ''} ago</span>
                  </span>
                );
              } else {
                const diffMins = Math.floor(diffMs / (1000 * 60));
                return (
                  <span className="flex items-center gap-1 text-red-600 dark:text-red-400 justify-end">
                    <AlertCircle className="h-3.5 w-3.5" />
                    <span>{diffMins} minute{diffMins !== 1 ? 's' : ''} ago</span>
                  </span>
                );
              }
            };

            return (
              <TableRow key={city.id} className="hover:bg-muted/50">
                <TableCell className="font-medium">{city.name}</TableCell>
                <TableCell>{city.country}</TableCell>
                <TableCell className="text-right font-mono text-sm">
                  {city.lat.toFixed(4)}, {city.lng.toFixed(4)}
                </TableCell>
                <TableCell className="text-right">{formatOutage(city.latestOutage)}</TableCell>
                <TableCell className="text-right">
                  <Link href={`/city/${city.id}`}>
                    <Button variant="ghost" size="sm">
                      View Details
                    </Button>
                  </Link>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}

