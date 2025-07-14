from cryptography.fernet import Fernet

# Generate a new Fernet key
fernet_key = Fernet.generate_key().decode()  # Convert to string
print("FERNET_KEY:", fernet_key)