export function formatTimestamp(ts: number): string {
  const d = new Date(ts);
  return d.toLocaleTimeString("es-ES", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    fractionalSecondDigits: 1,
  });
}

export function parseSensorCoords(
  ubicacion: string | null
): [number, number, number] | null {
  if (!ubicacion) return null;
  const m = ubicacion.match(
    /x:\s*([-\d.]+),\s*y:\s*([-\d.]+),\s*z:\s*([-\d.]+)/
  );
  if (!m) return null;
  return [parseFloat(m[1]), parseFloat(m[2]), parseFloat(m[3])];
}
