import { createContext, useContext, useState, useCallback, useRef } from "react";

const AppContext = createContext(null);

const DEFAULT_API_BASE = "http://localhost:3001";

export function AppProvider({ children }) {
  const [apiBaseUrl, setApiBaseUrlState] = useState(DEFAULT_API_BASE);
  const [runStatus, setRunStatus] = useState("idle");
  const [results, setResults] = useState(null);
  const pollIntervalRef = useRef(null);

  const setApiBaseUrl = useCallback((url) => {
    setApiBaseUrlState(url || DEFAULT_API_BASE);
  }, []);

  const fetchStatus = useCallback(async () => {
    const base = apiBaseUrl.replace(/\/$/, "");
    const res = await fetch(`${base}/api/status`);
    if (!res.ok) return null;
    return res.json();
  }, [apiBaseUrl]);

  const fetchResults = useCallback(async () => {
    const base = apiBaseUrl.replace(/\/$/, "");
    const res = await fetch(`${base}/api/results`);
    if (!res.ok) return null;
    return res.json();
  }, [apiBaseUrl]);

  const stopPolling = useCallback(() => {
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = null;
    }
  }, []);

  const startPolling = useCallback(
    (intervalMs = 2000) => {
      stopPolling();
      pollIntervalRef.current = setInterval(async () => {
        try {
          const status = await fetchStatus();
          if (status && status.status !== "running") {
            stopPolling();
            setRunStatus(status.status);
            const data = await fetchResults();
            setResults(data);
          }
        } catch {
          // Ignore network errors; keep polling until backend responds
        }
      }, intervalMs);
    },
    [fetchStatus, fetchResults, stopPolling]
  );

  const value = {
    apiBaseUrl,
    setApiBaseUrl,
    runStatus,
    setRunStatus,
    results,
    setResults,
    fetchStatus,
    fetchResults,
    startPolling,
    stopPolling,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}
