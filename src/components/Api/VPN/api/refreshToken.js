// api/refreshToken.js

import { pinnedFetch } from "../../../../Utils/pinnedFetch";
import { getData, saveData } from "../../../../Utils/MethodsUtils";
import * as Constants from "../../../../Constants";

export const refreshTokenIfNeeded = async () => {
  try {
    const refreshToken = await getData(Constants.VPN_REFRESH_TOKEN);

    if (!refreshToken) {
      throw new Error("No refresh token found");
    }


    
    // Use domain URL directly - Android's system DNS is fast and cached
    const baseUrl = Constants.VPN_BASE_URL;

    const response = await pinnedFetch(`${baseUrl}/api/user/refresh`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        refresh_token: refreshToken,
      },
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result?.message || "Failed to refresh token");
    }

    const newAccessToken = result?.data?.accessToken;
    const newRefreshToken =
      result?.data?.refreshToken || result?.data?.refershToken;

    if (newAccessToken && newRefreshToken) {
      await saveData(Constants.VPN_ACCESS_TOKEN, newAccessToken);
      await saveData(Constants.VPN_REFRESH_TOKEN, newRefreshToken);
      return newAccessToken;
    }

    throw new Error("Invalid token refresh response");
  } catch (error) {
    console.error("❌ Refresh token error:", error.message || error);
    throw new Error(`Unauthorized & refresh failed: ${error.message}`);
  }
};
