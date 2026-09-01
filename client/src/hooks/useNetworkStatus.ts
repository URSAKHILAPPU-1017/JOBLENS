import { useEffect, useState, useCallback } from "react";
import { checkServerHealth } from "@/lib/api";

export interface NetworkStatus {
  isOnline: boolean;
  isServerAvailable: boolean;
  isChecking: boolean;
  checkHealth: () => Promise<boolean>;
  lastChecked: Date | null;
}

export function useNetworkStatus(): NetworkStatus {
  const [isOnline, setIsOnline] = useState<boolean>(
    typeof navigator !== "undefined" ? navigator.onLine : true
  );
  const [isServerAvailable, setIsServerAvailable] = useState<boolean>(true);
  const [isChecking, setIsChecking] = useState<boolean>(false);
  const [lastChecked, setLastChecked] = useState<Date | null>(null);

  const checkHealth = useCallback(async (): Promise<boolean> => {
    setIsChecking(true);
    const onlineState = typeof navigator !== "undefined" ? navigator.onLine : true;
    setIsOnline(onlineState);

    if (!onlineState) {
      setIsServerAvailable(false);
      setIsChecking(false);
      setLastChecked(new Date());
      return false;
    }

    const serverOk = await checkServerHealth(3000);
    setIsServerAvailable(serverOk);
    setIsChecking(false);
    setLastChecked(new Date());
    return serverOk;
  }, []);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      checkHealth();
    };

    const handleOffline = () => {
      setIsOnline(false);
      setIsServerAvailable(false);
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    // Initial health check on mount
    checkHealth();

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [checkHealth]);

  return {
    isOnline,
    isServerAvailable,
    isChecking,
    checkHealth,
    lastChecked,
  };
}
