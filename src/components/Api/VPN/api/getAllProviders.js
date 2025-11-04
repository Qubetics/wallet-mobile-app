import * as Constants from "../../../../Constants";
import { getData } from "../../../../Utils/MethodsUtils";
import { VPNApiClient } from "./VPNApiClient";

export const getAllProviders = async () => {
  const token = await getData(Constants.VPN_ACCESS_TOKEN);

  return await VPNApiClient("/api/provider", "GET", null, token);
};
