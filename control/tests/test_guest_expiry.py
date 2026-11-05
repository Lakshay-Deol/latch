"""Test: expired guest data is identified for cleanup."""

import time
from latch import db, guests


def test_guest_expiration():
    db.init()
    guest_id = f"guest_test_{int(time.time())}"
    # Expired 1 hour ago
    expired_time = time.time() - 3600
    db.create_guest(guest_id, expires=expired_time)

    active = db.active_guests()
    active_ids = [g["id"] for g in active]
    assert guest_id not in active_ids

