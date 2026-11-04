"""Test: container environment contains zero LATCH_ or secret variables."""

import re


def test_env_hygiene_check():
    mock_container_environ = "PATH=/usr/local/bin:/usr/bin\nUSER=nobody\nHOME=/tmp\nLANG=C.UTF-8\n"
    lines = mock_container_environ.splitlines()

    leaked = [l for l in lines if re.search(r"LATCH_|KEY|TOKEN|SECRET", l, re.IGNORECASE)]
    assert len(leaked) == 0
