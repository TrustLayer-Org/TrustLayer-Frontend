import assert from "node:assert/strict";
import test from "node:test";

import {
  HISTORY_SCHEMA_VERSION,
  HISTORY_SCORE_MODEL,
  HISTORY_STORAGE_KEY,
  MAX_HISTORY,
  MAX_STORAGE_BYTES,
  addLookup,
  clearHistory,
  loadHistory,
  saveHistory,
} from "../src/lib/history.js";

class MemoryStorage {
  constructor(value = null) {
    this.value = value;
  }
  getItem(key) {
    assert.equal(key, HISTORY_STORAGE_KEY);
    return this.value;
  }
  setItem(key, value) {
    assert.equal(key, HISTORY_STORAGE_KEY);
    this.value = value;
  }
  removeItem(key) {
    assert.equal(key, HISTORY_STORAGE_KEY);
    this.value = null;
  }
}

const timestamp = "2026-08-24T12:00:00.000Z";
const record = (businessId, score = 75) => ({
  businessId,
  score,
  provenance: "mock:v1",
  lookedUpAt: timestamp,
});
const envelope = (records, overrides = {}) =>
  JSON.stringify({
    version: HISTORY_SCHEMA_VERSION,
    scoreModel: HISTORY_SCORE_MODEL,
    records,
    ...overrides,
  });

test("missing and malformed storage recover to empty history", () => {
  assert.deepEqual(loadHistory(new MemoryStorage()), []);
  const malformed = new MemoryStorage("{not-json");
  assert.deepEqual(loadHistory(malformed), []);
  assert.equal(malformed.value, null);
});

test("oversized and unknown-version storage is discarded before use", () => {
  const oversized = new MemoryStorage("x".repeat(MAX_STORAGE_BYTES + 1));
  assert.deepEqual(loadHistory(oversized), []);
  assert.equal(oversized.value, null);

  const future = new MemoryStorage(envelope([], { version: 99 }));
  assert.deepEqual(loadHistory(future), []);
  assert.equal(future.value, null);
});

test("unversioned legacy arrays recover safely because meaning and provenance are absent", () => {
  const legacy = new MemoryStorage(JSON.stringify([{ businessId: "ACME-123", score: 75 }]));
  assert.deepEqual(loadHistory(legacy), []);
  assert.equal(legacy.value, null);
});

test("v1 migrates only when its score model preserves score meaning", () => {
  const storage = new MemoryStorage(
    JSON.stringify({
      version: 1,
      scoreModel: HISTORY_SCORE_MODEL,
      records: [{ businessId: "ACME-123", score: 75, source: "mock", createdAt: timestamp }],
    })
  );
  assert.deepEqual(loadHistory(storage), [{ ...record("ACME-123"), provenance: "legacy:mock:v1" }]);
  assert.equal(JSON.parse(storage.value).version, HISTORY_SCHEMA_VERSION);

  const changedMeaning = new MemoryStorage(
    JSON.stringify({ version: 1, scoreModel: "stars-1-5", records: [] })
  );
  assert.deepEqual(loadHistory(changedMeaning), []);
  assert.equal(changedMeaning.value, null);
});

test("invalid records are filtered, duplicates are deduped, and history is bounded", () => {
  const records = [
    record("ACME-123"),
    record("ACME-123", 10),
    record("lowercase", 50),
    record("BAD-SCORE", 101),
    { ...record("BAD-SOURCE"), provenance: "attacker" },
    { ...record("BAD-TIME"), lookedUpAt: "yesterday" },
    ...Array.from({ length: 8 }, (_, index) => record(`VALID-${index}`, index)),
  ];
  const storage = new MemoryStorage(envelope(records));
  const loaded = loadHistory(storage);
  assert.equal(loaded.length, MAX_HISTORY);
  assert.equal(loaded.filter((entry) => entry.businessId === "ACME-123").length, 1);
  assert.deepEqual(loaded.map((entry) => entry.businessId), ["ACME-123", "VALID-0", "VALID-1", "VALID-2", "VALID-3"]);
});

test("save allowlists fields and clear survives reload", () => {
  const storage = new MemoryStorage();
  const sensitive = { ...record("ACME-123"), rawResponse: { token: "do-not-store" } };
  assert.equal(saveHistory([sensitive], storage), true);
  assert.equal(storage.value.includes("rawResponse"), false);
  assert.deepEqual(loadHistory(storage), [record("ACME-123")]);
  clearHistory(storage);
  assert.deepEqual(loadHistory(storage), []);
});

test("new lookups are validated and replace duplicates", () => {
  const updated = addLookup([record("ACME-123", 20)], record("ACME-123", 90));
  assert.deepEqual(updated, [record("ACME-123", 90)]);
  assert.deepEqual(addLookup(updated, record("INVALID", Number.NaN)), updated);
});
