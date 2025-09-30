// api/VPNApiClient.js

import { refreshTokenIfNeeded } from "./refreshToken";
import * as Constants from "../../../../Constants";
import { getData } from "../../../../Utils/MethodsUtils";

export const VPNApiClient = async (
  endpoint,
  method = "GET",
  data = null,
  token = ""
) => {
  let accessToken = token || (await getData(Constants.VPN_ACCESS_TOKEN));
  let refreshToken = await getData(Constants.VPN_REFRESH_TOKEN);
  console.warn("accessToken →", accessToken);
  console.warn("refreshToken →", refreshToken);

  const headers = {
    "Content-Type": "application/json",
    ...(accessToken && { Authorization: `Bearer ${accessToken}` }),
  };

  const isGet = method.toUpperCase() === "GET";
  const url =
    isGet && data
      ? `${Constants.VPN_BASE_URL}${endpoint}?${new URLSearchParams(data).toString()}`
      : `${Constants.VPN_BASE_URL}${endpoint}`;

  const options = {
    method,
    headers,
    ...(isGet ? {} : { body: JSON.stringify(data) }),
  };

  console.warn("📡 Request →", method, url, options);

  // Create an AbortController for timeout
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 180000); // 180,000 ms = 3 minutes
  options.signal = controller.signal;

  try {
    let response = await fetch(url, options);

    // Try refreshing token on 401
    if (response.status === 401) {
      console.warn("🔁 Refreshing token…");

      try {
        accessToken = await refreshTokenIfNeeded();
        options.headers["Authorization"] = `Bearer ${accessToken}`;
        response = await fetch(url, options); // Retry
      } catch (refreshErr) {
        console.error("❌ Token refresh failed:", refreshErr);
        throw new Error("Session expired. Please login again.");
      }
    }

    const result = await response.json();

    if (!response.ok) {
      console.error("❌ API Error:", result);
      throw new Error(result?.message || "API request failed");
    }

    console.warn("✅ Response →", result);
    return result;
  } catch (err) {
    if (err.name === "AbortError") {
      console.error("❌ Fetch Error: Request timed out");
      throw new Error("Request timed out");
    } else {
      console.error("❌ Fetch Error:", err.message);
      throw err.message;
    }
  } finally {
    clearTimeout(timeout);
  }
};

