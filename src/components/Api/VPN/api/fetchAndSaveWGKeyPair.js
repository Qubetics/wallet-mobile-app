import { generateWGKeyPair } from "../../../common/WireGuardNative";
import * as Constants from "../../../../Constants";
import { consoleLogFunc, getData, saveData } from "../../../../Utils/MethodsUtils";

export const fetchAndSaveWGKeyPair = async () => {
  let privateKey = await getData(Constants.WG_PRIVATE_KEY);
  let publicKey = await getData(Constants.WG_PUBLIC_KEY);

  let isNewKey = false;

  if (!privateKey || !publicKey) {
    const keyPair = await generateWGKeyPair();

    if (!keyPair) {
      console.error("❌ Failed to generate WireGuard key pair");
      return;
    }

    privateKey = keyPair.privateKey;
    publicKey = keyPair.publicKey;

    await saveData(Constants.WG_PRIVATE_KEY, privateKey);
    await saveData(Constants.WG_PUBLIC_KEY, publicKey);

    isNewKey = true;

    consoleLogFunc("✅ Generated & saved new WireGuard keys");
  } else {
    consoleLogFunc("✅ WireGuard keys already exist");
  }
};
