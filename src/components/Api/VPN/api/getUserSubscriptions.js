
import * as Constants from "../../../../Constants";
import { getData } from "../../../../Utils/MethodsUtils";
import { VPNApiClient } from "./VPNApiClient";

export const getUserSubscriptions = async ({
  limit = 10,
  page = 1,
  order = "ASC",
} = {}) => {
  const token = await getData(Constants.VPN_ACCESS_TOKEN);
  const refrestoken = await getData(Constants.VPN_REFRESH_TOKEN);
  console.log("token---->>>", token);
  console.log("refrestoken---->>>", refrestoken);
  const queryParams = {
    limit,
    page,
    order,
  };

  return await VPNApiClient("/api/subscription", "GET", queryParams, token);
};
