#!/usr/bin/env python3
"""
VigaMonitor - Simulador de Telemetría
Genera datos realistas de deflexión y vibración y los envía vía WebSocket.

Uso:
    python simulator.py                               # Modo interactivo
    python simulator.py --auto                        # Modo automático
    python simulator.py --auto --viga-id 1            # Datos etiquetados con viga_id=1
    python simulator.py --interval 0.5                # Enviar cada 0.5s
"""

import argparse
import asyncio
import json
import math
import random
import sys
from datetime import datetime, timezone

import aiohttp

# Configuración
WS_URL = "ws://localhost:8000/ws/telemetria"


def generar_lectura_distancia(viga_id: int | None = None) -> dict:
    """Genera una lectura de deflexión realista (mm)."""
    base = random.gauss(18, 6)
    if random.random() < 0.10:
        base += random.uniform(20, 50)
    valor = max(0, round(base, 2))
    result = {
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "sensor_id": "bridge-01",
        "sensor_tipo": "distancia",
        "valor": valor,
        "unidad": "mm",
    }
    if viga_id is not None:
        result["viga_id"] = viga_id
    return result


def generar_lectura_vibracion(viga_id: int | None = None) -> dict:
    """Genera una lectura de vibración realista con todos los parámetros MPU9250."""
    # Aceleraciones base (m/s²)
    ax = round(random.gauss(0.1, 0.5), 4)
    ay = round(random.gauss(9.81, 0.3), 4)  # gravedad en Y
    az = round(random.gauss(-0.05, 0.4), 4)

    # Eliminar gravedad / offset
    adx = round(ax - random.gauss(0.05, 0.02), 4)
    ady = round(ay - 9.81, 4)
    adz = round(az - random.gauss(-0.03, 0.02), 4)

    # ~10% pico
    evento = 0
    if random.random() < 0.10:
        adx += random.uniform(0.5, 2.0)
        ady += random.uniform(0.3, 1.5)
        adz += random.uniform(0.4, 1.8)
        evento = 1

    aver = round(math.sqrt(adx**2 + ady**2 + adz**2), 4)
    valor = max(0, round(aver, 3))

    # Giroscopio (rad/s)
    gx = round(random.gauss(0.0, 0.01), 6)
    gy = round(random.gauss(0.0, 0.01), 6)
    gz = round(random.gauss(0.0, 0.01), 6)
    if evento:
        gx += random.uniform(-0.05, 0.05)
        gy += random.uniform(-0.05, 0.05)
        gz += random.uniform(-0.05, 0.05)

    temp = round(random.gauss(32.0, 1.5), 2)

    result = {
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "sensor_id": "bridge-02",
        "sensor_tipo": "vibracion",
        "valor": valor,
        "unidad": "m/s²",
        "ax": ax, "ay": ay, "az": az,
        "adx": adx, "ady": ady, "adz": adz,
        "aver": aver,
        "gx": gx, "gy": gy, "gz": gz,
        "temp": temp,
        "evento": evento,
    }
    if viga_id is not None:
        result["viga_id"] = viga_id
    return result


def mostrar_lectura(lectura: dict) -> str:
    ts = lectura["timestamp"][11:19]
    tipo = "📏 Distancia" if lectura["sensor_tipo"] == "distancia" else "📳 Vibración"
    valor = lectura["valor"]
    unidad = lectura["unidad"]
    viga = f" [Viga {lectura['viga_id']}]" if lectura.get("viga_id") else ""
    return f"[{ts}]{viga} {tipo}: {valor} {unidad}"


async def enviar_lectura(session: aiohttp.ClientSession, ws, auto: bool, viga_id: int | None = None):
    """Genera y envía una lectura."""
    lectura = generar_lectura_distancia(viga_id)
    await ws.send_json(lectura)
    print(f"  → {mostrar_lectura(lectura)}")

    await asyncio.sleep(0.3 if auto else 0.1)

    lectura = generar_lectura_vibracion(viga_id)
    await ws.send_json(lectura)
    print(f"  → {mostrar_lectura(lectura)}")


async def modo_manual(ws, viga_id: int | None = None):
    """Modo interactivo: ENTER para cada par de lecturas."""
    print("\n📡 Simulador interactivo — presiona ENTER para enviar un par de lecturas")
    print("   Escribe 'q' + ENTER para salir\n")
    input("   Presiona ENTER para empezar...")
    async with aiohttp.ClientSession() as session:
        while True:
            await enviar_lectura(session, ws, auto=False, viga_id=viga_id)
            linea = input("\n   ENTER para más, 'q' para salir: ")
            if linea.strip().lower() == "q":
                break


async def modo_auto(ws, interval: float, viga_id: int | None = None):
    """Modo automático: envía lecturas cada `interval` segundos."""
    tag = f" [Viga {viga_id}]" if viga_id else ""
    print(f"\n📡 Simulador automático{tag} — enviando cada {interval}s")
    print("   Presiona Ctrl+C para detener\n")
    async with aiohttp.ClientSession() as session:
        while True:
            await enviar_lectura(session, ws, auto=True, viga_id=viga_id)
            await asyncio.sleep(interval)


async def main():
    parser = argparse.ArgumentParser(description="VigaMonitor - Simulador de Telemetría")
    parser.add_argument("--auto", action="store_true", help="Modo automático")
    parser.add_argument("--interval", type=float, default=1.0, help="Intervalo en segundos (modo auto)")
    parser.add_argument("--viga-id", type=int, default=None, help="ID de la viga a etiquetar las lecturas")
    args = parser.parse_args()

    print(f"🔌 Conectando a {WS_URL} ...")
    try:
        async with aiohttp.ClientSession() as session:
            async with session.ws_connect(WS_URL) as ws:
                print("✅ Conectado al servidor WebSocket\n")

                if args.auto:
                    await modo_auto(ws, args.interval, args.viga_id)
                else:
                    await modo_manual(ws, args.viga_id)

    except aiohttp.ClientConnectorError:
        print(f"❌ No se pudo conectar a {WS_URL}")
        print("   Asegúrate de que el backend esté corriendo (python run.py)")
        sys.exit(1)
    except KeyboardInterrupt:
        print("\n\n👋 Simulador detenido.")
        sys.exit(0)


if __name__ == "__main__":
    asyncio.run(main())
