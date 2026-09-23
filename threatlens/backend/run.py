import os
import sys
from pathlib import Path

# Add backend directory to sys.path
sys.path.insert(0, str(Path(__file__).resolve().parent))

from app import create_app

app = create_app()

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5050))
    print(f"\n" + "=" * 65)
    print(f"  ThreatLens AI — Network Security Intelligence Platform")
    print(f"  Tagline: See the Threat. Understand the Risk.")
    print(f"  Server running on http://127.0.0.1:{port}")
    print(f"=" * 65 + "\n")
    app.run(host="0.0.0.0", port=port, debug=False)
