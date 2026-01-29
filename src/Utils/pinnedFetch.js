/**
 * Common fetch with SSL pinning using qubetics.cer (asset folder).
 * Use for VPN API and Chain Abstraction API calls.
 *
 * Cert: place qubetics.cer in assets; iOS/Android use name "qubetics" (no extension).
 */
import { fetch } from 'react-native-ssl-pinning';

const PINNED_CERTS = ['qubetics'];

/**
 * Fetch with SSL pinning (qubetics.cer). Same signature as global fetch.
 * @param {string} url - Request URL
 * @param {RequestInit & { sslPinning?: object, disableAllSecurity?: boolean }} options - Fetch options (method, headers, body, etc.)
 * @returns {Promise<Response>}
 */
export const pinnedFetch = (url, options = {}) => {
  const { sslPinning, disableAllSecurity, ...rest } = options;
  return fetch(url, {
    ...rest,
    sslPinning: sslPinning || { certs: PINNED_CERTS },
    disableAllSecurity: false,
  });
};

export const PINNED_FETCH_CERTS = PINNED_CERTS;
