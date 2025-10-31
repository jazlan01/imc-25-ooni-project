# OONI Backend Server

Backend server for fetching and processing data from the Open Observatory of Network Interference (OONI).

## Features

- RESTful API for querying OONI measurements
- Filter measurements by test name, country, date range
- Async/await support for high performance
- CORS enabled for frontend integration

## Setup

1. **Activate the conda environment**:
```bash
conda activate privgpt
```

2. **Install dependencies**:
```bash
cd backend
pip install -r requirements.txt
```

3. **Configure environment** (optional):
```bash
cp .env.example .env
# Edit .env with your settings
```

## Running the Server

### Development mode:
```bash
conda activate privgpt
python main.py
```

Or using uvicorn directly:
```bash
conda activate privgpt
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### Production mode:
```bash
uvicorn main:app --host 0.0.0.0 --port 8000 --workers 4
```

The API will be available at `http://localhost:8000`

## API Endpoints

### `GET /`
Root endpoint with API information

### `GET /health`
Health check endpoint

### `GET /api/v1/measurements`
Fetch measurements from OONI API

**Query Parameters:**
- `test_name` (optional): Filter by test name (e.g., `web_connectivity`)
- `probe_cc` (optional): Filter by country code (e.g., `US`, `GB`)
- `since` (optional): Start date in `YYYY-MM-DD` format
- `until` (optional): End date in `YYYY-MM-DD` format
- `limit` (optional): Number of results (1-1000, default: 100)
- `offset` (optional): Pagination offset (default: 0)

**Example:**
```bash
curl "http://localhost:8000/api/v1/measurements?test_name=web_connectivity&probe_cc=US&limit=10"
```

### `GET /api/v1/tests`
Get list of available test types from OONI

### `GET /api/v1/countries`
Get list of countries with available measurements

## API Documentation

Once the server is running, visit:
- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`

## OONI API Information

- OONI API Base URL: https://api.ooni.io
- API Documentation: https://api.ooni.io/
- Data Documentation: https://docs.ooni.org/data/

## Example Usage

### Using Python:
```python
import httpx

async with httpx.AsyncClient() as client:
    response = await client.get(
        "http://localhost:8000/api/v1/measurements",
        params={
            "test_name": "web_connectivity",
            "probe_cc": "US",
            "limit": 10
        }
    )
    data = response.json()
    print(data)
```

### Using cURL:
```bash
curl "http://localhost:8000/api/v1/measurements?test_name=web_connectivity&limit=5"
```

## Testing OONI Connection

You can test the OONI client connection:
```bash
conda activate privgpt
python test_connection.py
```

Or test the client directly:
```bash
python ooni_client.py
```

This will fetch sample measurements and display available tests and countries.

