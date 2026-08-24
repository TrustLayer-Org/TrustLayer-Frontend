// Recent lookup history for the Business Trust Lookup experience, persisted
// to localStorage so it survives a page reload.

export const HISTORY_STORAGE_KEY = "trustlayer:recent-lookups";
export const MAX_HISTORY = 5;

export function isVerifiedLookup(record) {
  return (
    record &&
    record.state === "verified" &&
    record.verificationStatus === "verified" &&
    typeof record.source === "string" &&
    record.source.trim() !== "" &&
    typeof record.calculationVersion === "string" &&
    record.calculationVersion.trim() !== ""
  );
}

/**
 * Prepend a verified lookup record to history, capped at MAX_HISTORY entries.
 */
export function addLookup(history, record) {
  if (!isVerifiedLookup(record)) {
    return history.filter(isVerifiedLookup).slice(0, MAX_HISTORY);
  }
  const deduped = history.filter(
    (entry) => entry.businessId !== record.businessId && isVerifiedLookup(entry)
  );
  return [record, ...deduped].slice(0, MAX_HISTORY);
}

/**
 * Read verified records from localStorage. Older mock-only records are ignored.
 */
export function loadHistory() {
  try {
    const raw = window.localStorage.getItem(HISTORY_STORAGE_KEY);
    const records = raw ? JSON.parse(raw) : [];
    return Array.isArray(records) ? records.filter(isVerifiedLookup) : [];
  } catch {
    return [];
  }
}

export function saveHistory(history) {
  window.localStorage.setItem(
    HISTORY_STORAGE_KEY,
    JSON.stringify(history.filter(isVerifiedLookup).slice(0, MAX_HISTORY))
  );
}

export function clearHistory() {
  window.localStorage.removeItem(HISTORY_STORAGE_KEY);
}
