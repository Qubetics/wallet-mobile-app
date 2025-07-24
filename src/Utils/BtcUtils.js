import * as Constants from "../Constants";
import { IS_PRODUCTION } from "../EndPoint";
import { saveData } from "./MethodsUtils";
const bitcore = require("bitcore-lib");
const bitcoin = require("bitcoinjs-lib");
const bip32 = require("bip32");

/************************************** Generate BTC Wallet ************************************/
export const generateBTCAddress = (mnemonics) => {
  const BIP84 = require("bip84");
  var root = new BIP84.fromSeed(
    mnemonics,
    "",
    Constants.network == "testnet" ? true : false
  );
  var child0 = root.deriveAccount(0);
  var account0 = new BIP84.fromZPrv(child0);
  return {
    btcAddress: account0.getAddress(0),
    btc_pvtKey: account0.getPrivateKey(0),
  }; //account0;
};

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
export const validateBTCAddress = (text) => {
  return bitcore.Address.isValid(
    text,
    IS_PRODUCTION == 0 ? bitcore.Networks.testnet : bitcore.Networks.mainnet
  );
};


const delay = (time) => new Promise((resolve) => setTimeout(resolve, time));

export function isValidBitcoinPrivateKey(privateKey) {
  try {
    bitcoin.ECPair.fromWIF(privateKey);
    return true;
  } catch (e) {
    return false;
  }
}
