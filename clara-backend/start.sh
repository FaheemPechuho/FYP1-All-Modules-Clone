#!/usr/bin/env bash
# Production startup script for Render.com
set -e

echo "Starting Clara Backend (production)..."
exec uvicorn main:app --host 0.0.0.0 --port "${PORT:-8001}"
