"""Latch — Containment isn't a feature. It's the product.

Web-based agent execution platform with sandboxed execution on Vultr.
"""

from __future__ import annotations

import sys
from pathlib import Path
import pkgutil

_control_dir = Path(__file__).resolve().parent.parent / "control"
_control_latch = _control_dir / "latch"

if _control_dir.exists() and str(_control_dir) not in sys.path:
    sys.path.insert(0, str(_control_dir))

if _control_latch.exists():
    __path__.append(str(_control_latch))

__version__ = "0.1.0"
