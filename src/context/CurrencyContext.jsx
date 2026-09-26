import { createContext, useContext, useState, useCallback, useMemo, useEffect } from "react";
import { getSettings } from "../api/settings";
import { formatInr, formatUsd } from "../utils/format";

const CurrencyContext = createContext(null);

const DISPLAY_KEY = "hb_currency_display"; // "inr" | "usd"
const DEFAULT_RATE = 83;

export function CurrencyProvider({ children }) {
  const [exchangeRateInrPerUsd, setExchangeRateInrPerUsd] = useState(DEFAULT_RATE);
  const [display, setDisplay] = useState(() => {
    try {
      return localStorage.getItem(DISPLAY_KEY) === "usd" ? "usd" : "inr";
    } catch {
      return "inr";
    }
  });

  const refreshRate = useCallback(async () => {
    try {
      const settings = await getSettings();
      if (settings?.exchangeRateInrPerUsd) {
        setExchangeRateInrPerUsd(settings.exchangeRateInrPerUsd);
      }
      return settings;
    } catch {
      // Keep the last known/default rate; callers that need to surface an
      // error (e.g. the Funding page) fetch settings themselves.
      return null;
    }
  }, []);

  useEffect(() => {
    refreshRate();
  }, [refreshRate]);

  const toggleDisplay = useCallback(() => {
    setDisplay((prev) => {
      const next = prev === "usd" ? "inr" : "usd";
      try {
        localStorage.setItem(DISPLAY_KEY, next);
      } catch {
        // localStorage unavailable; toggle still works for this session
      }
      return next;
    });
  }, []);

  const toUsd = useCallback(
    (amountInInr) => (Number(amountInInr) || 0) / (exchangeRateInrPerUsd || DEFAULT_RATE),
    [exchangeRateInrPerUsd]
  );

  // Returns { primary, secondary } formatted strings for a rupee amount,
  // ordered according to the user's chosen primary display currency.
  const formatDual = useCallback(
    (amountInInr) => {
      const inr = formatInr(amountInInr);
      const usd = formatUsd(toUsd(amountInInr));
      return display === "usd" ? { primary: usd, secondary: inr } : { primary: inr, secondary: usd };
    },
    [display, toUsd]
  );

  const value = useMemo(
    () => ({
      exchangeRateInrPerUsd,
      setExchangeRateInrPerUsd,
      display,
      isUsdPrimary: display === "usd",
      toggleDisplay,
      toUsd,
      formatDual,
      refreshRate,
    }),
    [exchangeRateInrPerUsd, display, toggleDisplay, toUsd, formatDual, refreshRate]
  );

  return <CurrencyContext.Provider value={value}>{children}</CurrencyContext.Provider>;
}

export function useCurrency() {
  const ctx = useContext(CurrencyContext);
  if (!ctx) throw new Error("useCurrency must be used within a CurrencyProvider");
  return ctx;
}
