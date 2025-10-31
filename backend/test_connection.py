"""Quick test script to verify OONI API connection"""
import asyncio
from ooni_client import OONIClient


async def test_connection():
    """Test connection to OONI API"""
    client = OONIClient()
    
    try:
        print("Testing OONI API connection...")
        measurements = await client.get_measurements(limit=1)
        
        if measurements and "results" in measurements:
            print("✅ Connection successful!")
            print(f"✅ Retrieved {len(measurements['results'])} measurement(s)")
            if measurements["results"]:
                first = measurements["results"][0]
                print(f"✅ Sample measurement: {first.get('test_name', 'N/A')} from {first.get('probe_cc', 'N/A')}")
        else:
            print("⚠️  Connection successful but no results")
            
    except Exception as e:
        print(f"❌ Connection failed: {e}")
    finally:
        await client.close()


if __name__ == "__main__":
    asyncio.run(test_connection())

