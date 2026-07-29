"""
app.models package

NOTE: During migration away from SQLAlchemy we avoid importing model modules
at package import time so development tools (fastapi dev, uvicorn) can import
the application without executing SQLAlchemy declarative class creation.

Import model modules only where strictly necessary.
"""

__all__ = []
