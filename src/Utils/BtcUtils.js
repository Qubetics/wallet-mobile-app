import { IS_PRODUCTION } from "../EndPoint";
import { saveData } from "./MethodsUtils";
const bitcore = require("bitcore-lib");
const bitcoin = require("bitcoinjs-lib");

/************************************** Generate BTC Wallet ************************************/





/************************************** convertBtcPrivateKeyToAddress ************************************/
export const convertBtcPrivateKeyToAddress = (privatekey) => {
  const bitcoin = require('bitcoinjs-lib');
  const privateKeyWIF = privatekey;
  const network = bitcoin.networks.bitcoin;
  try {
    const keyPair = bitcoin.ECPair.fromWIF(privateKeyWIF, network);
    const { address } = bitcoin.payments.p2wpkh({ pubkey: keyPair.publicKey, network });
    saveData(address + "_pk", privatekey);
    return { btc_address: address, btcprivateKey: privatekey };
  } catch (error) {
    console.error("Error deriving address:", error);
    return { btc_address: undefined, btcprivateKey: privatekey };
  }

};
/************************************** Validate BTC Address ************************************/
export const validateBTCAddress = (text, isProduction = IS_PRODUCTION) => {
  return bitcore.Address.isValid(
    text,
    isProduction == 0 ? bitcore.Networks.testnet : bitcore.Networks.mainnet
  );
};

// export const validateBTCAddress = (text, isProduction = IS_PRODUCTION) => {
//   const network = isProduction == 0 ? bitcore.Networks.testnet : bitcore.Networks.mainnet;

//   // First check if address is valid
//   const isValid = bitcore.Address.isValid(text, network);

//   if (!isValid) return false;

//   // Only allow P2PKH format
//   const address = new bitcore.Address(text, network);
//   return address.type === bitcore.Address.PayToPublicKeyHash;
// };



export function isValidBitcoinPrivateKey(privateKey) {
  try {
    bitcoin.ECPair.fromWIF(privateKey);
    return true;
  } catch (e) {
    return false;
  }
}
