import os
import base64
from cryptography.fernet import Fernet
from dotenv import load_dotenv

load_dotenv()

# We need a 32-url-safe-base64-encoded key for Fernet.
# If ENCRYPTION_KEY is not in env, we will generate one dynamically for dev, 
# but in production, you MUST save the generated key in .env to persist passwords.
_env_key = os.getenv("ENCRYPTION_KEY")

if not _env_key:
    # Generate a fresh key if none exists
    _env_key = Fernet.generate_key().decode()
    print(f"WARNING: No ENCRYPTION_KEY found in .env. A temporary one was generated: {_env_key}")
    print("Please add ENCRYPTION_KEY to your .env file to persist encrypted credentials.")
    
# Ensure the key is valid bytes
try:
    _cipher_suite = Fernet(_env_key.encode())
except Exception as e:
    # Fallback if the user put a non-base64 key in .env
    fallback_key = base64.urlsafe_b64encode(_env_key.encode().ljust(32)[:32])
    _cipher_suite = Fernet(fallback_key)

def encrypt_password(password: str) -> str:
    """Encrypts a plaintext password."""
    if not password:
        return ""
    return _cipher_suite.encrypt(password.encode()).decode()

def decrypt_password(encrypted_password: str) -> str:
    """Decrypts an encrypted password."""
    if not encrypted_password:
        return ""
    try:
        return _cipher_suite.decrypt(encrypted_password.encode()).decode()
    except Exception as e:
        print(f"Error decrypting password: {e}")
        return ""
