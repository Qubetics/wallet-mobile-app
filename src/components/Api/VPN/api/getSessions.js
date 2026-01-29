import * as Constants from "../../../../Constants";
import { getData } from "../../../../Utils/MethodsUtils";
import { VPNApiClient } from "./VPNApiClient";

export const getSessions = async ({
  limit = 20,
  page = 1,
  order = "DESC",
} = {}) => {
  const token = await getData(Constants.VPN_ACCESS_TOKEN);

  let queryParams = {
    limit,
    page,
    order,
  };

  return await VPNApiClient("/api/user-sessions", "GET", queryParams, token);
};
