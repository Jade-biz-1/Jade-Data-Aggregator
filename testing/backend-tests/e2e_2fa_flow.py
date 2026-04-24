"""
VER-002: End-to-end 2FA enforcement test.
Exercises the full flow against a running local stack at http://localhost:8001.
"""
import sys
import requests
import pyotp

BASE = "http://localhost:8001/api/v1"
PASS = "\033[32m[PASS]\033[0m"
FAIL = "\033[31m[FAIL]\033[0m"

failures = []


def check(label, condition, extra=""):
    if condition:
        print(f"{PASS} {label}")
    else:
        print(f"{FAIL} {label}" + (f" — {extra}" if extra else ""))
        failures.append(label)


def get_csrf(session):
    r = session.get(f"{BASE}/auth/csrf-token")
    assert r.status_code == 200, f"csrf-token failed: {r.status_code} {r.text}"
    token = r.json()["csrf_token"]
    session.headers.update({"X-CSRF-Token": token})
    return token


def login(session, username, password):
    get_csrf(session)
    r = session.post(
        f"{BASE}/auth/login",
        data={"username": username, "password": password},
    )
    return r


def bearer(token):
    return {"Authorization": f"Bearer {token}"}


print("\n=== VER-002: 2FA E2E Test ===\n")

# --- Step 1: baseline login (no 2FA) ---
s = requests.Session()
r = login(s, "admin", "admin123!")
check("Step 1: baseline login succeeds (200)", r.status_code == 200,
      f"code={r.status_code} data={r.json()}")
if r.status_code != 200:
    print("Cannot continue without baseline login — aborting.")
    sys.exit(1)
full_token = r.json()["access_token"]
check("Step 1: no requires_2fa in baseline response",
      r.json().get("requires_2fa") is None,
      str(r.json()))

# --- Step 2: CSRF token ---
s2 = requests.Session()
get_csrf(s2)
check("Step 2: CSRF token obtained", True)

# --- Step 3: 2FA setup ---
s2.headers.update(bearer(full_token))
get_csrf(s2)
r = s2.post(f"{BASE}/auth/2fa/setup")
check("Step 3: 2FA setup returns 200", r.status_code == 200,
      f"code={r.status_code} data={r.text[:200]}")
if r.status_code != 200:
    print("Cannot continue without 2FA setup — aborting.")
    sys.exit(1)
setup_data = r.json()
check("Step 3: setup response has secret", "secret" in setup_data, str(setup_data))
secret = setup_data["secret"]

# --- Step 4: enable 2FA ---
totp = pyotp.TOTP(secret)
code = totp.now()
get_csrf(s2)
r = s2.post(f"{BASE}/auth/2fa/enable", json={"code": code})
check("Step 4: 2FA enable returns 200", r.status_code == 200,
      f"code={r.status_code} data={r.text[:200]}")
if r.status_code != 200:
    print("Cannot continue without 2FA enabled — aborting.")
    sys.exit(1)
recovery_codes = r.json().get("recovery_codes", [])
check("Step 4: recovery codes returned", len(recovery_codes) > 0, str(r.json()))

# --- Step 5: login with 2FA enabled → partial token + requires_2fa ---
s3 = requests.Session()
r = login(s3, "admin", "admin123!")
check("Step 5: login returns 200 when 2FA enabled", r.status_code == 200,
      f"code={r.status_code} data={r.json()}")
data = r.json()
check("Step 5: requires_2fa = True in response", data.get("requires_2fa") is True,
      str(data))
partial_token = data.get("access_token", "")

# --- Step 6: partial token rejected on protected endpoint ---
s4 = requests.Session()
get_csrf(s4)
s4.headers.update(bearer(partial_token))
r = s4.get(f"{BASE}/users/me")
check("Step 6: partial token rejected (401 or 403)", r.status_code in (401, 403),
      f"code={r.status_code}")

# --- Step 7: bad TOTP code rejected ---
s5 = requests.Session()
get_csrf(s5)
r = s5.post(f"{BASE}/auth/2fa/verify",
            json={"partial_token": partial_token, "code": "000000"})
check("Step 7: bad TOTP returns 401", r.status_code == 401,
      f"code={r.status_code} data={r.text[:200]}")

# --- Step 8: correct TOTP → full token ---
s6 = requests.Session()
get_csrf(s6)
code = totp.now()
r = s6.post(f"{BASE}/auth/2fa/verify",
            json={"partial_token": partial_token, "code": code})
check("Step 8: correct TOTP returns 200", r.status_code == 200,
      f"code={r.status_code} data={r.text[:200]}")
if r.status_code != 200:
    print("Cannot verify full token — aborting.")
    sys.exit(1)
full_token2 = r.json()["access_token"]
check("Step 8: no requires_2fa in full token response",
      r.json().get("requires_2fa") is None, str(r.json()))

# --- Step 9: full token accepted ---
s7 = requests.Session()
get_csrf(s7)
s7.headers.update(bearer(full_token2))
r = s7.get(f"{BASE}/users/me")
check("Step 9: full token accepted (200)", r.status_code == 200,
      f"code={r.status_code}")

# --- Step 10: recovery code flow ---
if recovery_codes:
    rc = recovery_codes[0]
    # Need fresh partial token
    s8 = requests.Session()
    r_login = login(s8, "admin", "admin123!")
    pt2 = r_login.json().get("access_token", "")
    s8b = requests.Session()
    get_csrf(s8b)
    r = s8b.post(f"{BASE}/auth/2fa/recovery",
                 json={"partial_token": pt2, "recovery_code": rc})
    check("Step 10: recovery code returns 200", r.status_code == 200,
          f"code={r.status_code} data={r.text[:200]}")
    # Recovery code should be single-use
    s8c = requests.Session()
    get_csrf(s8c)
    r2 = s8c.post(f"{BASE}/auth/2fa/recovery",
                  json={"partial_token": pt2, "recovery_code": rc})
    check("Step 10: reused recovery code rejected (401)", r2.status_code == 401,
          f"code={r2.status_code}")

# --- Step 11: account lockout after repeated bad passwords ---
# Use a fresh username that won't conflict with rate-limit keys
s9 = requests.Session()
statuses = []
for i in range(6):
    r = login(s9, "admin", "WrongPassword!")
    statuses.append(r.status_code)

# The 6th attempt should have hit lockout (423) rather than rate-limit (429)
last_code = statuses[-1]
last_data = r.json()
check("Step 11: 6th bad login locked out (423 with lockout msg)",
      last_code == 423,
      f"code={last_code} data={last_data}")

# --- Step 12: disable 2FA (cleanup) ---
# Need to unlock first — login with correct password after lockout expires
# Instead, test disable via admin or skip if locked
s10 = requests.Session()
# Wait isn't feasible; attempt it — account may still be locked from step 11
# For cleanup we just need any authenticated session with full token
s10.headers.update(bearer(full_token2))
get_csrf(s10)
code = totp.now()
r = s10.post(f"{BASE}/auth/2fa/disable", json={"code": code})
check("Step 12: disable 2FA returns 200", r.status_code == 200,
      f"code={r.status_code} data={r.text[:200]}")

print(f"\n=== Results: {len(failures)} failure(s) ===")
for f in failures:
    print(f"  - {f}")

if failures:
    sys.exit(1)
