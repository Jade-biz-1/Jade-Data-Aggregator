# utils/debug/verify_security_headers.py

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

# These are the security headers we expect to see in the response.
# You should customize this list based on your application's security policy.
EXPECTED_HEADERS = {
    "content-security-policy": "default-src 'self'",
    "strict-transport-security": "max-age=31536000; includeSubDomains",
    "x-content-type-options": "nosniff",
    "x-frame-options": "SAMEORIGIN",
    "x-xss-protection": "1; mode=block",
    "referrer-policy": "strict-origin-when-cross-origin",
}

async def check_security_headers():
    """
    Makes a request to the root of the application and verifies the presence
    and correctness of expected security headers.
    """
    print("--- Security Headers Verification ---")
    print(f"Targeting base URL: {BASE_URL}")

    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(BASE_URL)

            print(f"\nResponse status code: {response.status_code}")
            print("\n--- Verifying Security Headers ---")

            headers = {k.lower(): v for k, v in response.headers.items()}
            all_found = True

            for header, expected_value in EXPECTED_HEADERS.items():
                if header in headers:
                    print(f"  [FOUND] '{header}': {headers[header]}")
                    # Optional: You can add more specific value checks here
                    if expected_value.lower() not in headers[header].lower():
                        print(f"    **\n                    WARNING: Header value does not contain expected substring '{expected_value}'\n    **")
                else:
                    print(f"  [MISSING] '{header}' was not found in the response.")
                    all_found = False
            
            if all_found:
                print("\n--- \n                Verification Successful ---")
                print("  All expected security headers were found.")
                print("-------------------------------------\\n")
            else:
                print("\n--- \n                Verification Failed ---")
                print("  One or more security headers were missing.")
                print("  Please review your application's middleware configuration.")
                print("-----------------------------\\n")


    except httpx.RequestError as e:
        print(f"\n**\n        ERROR: Request failed: {e}\n        **")
        print("  Is the backend server running?")

async def main():
    await check_security_headers()

if __name__ == "__main__":
    asyncio.run(main())
