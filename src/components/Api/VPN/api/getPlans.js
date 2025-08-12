// api/getPlans.js

import * as Constants from "../../../../Constants";
import { getData } from "../../../../Utils/MethodsUtils";
import { VPNApiClient } from "./VPNApiClient";

export const getPlans = async ({
  limit = 10,
  page = 1,
  order = "ASC",
  count_total = false,
  reverse = false,
  planId = "",
} = {}) => {
  const token = await getData(Constants.VPN_ACCESS_TOKEN);
  const queryParams = {
    limit,
    page,
    order,
    count_total,
    reverse,
  };

  if (planId) {
    queryParams.planId = planId;
  }
  return await VPNApiClient("/api/plans", "GET", queryParams, token);
};
