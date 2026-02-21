const registry = {};

function ensureEntry(schedulerName) {
  if (!registry[schedulerName]) {
    registry[schedulerName] = {
      lastRun: null,
      lastSuccess: null,
      lastFailure: null,
      lastError: null,
      isRunning: false,
    };
  }
  return registry[schedulerName];
}

function recordStart(schedulerName) {
  const entry = ensureEntry(schedulerName);
  entry.lastRun = new Date().toISOString();
  entry.isRunning = true;
}

function recordSuccess(schedulerName) {
  const entry = ensureEntry(schedulerName);
  entry.lastSuccess = new Date().toISOString();
  entry.isRunning = false;
}

function recordFailure(schedulerName, error) {
  const entry = ensureEntry(schedulerName);
  entry.lastFailure = new Date().toISOString();
  entry.lastError = error?.message || String(error);
  entry.isRunning = false;
}

function getStatus() {
  return JSON.parse(JSON.stringify(registry));
}

module.exports = { recordStart, recordSuccess, recordFailure, getStatus };
