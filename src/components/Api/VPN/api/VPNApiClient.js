// api/VPNApiClient.js

import { refreshTokenIfNeeded } from "./refreshToken";
import * as Constants from "../../../../Constants";
import { consoleLogFunc, getData } from "../../../../Utils/MethodsUtils";
import { preWarmDNS } from "../../../../Utils/DnsResolver";

export const VPNApiClient = async (
  endpoint,
  method = "GET",
  data = null,
  token = ""
) => {
  let accessToken = token || (await getData(Constants.VPN_ACCESS_TOKEN));

  const headers = {
    "Content-Type": "application/json",
    "timeout": 180000,
    ...(accessToken && { Authorization: `Bearer ${accessToken}` }),
  };

  const isGet = method.toUpperCase() === "GET";
  const baseUrl = Constants.VPN_BASE_URL;
  
  const url =
    isGet && data
      ? `${baseUrl}${endpoint}?${new URLSearchParams(data).toString()}`
      : `${baseUrl}${endpoint}`;

  const options = {
    method,
    headers,
    ...(isGet ? {} : { body: JSON.stringify(data) }),
  };

  console.warn("📡 Request →", url);

  // Create an AbortController for timeout
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 180000); // 180,000 ms = 3 minutes
  options.signal = controller.signal;

  try {
    let response = await fetch(url, options, { timeout: 180000 });

    // Try refreshing token on 401
    if (response.status === 401) {
      console.warn("🔁 Refreshing token…");

      try {
        accessToken = await refreshTokenIfNeeded();
        options.headers["Authorization"] = `Bearer ${accessToken}`;
        response = await fetch(url, options); // Retry
      } catch (refreshErr) {
        consoleLogFunc("❌ Token refresh failed:", refreshErr);
        throw new Error("Session expired. Please login again.");
      }
    }

    const result = await response.json();

    if (!response.ok) {
      consoleLogFunc("❌ API Error:",endpoint, result);
      throw new Error(result?.message || "API request failed");
    }

    return result;
  } catch (err) {
    if (err.name === "AbortError") {
      consoleLogFunc("❌ Fetch Error: Request timed out");
      throw new Error("Request timed out");
    } else {
      consoleLogFunc("❌ Fetch Error:", err.message);
      throw err.message;
    }
  } finally {
    clearTimeout(timeout);
  }
};

