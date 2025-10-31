"""
Backend server for OONI data processing
"""
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from typing import Optional, List
from datetime import datetime
import uvicorn

from ooni_client import OONIClient

app = FastAPI(
    title="OONI Data Processing API",
    description="Backend server for fetching and processing OONI network measurement data",
    version="1.0.0"
)

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify your frontend domain
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize OONI client
ooni_client = OONIClient()


@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "message": "OONI Data Processing API",
        "version": "1.0.0",
        "endpoints": {
            "measurements": "/api/v1/measurements",
            "tests": "/api/v1/tests",
            "countries": "/api/v1/countries",
            "health": "/health"
        }
    }


@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "timestamp": datetime.now().isoformat()}


@app.get("/api/v1/measurements")
async def get_measurements(
    test_name: Optional[str] = Query(None, description="Filter by test name (e.g., web_connectivity)"),
    probe_cc: Optional[str] = Query(None, description="Filter by country code (e.g., US, GB)"),
    since: Optional[str] = Query(None, description="Start date (YYYY-MM-DD)"),
    until: Optional[str] = Query(None, description="End date (YYYY-MM-DD)"),
    limit: int = Query(100, ge=1, le=1000, description="Number of results to return"),
    offset: int = Query(0, ge=0, description="Offset for pagination")
):
    """
    Fetch measurements from OONI API
    
    Args:
        test_name: Test name filter
        probe_cc: Country code filter
        since: Start date (YYYY-MM-DD)
        until: End date (YYYY-MM-DD)
        limit: Number of results (1-1000)
        offset: Pagination offset
    
    Returns:
        List of measurements with metadata
    """
    try:
        measurements = await ooni_client.get_measurements(
            test_name=test_name,
            probe_cc=probe_cc,
            since=since,
            until=until,
            limit=limit,
            offset=offset
        )
        return measurements
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching measurements: {str(e)}")


@app.get("/api/v1/tests")
async def get_available_tests():
    """Get list of available test types from OONI"""
    try:
        tests = await ooni_client.get_test_names()
        return {"tests": tests}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching tests: {str(e)}")


@app.get("/api/v1/countries")
async def get_countries():
    """Get list of countries with available measurements"""
    try:
        countries = await ooni_client.get_countries()
        return {"countries": countries}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching countries: {str(e)}")


if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)

