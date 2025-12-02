# utils/debug/verify_error_sanitization.py

import asyncio
import httpx
import os
import sys

# Add the project root to the Python path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..')))

from backend.core.config import get_settings

# --- Configuration ---
# Assumes the backend server is running locally
BASE_URL = f"http://{get_settings().app_host}:{get_settings().app_port}"

async def check_error_responses():
    """
    Makes a series of invalid API requests to check if the error responses
    are properly sanitized and do not leak sensitive information.
    """
    print("--- API Error Sanitization Verification ---")
    print(f"Targeting base URL: {BASE_URL}")

    test_cases = [
        {
            "name": "Non-existent Endpoint",
            "method": "GET",
            "path": "/api/v1/non-existent-endpoint",
            "expected_status": 404,
        },
        {
            "name": "Invalid Input Data (for a known endpoint)",
            "method": "POST",
            "path": "/api/v1/users/", # Assuming this endpoint exists
            "json": {"invalid_field": "some_value"},
            "expected_status": 422, # Unprocessable Entity
        },
        {
            "name": "Triggering an Internal Server Error (simulated)",
            "method": "GET",
            "path": "/api/v1/debug/force-error", # A special debug endpoint that raises an exception
            "expected_status": 500,
        },
    ]

    async with httpx.AsyncClient() as client:
        for test in test_cases:
            print(f"\nRunning test: {test['name']}...")
            try:
                response = await client.request(
                    method=test["method"],
                    url=f"{BASE_URL}{test['path']}",
                    json=test.get("json"),
                )

                print(f"  Status Code: {response.status_code} (Expected: {test['expected_status']})")
                
                # Check if the response is JSON
                try:
                    data = response.json()
                    print("  Response JSON:")
                    print(f"    {data}")

                    # Security checks for production environments
                    if get_settings().environment == "production":
                        if "detail" in data and isinstance(data["detail"], str):
                            if "exception" in data["detail"].lower() or "traceback" in data["detail"].lower():
                                print("  **\n WARNING: Potential information leakage! 'exception' or 'traceback' found in response.\n **")
                        
                        if response.status_code == 500 and "Internal Server Error" not in data.get("detail", ""):
                             print("  **\n WARNING: 500 error response might be too detailed for production.\n **")

                except ValueError:
                    print("  Response is not JSON.")
                    print(f"  Response Text: {response.text}")

            except httpx.RequestError as e:
                print(f"  **\n ERROR: Request failed: {e}\n **")
                print("  Is the backend server running?")

async def main():
    # Note: For this script to work fully, you might need to add a temporary
    # debug endpoint to your FastAPI app that intentionally raises an error, e.g.:
    #
    # @router.get("/debug/force-error")
    # def force_error():
    #     raise ValueError("This is a forced error for testing.")
    
    await check_error_responses()

if __name__ == "__main__":
    asyncio.run(main())
