"""Test accounts for local development.

Add the caretaker test user to an existing database without reseeding:

    python -m app.seed.test_users
"""

from app.models.user import UserRole

# Development-only credentials for the Caretaker mobile app.
TEST_CARETAKER = {
    "email": "caretaker@flowos.com",
    "password": "care1234",
    "full_name": "Sarah Jensen",
    "role": UserRole.NURSE,
}


def ensure_test_caretaker() -> bool:
    """Create the caretaker test user if missing. Returns True if it was created."""
    from app.database import SessionLocal
    from app.models.user import User
    from app.services.auth_service import hash_password

    db = SessionLocal()
    try:
        if db.query(User).filter(User.email == TEST_CARETAKER["email"]).first():
            return False
        db.add(User(
            email=TEST_CARETAKER["email"],
            password_hash=hash_password(TEST_CARETAKER["password"]),
            full_name=TEST_CARETAKER["full_name"],
            role=TEST_CARETAKER["role"],
        ))
        db.commit()
        return True
    finally:
        db.close()


if __name__ == "__main__":
    created = ensure_test_caretaker()
    print(f"{TEST_CARETAKER['email']}: {'created' if created else 'already exists'}")
