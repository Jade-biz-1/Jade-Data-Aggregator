# utils/debug/reset_password_raw.py

import getpass
import os
import sys

# Add the project root to the Python path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..')))

from backend.core.security import get_password_hash

def generate_password_hash():
    """
    Takes a raw password string and prints its hashed version.
    
    This is useful for manually updating a user's password directly in the database
    when you need to generate a valid hash.
    """
    print("--- Raw Password Hash Generator ---")
    print("This utility generates a password hash suitable for the database.")
    
    password = getpass.getpass("Enter the password to hash: ")
    
    if not password:
        print("Password cannot be empty.")
        return
        
    # Generate the hash
    hashed_password = get_password_hash(password)
    
    print("\n--- Hashed Password ---")
    print(hashed_password)
    print("-----------------------\n")
    print("You can now use this hash to manually update the 'hashed_password' column")
    print("for a user in the database.")

if __name__ == "__main__":
    generate_password_hash()
