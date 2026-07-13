"""
Seed script — Crea la tabla `users` e inserta el usuario admin por defecto.

Uso:
    python seed_users.py

Esto:
    1. Conecta a la base de datos vigamonitor
    2. Crea la tabla users si no existe
    3. Inserta el usuario admin por defecto (admin / admin123)
"""

import asyncio
import logging

import asyncpg

from app.config import settings
from app.models import create_users_table, seed_default_user, hash_password

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(levelname)s - %(message)s",
)


async def seed_users() -> None:
    dsn = str(settings.database_dsn)
    logging.info("Conectando a vigamonitor...")

    try:
        conn = await asyncpg.connect(dsn)
    except Exception as e:
        logging.error(f"❌ No se pudo conectar: {e}")
        return

    try:
        logging.info("Creando tabla users...")
        await create_users_table(conn)
        logging.info("✓ Tabla users lista")

        logging.info("Insertando usuario por defecto...")
        await seed_default_user(conn)

        # También podemos listar los usuarios existentes
        rows = await conn.fetch("SELECT id, username, email, created_at FROM users")
        logging.info(f"📋 Usuarios en la base de datos ({len(rows)}):")
        for r in rows:
            logging.info(f"   → {r['username']} ({r['email']}) — creado {r['created_at']}")

        logging.info("✅ Seed de usuarios completado con éxito")
    except Exception as e:
        logging.error(f"❌ Error durante el seed: {e}")
    finally:
        await conn.close()


if __name__ == "__main__":
    asyncio.run(seed_users())
