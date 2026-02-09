
import * as Constants from "../../../../Constants";
import { consoleLogFunc, getData } from "../../../../Utils/MethodsUtils";
import { VPNApiClient } from "./VPNApiClient";

export const getUserSubscriptions = async ({
  limit = 10,
  page = 1,
  order = "ASC",
} = {}) => {
  const token = await getData(Constants.VPN_ACCESS_TOKEN);
  const refrestoken = await getData(Constants.VPN_REFRESH_TOKEN);
  const queryParams = {
    limit,
    page,
    order,
  };

  return await VPNApiClient("/api/subscription", "GET", queryParams, token);
};

export const getRenewPlanListApi = async ({order = "ASC"} = {}) => {
  const token = await getData(Constants.VPN_ACCESS_TOKEN);
  const refrestoken = await getData(Constants.VPN_REFRESH_TOKEN);
  const queryParams = {
  
  };
  return await VPNApiClient("/api/subscription/renew", "GET", queryParams, token);
};