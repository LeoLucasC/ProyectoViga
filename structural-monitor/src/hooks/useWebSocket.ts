import { useEffect, useRef, useCallback } from "react";
import type { ConnectionStatus } from "../types/telemetry";

interface UseWebSocketOptions {
  url: string;
  onMessage: (data: string) => void;
  onStatusChange: (status: ConnectionStatus) => void;
}

export function useWebSocket({
  url,
  onMessage,
  onStatusChange,
}: UseWebSocketOptions) {
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimer = useRef<ReturnType<typeof setTimeout>>();
  const isMounted = useRef(true);

  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return;

    onStatusChange("reconnecting");
    const ws = new WebSocket(url);
    wsRef.current = ws;

    ws.onopen = () => {
      if (!isMounted.current) return;
      onStatusChange("connected");
    };

    ws.onmessage = (event) => {
      if (!isMounted.current) return;
      onMessage(event.data);
    };

    ws.onclose = () => {
      if (!isMounted.current) return;
      onStatusChange("disconnected");
      reconnectTimer.current = setTimeout(connect, 3000);
    };

    ws.onerror = () => {
      ws.close();
    };
  }, [url, onMessage, onStatusChange]);

  const disconnect = useCallback(() => {
    isMounted.current = false;
    clearTimeout(reconnectTimer.current);
    wsRef.current?.close();
    wsRef.current = null;
  }, []);

  useEffect(() => {
    isMounted.current = true;
    connect();
    return disconnect;
  }, [connect, disconnect]);

  return { disconnect };
}
