/**
 * Escape a string for safe use inside a MongoDB regex (literal match).
 */
function escapeRegex(str) {
  return String(str).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

const RECORD_SORT_WHITELIST = {
  date: { date: 1 },
  "-date": { date: -1 },
  amount: { amount: 1 },
  "-amount": { amount: -1 },
  createdAt: { createdAt: 1 },
  "-createdAt": { createdAt: -1 },
};

function parseRecordSort(sortParam) {
  const key = typeof sortParam === "string" && sortParam.trim() ? sortParam.trim() : "-date";
  return RECORD_SORT_WHITELIST[key] ?? { date: -1 };
}

const ALLOWED_RECORD_SORT_KEYS = Object.keys(RECORD_SORT_WHITELIST);

module.exports = {
  escapeRegex,
  parseRecordSort,
  RECORD_SORT_WHITELIST,
  ALLOWED_RECORD_SORT_KEYS,
};
