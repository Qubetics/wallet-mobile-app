// api/refreshToken.js

import { getData, saveData } from "../../../../Utils/MethodsUtils";
import * as Constants from "../../../../Constants";

export const refreshTokenIfNeeded = async () => {
  try {
    const refreshToken = await getData(Constants.VPN_REFRESH_TOKEN);
    const accessToken = await getData(Constants.VPN_ACCESS_TOKEN);
    console.log("🔐 Access Token:", accessToken);
    console.log("🔐 Refresh Token:", refreshToken);

    if (!refreshToken) {
      throw new Error("No refresh token found");
    }

    const response = await fetch("http://119.8.184.156:7000/api/user/refresh", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        refresh_token: refreshToken,
      },
    });

    const result = await response.json();
    console.log("🔁 Refresh response:", result);

    if (!response.ok) {
      throw new Error(result?.message || "Failed to refresh token");
    }

    const newAccessToken = result?.data?.accessToken;
    const newRefreshToken =
      result?.data?.refreshToken || result?.data?.refershToken;

    if (newAccessToken && newRefreshToken) {
      await saveData(Constants.VPN_ACCESS_TOKEN, newAccessToken);
      await saveData(Constants.VPN_REFRESH_TOKEN, newRefreshToken);
      console.log("🔁 Access token refreshed");
      return newAccessToken;
    }

    throw new Error("Invalid token refresh response");
  } catch (error) {
    console.error("❌ Refresh token error:", error.message || error);
    throw new Error(`Unauthorized & refresh failed: ${error.message}`);
  }
};
