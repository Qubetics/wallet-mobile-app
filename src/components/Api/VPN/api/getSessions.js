import * as Constants from "../../../../Constants";
import { getData } from "../../../../Utils/MethodsUtils";
import { VPNApiClient } from "./VPNApiClient";

export const getSessions = async ({
  limit = 100,
  page = 1,
  order = "DESC",
  count_total = true,
} = {}) => {
  const token = await getData(Constants.VPN_ACCESS_TOKEN);

  let queryParams = {
    limit,
    page,
    order,
    count_total
  };

  return await VPNApiClient("/api/user-sessions", "GET", queryParams, token);
};
