// api/getRandomNode.js
import { getAccessToken } from "./authWithCosmosWallet";
import { VPNApiClient } from "./VPNApiClient";

export const getRandomNode = async ({protocol = 'wireguard'}) => {
  const token = await getAccessToken();

  // No query params needed, just a GET request with auth
  return await VPNApiClient("/api/nodes/random?protocol=" + protocol, "GET", null, token);
};
