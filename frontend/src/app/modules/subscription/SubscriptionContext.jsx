import { createContext, useContext, useState, useEffect, useCallback } from "react";
import api from "../../../services/api.js";

const SubscriptionContext = createContext(undefined);

const DEFAULT_STATUS = {
  isConfigured: false,
  subscriptionDay: null,
  nextExpiry: null,
  isExpired: false,
  isWarning: false,
  daysRemaining: null,
};

export function SubscriptionProvider({ children }) {
  const [status, setStatus] = useState(DEFAULT_STATUS);

  const fetchStatus = useCallback(async () => {
    try {
      const { data } = await api.get("/subscription/status");
      setStatus(data);
    } catch {
      // Sin token o sin conexión → sin restricciones
    }
  }, []);

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 60000);
    return () => clearInterval(interval);
  }, [fetchStatus]);

  const configure = async (day) => {
    const { data } = await api.post("/subscription/configure", { day });
    setStatus(data);
    return data;
  };

  const renew = async () => {
    const { data } = await api.post("/subscription/renew");
    setStatus(data);
    return data;
  };

  return (
    <SubscriptionContext.Provider value={{ ...status, configure, renew, fetchStatus }}>
      {children}
    </SubscriptionContext.Provider>
  );
}

export function useSubscription() {
  const context = useContext(SubscriptionContext);
  if (!context) throw new Error("useSubscription must be used within SubscriptionProvider");
  return context;
}
