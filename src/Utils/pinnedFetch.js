/**
 * Common fetch with SSL pinning using qubetics.cer (asset folder).
 * Use for VPN API and Chain Abstraction API calls.
 *
 * Cert: place qubetics.cer in assets; iOS/Android use name "qubetics" (no extension).
 */
import { fetch } from 'react-native-ssl-pinning';
import { consoleLogFunc } from './MethodsUtils';

const PINNED_CERTS = ['qubetics', 'swftc'];

const DEFAULT_TIMEOUT_MS = 10000;
const DEFAULT_MAX_RETRIES = 2; // 1 initial + 2 retries = 3 total attempts on timeout

/** @returns {boolean} true if error looks like a timeout */
const isTimeoutError = (error) => {
  const msg = (error?.message ?? String(error)).toLowerCase();
  return (
    msg.includes('timeout') ||
    msg.includes('timed out') ||
    error?.name === 'AbortError' ||
    error?.code === 'ETIMEDOUT' ||
    error?.code === 'ECONNABORTED'
  );
};

/**
 * Fetch with SSL pinning (qubetics.cer). Same signature as global fetch.
 * On request timeout, retries up to maxRetries times (only for timeouts).
 * @param {string} url - Request URL
 * @param {RequestInit & { sslPinning?: object, disableAllSecurity?: boolean, timeoutInterval?: number, maxRetries?: number, retryDelayMs?: number }} options - Fetch options
 * @returns {Promise<Response>}
 */
export const pinnedFetch = (url, options = {}) => {
  const {
    sslPinning,
    disableAllSecurity,
    timeoutInterval = DEFAULT_TIMEOUT_MS,
    maxRetries = DEFAULT_MAX_RETRIES,
    retryDelayMs = 0,
    ...rest
  } = options;

  if (rest?.signal) {
    delete rest.signal;
  }
  consoleLogFunc("pinnedFetch", rest);

  const doRequest = (attempt) =>
    fetch(url, {
      ...rest,
      sslPinning: PINNED_CERTS,
      disableAllSecurity: false,
      timeoutInterval,
    });

  const runWithRetry = (attempt = 0) =>
    doRequest(attempt).catch((error) => {
      if (!isTimeoutError(error) || attempt >= maxRetries) {
        throw error;
      }
      const nextAttempt = attempt + 1;
      consoleLogFunc("pinnedFetch", { timeoutRetry: nextAttempt, maxRetries });
      const delay =
        typeof retryDelayMs === 'number' && retryDelayMs > 0
          ? Promise.resolve(undefined).then(() => new Promise((r) => setTimeout(r, retryDelayMs)))
          : Promise.resolve();
      return delay.then(() => runWithRetry(nextAttempt));
    });

  return runWithRetry(0);
};

export const PINNED_FETCH_CERTS = PINNED_CERTS;
