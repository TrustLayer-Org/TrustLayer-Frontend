// Recent lookup history for the Business Trust Lookup experience, persisted
// to localStorage so it survives a page reload.

// Key under which the recent lookup history is stored in localStorage.
export const HISTORY_STORAGE_KEY = "trustlayer:recent-lookups";

// Maximum number of recent lookups to keep.
export const MAX_HISTORY = 5;

/**
 * Prepend a lookup record to history, capped at MAX_HISTORY entries.
 * @param {Array<{businessId: string, score: number}>} history existing history
 * @param {{businessId: string, score: number}} record the new lookup result
 * @returns {Array<{businessId: string, score: number}>} the updated history
 */
export function addLookup(history, record) {
  const deduped = history.filter(
    (entry) => entry.businessId !== record.businessId
  );
  return [record, ...deduped].slice(0, MAX_HISTORY);
}

/**
 * Read the stored lookup history from localStorage.
 * @returns {Array<{businessId: string, score: number}>} the stored history, or [] when absent
 */
export function loadHistory() {
  const raw = window.localStorage.getItem(HISTORY_STORAGE_KEY);
  return raw ? JSON.parse(raw) : [];
}

/**
 * Persist the lookup history to localStorage.
 * @param {Array<{businessId: string, score: number}>} history the history to store
 */
export function saveHistory(history) {
  window.localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(history));
}

// Remove the stored lookup history from localStorage.
export function clearHistory() {
  window.localStorage.removeItem(HISTORY_STORAGE_KEY);
}
