// Versioned, validated persistence for recent business trust lookups.

import { isValidBusinessId, normalizeBusinessId } from "./trust.js";

export const HISTORY_STORAGE_KEY = "trustlayer:recent-lookups";
export const HISTORY_SCHEMA_VERSION = 2;
export const HISTORY_SCORE_MODEL = "trust-score.integer-0-100.v1";
export const MAX_HISTORY = 5;
export const MAX_STORAGE_BYTES = 16 * 1024;

const MAX_MIGRATION_RECORDS = 50;
const VALID_PROVENANCE = new Set(["mock:v1", "api:v1", "legacy:mock:v1"]);

function isCanonicalBusinessId(value) {
  return (
    typeof value === "string" &&
    value === normalizeBusinessId(value) &&
    isValidBusinessId(value)
  );
}

function isValidTimestamp(value) {
  if (typeof value !== "string") return false;
  const timestamp = new Date(value);
  return !Number.isNaN(timestamp.getTime()) && timestamp.toISOString() === value;
}

function validateRecord(record) {
  if (!record || typeof record !== "object" || Array.isArray(record)) return null;
  if (!isCanonicalBusinessId(record.businessId)) return null;
  if (!Number.isInteger(record.score) || record.score < 0 || record.score > 100) return null;
  if (!VALID_PROVENANCE.has(record.provenance)) return null;
  if (!isValidTimestamp(record.lookedUpAt)) return null;

  // Copy only the allowlisted fields so response payloads cannot leak into storage.
  return {
    businessId: record.businessId,
    score: record.score,
    provenance: record.provenance,
    lookedUpAt: record.lookedUpAt,
  };
}

function normalizeRecords(records) {
  if (!Array.isArray(records) || records.length > MAX_MIGRATION_RECORDS) return null;
  const seen = new Set();
  const normalized = [];
  for (const candidate of records) {
    const record = validateRecord(candidate);
    if (!record || seen.has(record.businessId)) continue;
    seen.add(record.businessId);
    normalized.push(record);
    if (normalized.length === MAX_HISTORY) break;
  }
  return normalized;
}

function migrateV1(payload) {
  if (payload.scoreModel !== HISTORY_SCORE_MODEL || !Array.isArray(payload.records)) {
    return null;
  }
  return normalizeRecords(
    payload.records.map((record) => ({
      businessId: record.businessId,
      score: record.score,
      provenance:
        record.source === "mock" ? "legacy:mock:v1" : record.provenance,
      lookedUpAt: record.createdAt ?? record.lookedUpAt,
    }))
  );
}

function decodeHistory(payload) {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) return null;
  if (payload.version === 1) return migrateV1(payload);
  if (payload.version !== HISTORY_SCHEMA_VERSION) return null;
  if (payload.scoreModel !== HISTORY_SCORE_MODEL) return null;
  return normalizeRecords(payload.records);
}

function serializedHistory(history) {
  const records = normalizeRecords(history);
  if (records === null) return null;
  return JSON.stringify({
    version: HISTORY_SCHEMA_VERSION,
    scoreModel: HISTORY_SCORE_MODEL,
    records,
  });
}

export function addLookup(history, record) {
  const validRecord = validateRecord(record);
  if (!validRecord) return Array.isArray(history) ? history.slice(0, MAX_HISTORY) : [];
  const validHistory = normalizeRecords(history) ?? [];
  return [
    validRecord,
    ...validHistory.filter((entry) => entry.businessId !== validRecord.businessId),
  ].slice(0, MAX_HISTORY);
}

export function loadHistory(storage = window.localStorage) {
  let raw;
  try {
    raw = storage.getItem(HISTORY_STORAGE_KEY);
    if (raw === null) return [];
    if (raw.length > MAX_STORAGE_BYTES) throw new Error("History exceeds storage limit");
    const parsed = JSON.parse(raw);
    const history = decodeHistory(parsed);
    if (history === null) throw new Error("Unsupported or invalid history schema");

    // Rewrite migrated/filtered data into the canonical current schema.
    const canonical = serializedHistory(history);
    if (canonical !== raw) storage.setItem(HISTORY_STORAGE_KEY, canonical);
    return history;
  } catch {
    try {
      storage.removeItem(HISTORY_STORAGE_KEY);
    } catch {
      // Storage may be unavailable; returning safe state is still guaranteed.
    }
    return [];
  }
}

export function saveHistory(history, storage = window.localStorage) {
  const serialized = serializedHistory(history);
  if (serialized === null || serialized.length > MAX_STORAGE_BYTES) return false;
  try {
    storage.setItem(HISTORY_STORAGE_KEY, serialized);
    return true;
  } catch {
    return false;
  }
}

export function clearHistory(storage = window.localStorage) {
  try {
    storage.removeItem(HISTORY_STORAGE_KEY);
  } catch {
    // Clearing UI state must remain safe when browser storage is unavailable.
  }
}
