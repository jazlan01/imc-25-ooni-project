import { Card, CardContent } from "@/components/ui/card";
import { CitiesMapWrapper } from "@/components/cities-map-wrapper";
import { CitiesTable } from "@/components/cities-table";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";

// Generate mock latest outage dates for cities
function generateLatestOutage(): Date | null {
  // 70% chance of having a recent outage
  if (Math.random() > 0.3) {
    const now = new Date();
    // Random outage between 5 minutes and 7 days ago
    const hoursAgo = Math.random() * 24 * 7;
    const outageTime = new Date(now.getTime() - hoursAgo * 60 * 60 * 1000);
    return outageTime;
  }
  return null;
}

// City data with coordinates and countries for table and map
const cityData = [
  { name: "New York", id: "new-york", lat: 40.7128, lng: -74.0060, country: "United States", latestOutage: generateLatestOutage() },
  { name: "London", id: "london", lat: 51.5074, lng: -0.1278, country: "United Kingdom", latestOutage: generateLatestOutage() },
  { name: "Tokyo", id: "tokyo", lat: 35.6762, lng: 139.6503, country: "Japan", latestOutage: generateLatestOutage() },
  { name: "Paris", id: "paris", lat: 48.8566, lng: 2.3522, country: "France", latestOutage: generateLatestOutage() },
  { name: "Sydney", id: "sydney", lat: -33.8688, lng: 151.2093, country: "Australia", latestOutage: generateLatestOutage() },
  { name: "Dubai", id: "dubai", lat: 25.2048, lng: 55.2708, country: "United Arab Emirates", latestOutage: generateLatestOutage() },
  { name: "Singapore", id: "singapore", lat: 1.3521, lng: 103.8198, country: "Singapore", latestOutage: generateLatestOutage() },
  { name: "Mumbai", id: "mumbai", lat: 19.0760, lng: 72.8777, country: "India", latestOutage: generateLatestOutage() },
  { name: "Bhubaneswar", id: "bhubaneswar", lat: 20.2961, lng: 85.8245, country: "India", latestOutage: generateLatestOutage() },
];

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header />
      
      <main className="flex-1">
        {/* Content Section */}
        <section className="container py-12 px-6">
          <div className="mx-auto max-w-6xl space-y-12">
            {/* Map Section */}
            <div>
              <div className="mb-4">
                <h2 className="text-2xl font-semibold tracking-tight mb-2">Global Outages</h2>
                <p className="text-muted-foreground">Interactive map showing all monitored cities from the M-Lab Dataset</p>
              </div>
              <Card className="overflow-hidden py-0">
                <CardContent className="p-0">
                  <CitiesMapWrapper cities={cityData} height="500px" />
                </CardContent>
              </Card>
            </div>

            {/* Table Section */}
            <div>
              <div className="mb-4">
                <h2 className="text-2xl font-semibold tracking-tight mb-2">Cities Overview</h2>
                <p className="text-muted-foreground">Browse and sort cities by various criteria</p>
              </div>
              <Card className="py-0">
                <CardContent className="p-0">
                  <CitiesTable cities={cityData} />
                </CardContent>
              </Card>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
