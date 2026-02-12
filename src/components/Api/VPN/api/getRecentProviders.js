import { getAccessToken } from "./authWithCosmosWallet";
import { VPNApiClient } from "./VPNApiClient";

export const getRecentProviders = async () => {
  const token = await getAccessToken();

  return await VPNApiClient("/api/provider/recent", "GET", null, token);
};
