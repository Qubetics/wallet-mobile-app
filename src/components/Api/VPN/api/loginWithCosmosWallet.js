// api/loginWithCosmosWallet.js

import { VPNApiClient } from "./VPNApiClient";
import * as Constants from "../../../../Constants";
import { consoleLogFunc, saveData } from "../../../../Utils/MethodsUtils";

export const loginWithCosmosWallet = async ({
  wallet_address,
  pubKey,
  signatureBase64,
}) => {
  const body = {
    wallet_address,
    pubKey,
    signature: {
      pub_key: {
        type: "tendermint/PubKeySecp256k1",
        value: pubKey,
      },
      signature: signatureBase64,
    },
  };

  consoleLogFunc("🚀 Sending login payload:", body);

  const result = await VPNApiClient("/api/user/login", "POST", body);
  consoleLogFunc("🚀 loginWithCosmosWallet ----->>>:", result);

  if (result?.data?.accessToken) {
    await saveData(Constants.VPN_ACCESS_TOKEN, result.data.accessToken);
    await saveData(Constants.VPN_REFRESH_TOKEN, result?.data?.refreshToken);
    consoleLogFunc("🔑 Tokens saved locally");
  }

  return result;
};
