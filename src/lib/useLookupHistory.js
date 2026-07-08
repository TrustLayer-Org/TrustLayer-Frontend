"use client";

import { useEffect, useState } from "react";
import {
  addLookup,
  clearHistory,
  loadHistory,
  saveHistory,
} from "@/lib/history";

// Load, persist, and mutate the recent lookup history for a client component.
export function useLookupHistory() {
  const [history, setHistory] = useState([]);

  useEffect(() => {
    // localStorage is only available after mount; deferring the read here
    // avoids a server/client markup mismatch on first render.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setHistory(loadHistory());
  }, []);

  function recordLookup(record) {
    setHistory((prev) => {
      const next = addLookup(prev, record);
      saveHistory(next);
      return next;
    });
  }

  function clear() {
    clearHistory();
    setHistory([]);
  }

  return { history, recordLookup, clear };
}
