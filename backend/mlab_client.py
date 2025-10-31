"""
M-Lab API Client for fetching network measurement data from Google BigQuery
"""
from typing import Optional, Dict, List, Any
from datetime import datetime, timedelta
import os
from google.cloud import bigquery
from google.cloud.exceptions import GoogleCloudError


class MLabClient:
    """Client for interacting with M-Lab datasets via BigQuery"""
    
    def __init__(self, project_id: Optional[str] = None, credentials_path: Optional[str] = None):
        """
        Initialize M-Lab BigQuery client
        
        Args:
            project_id: Google Cloud project ID (optional, can use default)
            credentials_path: Path to service account JSON key file (optional)
        """
        self.project_id = project_id or os.getenv("GOOGLE_CLOUD_PROJECT")
        self.credentials_path = credentials_path or os.getenv("GOOGLE_APPLICATION_CREDENTIALS")
        
        # Initialize BigQuery client
        try:
            if self.credentials_path and os.path.exists(self.credentials_path):
                self.client = bigquery.Client.from_service_account_json(
                    self.credentials_path,
                    project=self.project_id
                )
            else:
                # Try to use default credentials or create client without credentials
                # For public datasets, this might work
                self.client = bigquery.Client(project=self.project_id)
        except Exception as e:
            # If credentials fail, try without them (for public datasets)
            self.client = bigquery.Client()
    
    def _execute_query(self, query: str, limit: int = 100) -> List[Dict[str, Any]]:
        """
        Execute a BigQuery query and return results
        
        Args:
            query: SQL query string
            limit: Maximum number of results
        
        Returns:
            List of result dictionaries
        """
        try:
            # Add LIMIT if not present
            if "LIMIT" not in query.upper():
                query = f"{query} LIMIT {limit}"
            
            query_job = self.client.query(query)
            results = query_job.result()
            
            # Convert to list of dictionaries
            rows = []
            for row in results:
                rows.append(dict(row))
            
            return rows
        except GoogleCloudError as e:
            raise Exception(f"BigQuery error: {str(e)}")
        except Exception as e:
            raise Exception(f"Query execution error: {str(e)}")
    
    def get_ndt_measurements(
        self,
        start_date: Optional[str] = None,
        end_date: Optional[str] = None,
        country_code: Optional[str] = None,
        min_download_speed: Optional[float] = None,
        max_download_speed: Optional[float] = None,
        limit: int = 100
    ) -> Dict[str, Any]:
        """
        Fetch NDT (Network Diagnostic Tool) measurements from M-Lab
        
        Args:
            start_date: Start date in YYYY-MM-DD format (defaults to yesterday)
            end_date: End date in YYYY-MM-DD format (defaults to yesterday)
            country_code: Filter by country code (e.g., 'US', 'GB')
            min_download_speed: Minimum download speed in Mbps
            max_download_speed: Maximum download speed in Mbps
            limit: Maximum number of results
        
        Returns:
            Dictionary containing measurements and metadata
        """
        # Default to yesterday if no date specified
        if not start_date:
            yesterday = (datetime.now() - timedelta(days=1)).strftime("%Y-%m-%d")
            start_date = yesterday
        if not end_date:
            end_date = start_date
        
        # Build query
        query = """
        SELECT
            test_id,
            DATE(test_date) as test_date,
            client.Geo.CountryCode as country_code,
            client.Geo.CountryName as country_name,
            client.Geo.Region as region,
            server.Geo.CountryCode as server_country_code,
            download_speed_mbps,
            upload_speed_mbps,
            download_speed_mbps IS NOT NULL as has_download,
            upload_speed_mbps IS NOT NULL as has_upload,
            MINRTT,
            MeanRTT,
            server.Machine AS server_machine,
            client.IP AS client_ip,
            web100_log_entry.snap.Duration
        FROM
            `measurement-lab.ndt.unified_downloads`
        WHERE
            DATE(test_date) BETWEEN DATE('{}') AND DATE('{}')
        """.format(start_date, end_date)
        
        # Add filters
        if country_code:
            query += f" AND client.Geo.CountryCode = '{country_code.upper()}'"
        
        if min_download_speed is not None:
            query += f" AND download_speed_mbps >= {min_download_speed}"
        
        if max_download_speed is not None:
            query += f" AND download_speed_mbps <= {max_download_speed}"
        
        query += f" ORDER BY test_date DESC"
        
        try:
            rows = self._execute_query(query, limit)
            
            return {
                "dataset": "ndt.unified_downloads",
                "count": len(rows),
                "date_range": {
                    "start": start_date,
                    "end": end_date
                },
                "results": rows
            }
        except Exception as e:
            raise Exception(f"Error fetching NDT measurements: {str(e)}")
    
    def get_available_countries(self, limit: int = 100) -> List[Dict[str, str]]:
        """
        Get list of countries with available measurements
        
        Args:
            limit: Maximum number of countries to return
        
        Returns:
            List of country dictionaries
        """
        # Get unique countries from recent data
        yesterday = (datetime.now() - timedelta(days=1)).strftime("%Y-%m-%d")
        
        query = f"""
        SELECT DISTINCT
            client.Geo.CountryCode as country_code,
            client.Geo.CountryName as country_name
        FROM
            `measurement-lab.ndt.unified_downloads`
        WHERE
            DATE(test_date) = DATE('{yesterday}')
            AND client.Geo.CountryCode IS NOT NULL
        ORDER BY country_code
        LIMIT {limit}
        """
        
        try:
            rows = self._execute_query(query, limit)
            return rows
        except Exception as e:
            # Return fallback list if query fails
            return [
                {"country_code": "US", "country_name": "United States"},
                {"country_code": "GB", "country_name": "United Kingdom"},
                {"country_code": "DE", "country_name": "Germany"},
            ]
    
    def get_statistics(
        self,
        start_date: Optional[str] = None,
        end_date: Optional[str] = None,
        country_code: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Get aggregated statistics for M-Lab measurements
        
        Args:
            start_date: Start date in YYYY-MM-DD format
            end_date: End date in YYYY-MM-DD format
            country_code: Filter by country code
        
        Returns:
            Dictionary with statistics
        """
        if not start_date:
            yesterday = (datetime.now() - timedelta(days=1)).strftime("%Y-%m-%d")
            start_date = yesterday
        if not end_date:
            end_date = start_date
        
        query = """
        SELECT
            COUNT(*) as total_tests,
            COUNTIF(download_speed_mbps IS NOT NULL) as tests_with_download,
            COUNTIF(upload_speed_mbps IS NOT NULL) as tests_with_upload,
            AVG(download_speed_mbps) as avg_download_mbps,
            AVG(upload_speed_mbps) as avg_upload_mbps,
            MIN(download_speed_mbps) as min_download_mbps,
            MAX(download_speed_mbps) as max_download_mbps,
            APPROX_QUANTILES(download_speed_mbps, 100)[OFFSET(50)] as median_download_mbps
        FROM
            `measurement-lab.ndt.unified_downloads`
        WHERE
            DATE(test_date) BETWEEN DATE('{}') AND DATE('{}')
        """.format(start_date, end_date)
        
        if country_code:
            query += f" AND client.Geo.CountryCode = '{country_code.upper()}'"
        
        try:
            rows = self._execute_query(query, 1)
            if rows:
                return rows[0]
            return {}
        except Exception as e:
            raise Exception(f"Error fetching statistics: {str(e)}")
    
    def get_measurement_by_id(self, test_id: str) -> Dict[str, Any]:
        """
        Get a specific measurement by test ID
        
        Args:
            test_id: M-Lab test ID
        
        Returns:
            Measurement details
        """
        query = f"""
        SELECT
            *
        FROM
            `measurement-lab.ndt.unified_downloads`
        WHERE
            test_id = '{test_id}'
        LIMIT 1
        """
        
        try:
            rows = self._execute_query(query, 1)
            if rows:
                return rows[0]
            return {}
        except Exception as e:
            raise Exception(f"Error fetching measurement: {str(e)}")


# Example usage
if __name__ == "__main__":
    client = MLabClient()
    
    try:
        print("Fetching M-Lab NDT measurements...")
        measurements = client.get_ndt_measurements(limit=5)
        
        print(f"Found {measurements['count']} measurements")
        if measurements['results']:
            print(f"Sample: {measurements['results'][0]}")
        
        # Get countries
        print("\nFetching available countries...")
        countries = client.get_available_countries(limit=10)
        print(f"Found {len(countries)} countries")
        
        # Get statistics
        print("\nFetching statistics...")
        stats = client.get_statistics()
        print(f"Statistics: {stats}")
        
    except Exception as e:
        print(f"Error: {e}")
        print("\nNote: You may need to set up Google Cloud credentials.")
        print("Set GOOGLE_APPLICATION_CREDENTIALS environment variable or")
        print("configure gcloud CLI: gcloud auth application-default login")

