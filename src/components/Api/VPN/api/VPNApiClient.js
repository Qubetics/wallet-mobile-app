// api/VPNApiClient.js

import { pinnedFetch } from "../../../../Utils/pinnedFetch";
import { getAccessToken, refreshTokenIfNeeded } from "./authWithCosmosWallet";
import * as Constants from "../../../../Constants";
import { consoleLogFunc, getData } from "../../../../Utils/MethodsUtils";
import { EventRegister } from "react-native-event-listeners";

export const VPNApiClient = async (
  endpoint,
  method = "GET",
  data = null,
  token = ""
) => {
  let accessToken = token || (await getAccessToken());

  const headers = {
    "Content-Type": "application/json",
    ...(accessToken && { Authorization: `Bearer ${accessToken}` }),
  };

  const isGet = method.toUpperCase() === "GET";
  const baseUrl = Constants.VPN_BASE_URL;
  
  const url =
    isGet && data
      ? `${baseUrl}${endpoint}?${new URLSearchParams(data).toString()}`
      : `${baseUrl}${endpoint}`;
consoleLogFunc("data>>>>>>>>>>", data);
  const options = {
    method,
    headers,
    ...(isGet ? {} : { body: JSON.stringify(data) }),
  };

  consoleLogFunc("📡 Request →", url);

  try {
    let response = await pinnedFetch(url, options);

    if (response.status === 401) {
      try {
        accessToken = await refreshTokenIfNeeded();
        options.headers["Authorization"] = `Bearer ${accessToken}`;
        response = await pinnedFetch(url, options);
      } catch (refreshErr) {
        throw new Error("Session expired. Please login again.");
      }
    }

    const result = await response.json();

    if (response.status !== 200) {
      consoleLogFunc("❌ API Error:",endpoint, result);
      throw new Error(result?.message || "API request failed");
    }

    return result;
  } catch (err) {
    if (err.name === "AbortError") {
      consoleLogFunc("❌ Fetch Error: Request timed out");
      throw new Error("Request timed out");
    } else {
      consoleLogFunc("❌ Fetch Error:", err);
      consoleLogFunc("❌ Fetch Error:", err.message);
      throw err?.message || "Something went wrong";
    }
  } finally {
    // clearTimeout(timeout);
  }
};

