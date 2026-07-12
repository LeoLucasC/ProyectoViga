#!/usr/bin/env python3
"""Entry point for uvicorn."""

import uvicorn
from app.config import settings

if __name__ == "__main__":
    uvicorn.run(
        "app.main:app",
        host=settings.ws_host,
        port=settings.ws_port,
        reload=True,
    )
