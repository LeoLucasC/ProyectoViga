#!/bin/sh
set -e

echo "⏳ Esperando a que PostgreSQL esté listo..."

# Usamos directamente 'db' como host, mucho más seguro y simple
until pg_isready -h db -U vigamonitor -d vigamonitor; do
  sleep 1
done

echo "✅ PostgreSQL está listo"

echo "🌱 Ejecutando seed de base de datos..."
python seed.py

echo "🚀 Iniciando servidor..."
exec uvicorn app.main:app --host 0.0.0.0 --port 8000