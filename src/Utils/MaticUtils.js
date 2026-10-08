import { ethers } from "ethers";
import Singleton from "../Singleton";
import { consoleLogFunc } from "./MethodsUtils";

const testnetUrlPol = Singleton.getInstance().MATIC_RPC_URL; //Constants.network == 'testnet' ? Constants.ETH_TESTNET_URL : Constants.ETH_MAINNET_URL
const provider = new ethers.providers.JsonRpcProvider(testnetUrlPol);

/************************************** Get matic Balance *****************************************/

export const getMaticBal = async (walletAddress) => {
  try {
    const balance = await provider.getBalance(walletAddress); // Will return balance in wei
    consoleLogFunc('balance0000', balance);
    
    const polBalance = ethers.utils.formatEther(balance); // Convert wei to ETH
    consoleLogFunc("POL Balance:", polBalance);
    return polBalance;
  } catch (error) {
    console.error("Error fetching POL balance:", error);
    return null;
  }
};

export const getMaticRaw = async (
  amount,
  toAddress,
  nonce,
  gasPriceTxn,
  gasLimitTxn,
  chainID,
  pvtKey,
  fromCrossChain = false
) => {
  return new Promise(async (resolve, reject) => {
    try {
      const wallet = new ethers.Wallet(pvtKey);
      const rawTxn = {
        nonce,
        gasPrice: gasPriceTxn,
        gasLimit: gasLimitTxn +100,
        to: toAddress,
        value: ethers.utils.parseEther(amount).toHexString(),
        from: Singleton.getInstance().defaultMaticAddress,
        ...(fromCrossChain === true && { data: "0x0" }),
        chainId: chainID,
      };

      consoleLogFunc("RAW TXN POL:", rawTxn);
      resolve((await wallet.signTransaction(rawTxn)).slice(2));
    } catch (error) {
      console.error("Error signing transaction:1", error);
      reject(error);
    }
  });
};

