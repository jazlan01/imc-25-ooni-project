"""Quick test script to verify M-Lab BigQuery connection"""
from mlab_client import MLabClient


def test_connection():
    """Test connection to M-Lab BigQuery"""
    client = MLabClient()
    
    try:
        print("Testing M-Lab BigQuery connection...")
        
        # Try to get a small sample
        measurements = client.get_ndt_measurements(limit=1)
        
        if measurements and "results" in measurements:
            print("✅ Connection successful!")
            print(f"✅ Retrieved {measurements['count']} measurement(s)")
            if measurements['results']:
                first = measurements['results'][0]
                print(f"✅ Sample measurement from {first.get('country_code', 'N/A')}")
                print(f"   Test ID: {first.get('test_id', 'N/A')[:20]}...")
        else:
            print("⚠️  Connection successful but no results")
            
    except Exception as e:
        print(f"❌ Connection failed: {e}")
        print("\nNote: You may need to set up Google Cloud credentials.")
        print("Options:")
        print("1. Set GOOGLE_APPLICATION_CREDENTIALS environment variable:")
        print("   export GOOGLE_APPLICATION_CREDENTIALS=/path/to/service-account-key.json")
        print("2. Use gcloud CLI:")
        print("   gcloud auth application-default login")
        print("3. Set GOOGLE_CLOUD_PROJECT environment variable:")


if __name__ == "__main__":
    test_connection()

