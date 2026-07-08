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
  return [record, ...history].slice(0, MAX_HISTORY);
}
