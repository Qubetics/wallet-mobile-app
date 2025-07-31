import * as Constants from "../Constants";
import { IS_PRODUCTION } from "../EndPoint";
import { saveData } from "./MethodsUtils";
const bitcore = require("bitcore-lib");
const bitcoin = require("bitcoinjs-lib");
const bip32 = require("bip32");
const BIP84 = require("bip84");

/************************************** Generate BTC Wallet ************************************/
export const generateBTCAddress = (mnemonics) => {
  console.log('root----BTC', root);

  var root = new BIP84.fromSeed(
    mnemonics,
    "",
    true
  );
  console.log('root----BTC', root);
  
  var child0 = root.deriveAccount(0);
  console.log('child0----BTC', child0);

  var account0 = new BIP84.fromZPrv(child0);
  console.log('account0----BTC', account0);
  console.log(
    '🚀 ~ BTCHelper ~ generateBitcoinAddressTestnet= ~ account0:',
    account0,
    account0.getAddress(0),
    account0.getAccountPrivateKey(0)
  );
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
