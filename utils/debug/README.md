# Debugging and Verification Scripts

This directory contains a collection of standalone Python scripts designed for debugging, verification, and occasional administrative tasks. These scripts are intended to be run from the command line and are useful for diagnosing issues, testing specific functionalities, and performing manual data manipulations when necessary.

## Purpose

The primary goal of these scripts is to provide developers with tools to:
- Quickly test and verify specific system components (e.g., database connections, security headers, authentication logic).
- Reproduce complex issues in a controlled environment.
- Perform manual administrative tasks that are not yet exposed through the main application's UI (e.g., resetting a user's password directly).
- Debug data-related problems by inspecting and modifying the database.

## Usage

Each script is self-contained and can be run as a standalone module. Before running any script, ensure that your environment is properly configured with the necessary environment variables (e.g., database connection strings, secret keys).

Most scripts can be run using the following command:

```bash
python -m utils.debug.<script_name>
```

For example, to run the `test_admin_login.py` script:

```bash
python -m utils.debug.test_admin_login
```

**Note:** Some scripts may require additional command-line arguments. Refer to the individual script files for detailed usage instructions.

## Scripts Overview

- **`debug_admin_user.py`**: A script to inspect and debug the state of the admin user account.
- **`migrate_users_table.py`**: A utility for performing specific migrations or data transformations on the `users` table.
- **`reproduce_issue.py`**: A template for creating a script to reproduce a specific bug or issue.
- **`reset_admin_password.py`**: A script to reset the password of the primary admin account.
- **`reset_password_raw.py`**: A utility to generate a new password hash for manual database updates.
- **`test_admin_login.py`**: A script to test the admin login functionality.
- **`verify_account_lockout.py`**: A script to verify that account lockout policies are working correctly after multiple failed login attempts.
- **`verify_db_hash.py`**: A utility to verify the integrity of password hashes in the database.
- **`verify_error_sanitization.py`**: A script to check that API error responses are properly sanitized and do not leak sensitive information.
- **`verify_security_headers.py`**: A script to verify that the application is sending the correct security headers in its HTTP responses.

---
