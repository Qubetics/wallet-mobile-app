// api/getRandomNode.js

import * as Constants from "../../../../Constants";
import { getData } from "../../../../Utils/MethodsUtils";
import { VPNApiClient } from "./VPNApiClient";

export const getRandomNode = async () => {
  const token = await getData(Constants.VPN_ACCESS_TOKEN);

  // No query params needed, just a GET request with auth
  return await VPNApiClient("/api/nodes/random", "GET", null, token);
};
