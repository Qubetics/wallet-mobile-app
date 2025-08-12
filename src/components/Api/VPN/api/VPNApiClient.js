// api/VPNApiClient.js

import { refreshTokenIfNeeded } from "./refreshToken";
import * as Constants from "../../../../Constants";
import { getData } from "../../../../Utils/MethodsUtils";

const VPN_BASE_URL = "http://119.8.184.156:7000";

export const VPNApiClient = async (
  endpoint,
  method = "GET",
  data = null,
  token = ""
) => {
  let accessToken = token || (await getData(Constants.VPN_ACCESS_TOKEN));
  let refreshToken = await getData(Constants.VPN_REFRESH_TOKEN);
  console.log("accessToken →", accessToken);
  console.log("refreshToken →", refreshToken);

  const headers = {
    "Content-Type": "application/json",
    ...(accessToken && { Authorization: `Bearer ${accessToken}` }),
  };

  const isGet = method.toUpperCase() === "GET";
  const url =
    isGet && data
      ? `${VPN_BASE_URL}${endpoint}?${new URLSearchParams(data).toString()}`
      : `${VPN_BASE_URL}${endpoint}`;

  const options = {
    method,
    headers,
    ...(isGet ? {} : { body: JSON.stringify(data) }),
  };

  console.log("📡 Request →", method, url, options);

  try {
    let response = await fetch(url, options);

    // Try refreshing token on 401
    if (response.status === 401) {
      console.log("🔁 Refreshing token…");

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

    console.log("✅ Response →", result);
    return result;
  } catch (err) {
    console.error("❌ Fetch Error:", err.message);
    throw err.message;
  }
};
