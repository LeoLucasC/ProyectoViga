#!/bin/sh
set -e

echo "Esperando BD..."

until pg_isready -h db; do
  sleep 1
done

echo "BD lista"
python seed.py

exec uvicorn app.main:app --host 0.0.0.0 --port 8000
