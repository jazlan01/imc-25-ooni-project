"""
OONI API Client for fetching network measurement data
"""
import httpx
from typing import Optional, Dict, List, Any
import asyncio
from datetime import datetime


class OONIClient:
    """Client for interacting with OONI API"""
    
    def __init__(self, base_url: str = "https://api.ooni.io"):
        """
        Initialize OONI API client
        
        Args:
            base_url: Base URL for OONI API (default: https://api.ooni.io)
        """
        self.base_url = base_url
        self.api_base = f"{base_url}/api/v1"
        self.client = httpx.AsyncClient(timeout=30.0)
    
    async def __aenter__(self):
        return self
    
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        await self.client.aclose()
    
    async def close(self):
        """Close the HTTP client"""
        await self.client.aclose()
    
    async def get_measurements(
        self,
        test_name: Optional[str] = None,
        probe_cc: Optional[str] = None,
        since: Optional[str] = None,
        until: Optional[str] = None,
        limit: int = 100,
        offset: int = 0
    ) -> Dict[str, Any]:
        """
        Fetch measurements from OONI API
        
        Args:
            test_name: Filter by test name (e.g., 'web_connectivity', 'dns_consistency')
            probe_cc: Filter by country code (e.g., 'US', 'GB', 'CN')
            since: Start date (YYYY-MM-DD)
            until: End date (YYYY-MM-DD)
            limit: Number of results to return (max 1000)
            offset: Offset for pagination
        
        Returns:
            Dictionary containing measurements and metadata
        """
        params = {
            "limit": min(limit, 1000),
            "offset": offset
        }
        
        if test_name:
            params["test_name"] = test_name
        if probe_cc:
            params["probe_cc"] = probe_cc
        if since:
            params["since"] = since
        if until:
            params["until"] = until
        
        try:
            response = await self.client.get(
                f"{self.api_base}/measurements",
                params=params
            )
            response.raise_for_status()
            return response.json()
        except httpx.HTTPStatusError as e:
            raise Exception(f"HTTP error: {e.response.status_code} - {e.response.text}")
        except httpx.RequestError as e:
            raise Exception(f"Request error: {str(e)}")
    
    async def get_test_names(self) -> List[str]:
        """
        Get list of available test names
        
        Returns:
            List of test names
        """
        # Common OONI test names
        common_tests = [
            "web_connectivity",
            "http_requests",
            "dns_consistency",
            "http_invalid_request_line",
            "bridge_reachability",
            "tcp_connect",
            "http_header_field_manipulation",
            "http_host",
            "multi_protocol_traceroute",
            "meek_fronted_requests_test",
            "whatsapp",
            "facebook_messenger",
            "telegram",
            "vanilla_tor",
            "stunreachability"
        ]
        
        # Try to fetch from API, fallback to common tests
        try:
            # Fetch a sample measurement to see available tests
            response = await self.client.get(
                f"{self.api_base}/measurements",
                params={"limit": 1}
            )
            response.raise_for_status()
            return common_tests
        except Exception:
            return common_tests
    
    async def get_countries(self) -> List[Dict[str, str]]:
        """
        Get list of countries with available measurements
        
        Returns:
            List of country dictionaries with code and name
        """
        # Common country codes (can be enhanced by querying OONI API)
        # For now, return a sample list
        # You can enhance this by querying the API for unique probe_cc values
        common_countries = [
            {"code": "US", "name": "United States"},
            {"code": "GB", "name": "United Kingdom"},
            {"code": "DE", "name": "Germany"},
            {"code": "FR", "name": "France"},
            {"code": "CN", "name": "China"},
            {"code": "RU", "name": "Russia"},
            {"code": "IR", "name": "Iran"},
            {"code": "IN", "name": "India"},
            {"code": "BR", "name": "Brazil"},
            {"code": "JP", "name": "Japan"},
        ]
        
        try:
            # Fetch measurements and extract unique country codes
            response = await self.client.get(
                f"{self.api_base}/measurements",
                params={"limit": 100}
            )
            response.raise_for_status()
            data = response.json()
            
            # Extract unique country codes from results
            if "results" in data:
                countries_set = set()
                for measurement in data["results"]:
                    if "probe_cc" in measurement:
                        countries_set.add(measurement["probe_cc"])
                
                # Return sorted list
                countries = [{"code": cc, "name": cc} for cc in sorted(countries_set)]
                return countries[:50]  # Limit to first 50
        
        except Exception:
            pass
        
        return common_countries
    
    async def get_measurement_details(self, measurement_id: str) -> Dict[str, Any]:
        """
        Get detailed information about a specific measurement
        
        Args:
            measurement_id: The measurement ID
        
        Returns:
            Measurement details
        """
        try:
            response = await self.client.get(
                f"{self.api_base}/measurements/{measurement_id}"
            )
            response.raise_for_status()
            return response.json()
        except httpx.HTTPStatusError as e:
            raise Exception(f"HTTP error: {e.response.status_code} - {e.response.text}")
        except httpx.RequestError as e:
            raise Exception(f"Request error: {str(e)}")


# Example usage
async def main():
    """Example usage of OONI client"""
    client = OONIClient()
    
    try:
        # Fetch recent web connectivity measurements
        print("Fetching measurements...")
        measurements = await client.get_measurements(
            test_name="web_connectivity",
            limit=10
        )
        
        print(f"Found {len(measurements.get('results', []))} measurements")
        
        # Get available tests
        tests = await client.get_test_names()
        print(f"Available tests: {tests[:5]}...")
        
        # Get countries
        countries = await client.get_countries()
        print(f"Available countries: {len(countries)}")
        
    finally:
        await client.close()


if __name__ == "__main__":
    asyncio.run(main())

