export function formatTimestamp(ts: number): string {
  const d = new Date(ts);
  return d.toLocaleTimeString("es-ES", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    fractionalSecondDigits: 1,
  });
}
