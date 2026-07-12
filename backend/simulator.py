#!/usr/bin/env python3
"""
VigaMonitor - Simulador de Telemetría
Genera datos realistas de deflexión y vibración y los envía vía WebSocket.

Uso:
    python simulator.py                  # Modo interactivo
    python simulator.py --auto           # Modo automático
    python simulator.py --interval 0.5   # Enviar cada 0.5s
"""

import argparse
import asyncio
import json
import random
import sys
from datetime import datetime, timezone

import aiohttp

# Configuración
WS_URL = "ws://localhost:8000/ws/telemetria"
SENSORES = ["bridge-01", "bridge-02"]


def generar_lectura_distancia() -> dict:
    """Genera una lectura de deflexión realista (mm).
    - Normal: ~10-25mm
    - Ocasionalmente picos que cruzan umbrales (40 alerta, 60 crítico)
    """
    base = random.gauss(18, 6)  # media 18mm, desviación 6
    # ~10% de probabilidad de evento anómalo
    if random.random() < 0.10:
        base += random.uniform(20, 50)  # pico
    valor = max(0, round(base, 2))
    return {
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "sensor_id": "bridge-01",
        "sensor_tipo": "distancia",
        "valor": valor,
        "unidad": "mm",
    }


def generar_lectura_vibracion() -> dict:
    """Genera una lectura de vibración realista (m/s²).
    - Normal: ~0.1-0.4
    - Ocasionalmente picos que cruzan umbrales (0.8 alerta, 1.5 crítico)
    """
    base = random.gauss(0.25, 0.1)
    if random.random() < 0.10:
        base += random.uniform(0.5, 1.8)
    valor = max(0, round(base, 3))
    return {
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "sensor_id": "bridge-02",
        "sensor_tipo": "vibracion",
        "valor": valor,
        "unidad": "m/s²",
    }


def mostrar_lectura(lectura: dict) -> str:
    ts = lectura["timestamp"][11:19]
    tipo = "📏 Distancia" if lectura["sensor_tipo"] == "distancia" else "📳 Vibración"
    valor = lectura["valor"]
    unidad = lectura["unidad"]
    return f"[{ts}] {tipo}: {valor} {unidad}"


async def enviar_lectura(session: aiohttp.ClientSession, ws, auto: bool):
    """Genera y envía una lectura."""
    lectura = generar_lectura_distancia()
    await ws.send_json(lectura)
    print(f"  → {mostrar_lectura(lectura)}")

    await asyncio.sleep(0.3 if auto else 0.1)

    lectura = generar_lectura_vibracion()
    await ws.send_json(lectura)
    print(f"  → {mostrar_lectura(lectura)}")


async def modo_manual(ws):
    """Modo interactivo: ENTER para cada par de lecturas."""
    print("\n📡 Simulador interactivo — presiona ENTER para enviar un par de lecturas")
    print("   Escribe 'q' + ENTER para salir\n")
    input("   Presiona ENTER para empezar...")
    async with aiohttp.ClientSession() as session:
        while True:
            await enviar_lectura(session, ws, auto=False)
            linea = input("\n   ENTER para más, 'q' para salir: ")
            if linea.strip().lower() == "q":
                break


async def modo_auto(ws, interval: float):
    """Modo automático: envía lecturas cada `interval` segundos."""
    print(f"\n📡 Simulador automático — enviando cada {interval}s")
    print("   Presiona Ctrl+C para detener\n")
    async with aiohttp.ClientSession() as session:
        while True:
            await enviar_lectura(session, ws, auto=True)
            await asyncio.sleep(interval)


async def main():
    parser = argparse.ArgumentParser(description="VigaMonitor - Simulador de Telemetría")
    parser.add_argument("--auto", action="store_true", help="Modo automático")
    parser.add_argument("--interval", type=float, default=1.0, help="Intervalo en segundos (modo auto)")
    args = parser.parse_args()

    print(f"🔌 Conectando a {WS_URL} ...")
    try:
        async with aiohttp.ClientSession() as session:
            async with session.ws_connect(WS_URL) as ws:
                print("✅ Conectado al servidor WebSocket\n")

                if args.auto:
                    await modo_auto(ws, args.interval)
                else:
                    await modo_manual(ws)

    except aiohttp.ClientConnectorError:
        print(f"❌ No se pudo conectar a {WS_URL}")
        print("   Asegúrate de que el backend esté corriendo (python run.py)")
        sys.exit(1)
    except KeyboardInterrupt:
        print("\n\n👋 Simulador detenido.")
        sys.exit(0)


if __name__ == "__main__":
    asyncio.run(main())
