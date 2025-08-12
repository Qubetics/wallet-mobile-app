// api/getAppVersion.js

import * as Constants from "../../../../Constants";
import { getData } from "../../../../Utils/MethodsUtils";
import { VPNApiClient } from "./VPNApiClient";

export const getAppVersion = async () => {
  const token = await getData(Constants.VPN_ACCESS_TOKEN);

  return await VPNApiClient(
    "/api/app/version", // Endpoint
    "GET",              // Method
    {},                 // No query params for this API
    token               // Access token
  );
};
