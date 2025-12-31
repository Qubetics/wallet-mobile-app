import * as Constants from "../../../../Constants";
import { getData } from "../../../../Utils/MethodsUtils";
import { VPNApiClient } from "./VPNApiClient";

export const getAllProviders = async (params = {}) => {
  const token = await getData(Constants.VPN_ACCESS_TOKEN);

  return await VPNApiClient("/api/provider"+ (params.isRecent ? "/recent" : ""), "GET", null, token);
};

export const getActiveroviders = async () => {
  const token = await getData(Constants.VPN_ACCESS_TOKEN);

  return await VPNApiClient("/api/provider?isUserSubscribed=true", "GET", null, token);
};

