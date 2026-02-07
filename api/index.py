"""
Vercel serverless entry point — экспортирует FastAPI app из backend.
"""
import sys
from pathlib import Path

root = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(root / "backend"))

from main import app
