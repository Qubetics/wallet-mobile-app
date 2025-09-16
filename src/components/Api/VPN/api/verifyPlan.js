import * as Constants from "../../../../Constants";
import { getData } from "../../../../Utils/MethodsUtils";
import { VPNApiClient } from "./VPNApiClient";

// Verify Transaction and Save Plan
export const verifyPlan = async (planId, txHash) => {
  try {
    const token = await getData(Constants.VPN_ACCESS_TOKEN);

    if (!planId || !txHash) {
      throw new Error("Missing planId or txHash");
    }

    // ✅ Only txhash in body
    const body = {
      txhash: txHash,
    };

    return await VPNApiClient(`/api/plans/id`, "POST", body, token);
  } catch (err) {
    console.error("❌ verifyPlan error:", err);
    throw err;
  }
};
