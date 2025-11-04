import * as Constants from "../../../../Constants";
import { getData } from "../../../../Utils/MethodsUtils";
import { VPNApiClient } from "./VPNApiClient";

export const getRecentProviders = async () => {
  const token = await getData(Constants.VPN_ACCESS_TOKEN);

  return await VPNApiClient("/api/provider/recent", "GET", null, token);
};
