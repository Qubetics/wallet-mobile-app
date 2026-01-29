import { consoleLogFunc } from './MethodsUtils';
import { Platform, NativeModules } from 'react-native';

// Simple in-memory cache for DNS resolutions
const dnsCache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

/**
 * Checks if a string is an IP address (IPv4)
 */
const isIPAddress = (str) => {
  const ipv4Regex = /^(\d{1,3}\.){3}\d{1,3}$/;
  if (!ipv4Regex.test(str)) return false;
  
  const parts = str.split('.');
  return parts.every(part => {
    const num = parseInt(part, 10);
    return num >= 0 && num <= 255;
  });
};

/**
 * Extracts hostname and port from URL
 */
const extractHostnameAndPort = (url) => {
  try {
    const protocolMatch = url.match(/^(https?):\/\//);
    const protocol = protocolMatch ? protocolMatch[1] : 'http';
    
    // Remove protocol
    let cleanUrl = url.replace(/^https?:\/\//, '');
    
    // Extract hostname and port
    const hostPortMatch = cleanUrl.match(/^([^:\/]+)(?::(\d+))?/);
    if (!hostPortMatch) {
      return { hostname: cleanUrl.split('/')[0], port: null, protocol };
    }
    
    const hostname = hostPortMatch[1];
    const explicitPort = hostPortMatch[2] ? parseInt(hostPortMatch[2], 10) : null;
    
    // Default ports for protocols
    const defaultPort = protocol === 'https' ? 443 : 80;
    const port = explicitPort || defaultPort;
    
    return { hostname, port, protocol, explicitPort: explicitPort !== null };
  } catch (e) {
    return { hostname: url, port: 443, protocol: 'https', explicitPort: false };
  }
};

/**
 * Resolves domain to IP using DNS-over-HTTP (Cloudflare)
 * Fallback method when native DNS resolution is not available
 */
const resolveDNSOverHTTP = async (hostname) => {
  // Create AbortController for timeout
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
  
  try {
    // Use Cloudflare's DNS-over-HTTP service
    const response = await fetch(`https://cloudflare-dns.com/dns-query?name=${hostname}&type=A`, {
      method: 'GET',
      headers: {
        'Accept': 'application/dns-json',
      },
      signal: controller.signal,
    });
    
    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`DNS query failed: ${response.status}`);
    }

    const data = await response.json();
    
    if (data.Answer && data.Answer.length > 0) {
      // Get the first A record (IPv4 address)
      const ip = data.Answer.find(answer => answer.type === 1)?.data;
      if (ip && isIPAddress(ip)) {
        return ip;
      }
    }
    
    throw new Error('No A record found in DNS response');
  } catch (error) {
    clearTimeout(timeoutId); // Ensure timeout is cleared on error
    consoleLogFunc('DNS-over-HTTP resolution failed:', error.message);
    throw error;
  }
};

/**
 * Pre-warms DNS cache by resolving domain to IP
 * This helps speed up subsequent API calls by having DNS already resolved
 * 
 * @param {string} url - URL with domain or IP address
 * @returns {Promise<void>} - Resolves when DNS is cached (doesn't return URL)
 */
export const preWarmDNS = async (url) => {
  try {
    if (!url) {
      return;
    }

    const { hostname } = extractHostnameAndPort(url);
    
    // If already an IP address, no need to resolve
    if (isIPAddress(hostname)) {
      return;
    }

    // Check if already cached
    const cached = dnsCache.get(hostname);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      consoleLogFunc('✅ DNS already cached for:', hostname);
      return;
    }

    // Pre-warm DNS using native resolver (fast) or DNS-over-HTTP (fallback)
    consoleLogFunc('🔥 Pre-warming DNS for:', hostname);
    
    try {
      // ✅ When WireGuard VPN (wg0) is active, DNS automatically uses WireGuard's DNS servers
      // (1.1.1.1, 8.8.8.8, 9.9.9.9) configured in the VPN tunnel
      // No need for native DNS resolution - system DNS will route through WireGuard
      // Just use DNS-over-HTTP as fallback for pre-warming before VPN connects
      const resolvedIP = await resolveDNSOverHTTP(hostname);
      dnsCache.set(hostname, {
        ip: resolvedIP,
        timestamp: Date.now(),
      });
      consoleLogFunc('✅ DNS pre-warmed:', hostname, '→', resolvedIP);
    } catch (error) {
      consoleLogFunc('⚠️ DNS pre-warming failed (non-critical):', error.message);
      // Don't throw - pre-warming is optional
    }
  } catch (error) {
    consoleLogFunc('⚠️ DNS pre-warming error (non-critical):', error.message);
    // Don't throw - pre-warming is optional
  }
};

/**
 * Clears the DNS cache
 */
export const clearDNSCache = () => {
  dnsCache.clear();
  consoleLogFunc('🗑️ DNS cache cleared');
};

