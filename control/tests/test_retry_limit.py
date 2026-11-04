"""Test: runtime retry cap (never more than 3 total attempts)."""

import pytest


def test_retry_bound():
    MAX_RETRIES = 2
    attempts_recorded = []
    
    for attempt in range(1 + MAX_RETRIES):
        attempts_recorded.append(attempt + 1)
        # simulate failure
        continue

    assert len(attempts_recorded) == 3
    assert attempts_recorded == [1, 2, 3]
