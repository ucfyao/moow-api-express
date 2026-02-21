const registry = {};

function recordStart(schedulerName) {
  if (!registry[schedulerName]) {
    registry[schedulerName] = {
      lastRun: null,
      lastSuccess: null,
      lastFailure: null,
      lastError: null,
      isRunning: false,
    };
  }
  registry[schedulerName].lastRun = new Date().toISOString();
  registry[schedulerName].isRunning = true;
}

function recordSuccess(schedulerName) {
  if (!registry[schedulerName]) {
    registry[schedulerName] = {
      lastRun: null,
      lastSuccess: null,
      lastFailure: null,
      lastError: null,
      isRunning: false,
    };
  }
  registry[schedulerName].lastSuccess = new Date().toISOString();
  registry[schedulerName].isRunning = false;
}

function recordFailure(schedulerName, error) {
  if (!registry[schedulerName]) {
    registry[schedulerName] = {
      lastRun: null,
      lastSuccess: null,
      lastFailure: null,
      lastError: null,
      isRunning: false,
    };
  }
  registry[schedulerName].lastFailure = new Date().toISOString();
  registry[schedulerName].lastError = error?.message || String(error);
  registry[schedulerName].isRunning = false;
}

function getStatus() {
  return { ...registry };
}

module.exports = { recordStart, recordSuccess, recordFailure, getStatus };
