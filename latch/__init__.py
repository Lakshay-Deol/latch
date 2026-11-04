"""Latch — Containment isn't a feature. It's the product.

Web-based agent execution platform with sandboxed execution on Vultr.
"""

from __future__ import annotations

import sys
from pathlib import Path

# Add control directory to sys.path so control/latch modules can be imported
_root = Path(__file__).resolve().parent.parent
_control = _root / "control"
if _control.exists() and str(_control) not in sys.path:
    sys.path.insert(0, str(_control))

__version__ = "0.1.0"

try:
    from latch.config import *  # noqa: F401, F403
except ImportError:
    pass
