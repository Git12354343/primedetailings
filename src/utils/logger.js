// backend/logger.js — dev-only logging for Node.js backend
const isDev = process.env.NODE_ENV !== 'production';

const devLog = (...args) => {
  if (isDev) console.log(...args);
};

const devWarn = (...args) => {
  if (isDev) console.warn(...args);
};

const devError = (...args) => {
  if (isDev) console.error(...args);
};

module.exports = { devLog, devWarn, devError };
