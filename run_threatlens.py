#!/usr/bin/env python3
"""
ThreatLens AI — Real Full-Stack Network Security Intelligence Platform
Launch script from workspace root.
"""
import os
import sys
from pathlib import Path

# Add threatlens/backend to Python path
backend_dir = Path(__file__).resolve().parent / "threatlens" / "backend"
sys.path.insert(0, str(backend_dir))

from app import create_app

app = create_app()

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5050))
    print("\n" + "=" * 65)
    print("  ThreatLens AI — Network Security Intelligence Platform")
    print("  Tagline: See the Threat. Understand the Risk.")
    print(f"  Access Console: http://127.0.0.1:{port}")
    print("=" * 65 + "\n")
    app.run(host="0.0.0.0", port=port, debug=False)
