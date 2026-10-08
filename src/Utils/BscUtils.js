import Singleton from "../Singleton";
import idaAbi from "../idaAbi.json";
import { consoleLogFunc } from "./MethodsUtils";
import { ethers } from "ethers";

const testnetUrlBNB = Singleton.getInstance().BSC_RPC_URL;
const provider = new ethers.providers.JsonRpcProvider(testnetUrlBNB);
export const getBnbBal = async (walletAddress) => {
  try {
    const balance = await provider.getBalance(walletAddress); // Will return balance in wei
    // const balance = await getBalance(walletAddress, 'binance'); // Will return balance in wei
    consoleLogFunc('getBnbBal---balance',balance );
    const bnbBalance = ethers.utils.formatEther(balance); // Convert wei to ETH
    consoleLogFunc("BNB Balance:", bnbBalance);
    return bnbBalance;
  } catch (error) {
    console.error("Error fetching BNB balance:", error);
    return null;
  }
};

export const bnbDataEncode = async (tokenAdrs, toAdrs, amountSent) => {
  try {
    consoleLogFunc("----------------------- tokenAdrs ", tokenAdrs);
    consoleLogFunc("----------------------- toAdrs ", toAdrs);
    consoleLogFunc("----------------------- amountSent ", amountSent.toString());
    
    const contract = new ethers.Contract(tokenAdrs, idaAbi, provider);
    // const contract = getContract(tokenAdrs, idaAbi, 'binance');

    const parsedAmount = ethers.BigNumber.from(amountSent.toString());
    const dataEncoded = contract.interface.encodeFunctionData("transfer", [
      toAdrs,
      parsedAmount,
    ]);

    consoleLogFunc("----------------------- dataEncoded ethers", dataEncoded);
    return dataEncoded;
  } catch (error) {
    consoleLogFunc("----------------------- dataEncoded error ", error);
  }
};

export const getBnbRaw = async (
  amount,
  toAddress,
  nonce,
  gasPriceTxn,
  gasLimitTxn,
  chainID,
  pvtKey
) => {
  return new Promise(async (resolve, reject) => {
    try {
      const wallet = new ethers.Wallet(pvtKey);
      // const wallet = getWallet(pvtKey,'binance');
      consoleLogFunc('getBnbRaw---wallet', wallet);
      
      const rawTxn = {
        nonce,
        gasPrice: gasPriceTxn,
        gasLimit: gasLimitTxn + 100,
        to: toAddress,
        value: ethers.utils.parseEther(amount).toHexString(),
        data: 0,
        chainId: chainID,
      };

      consoleLogFunc("RAW TXN BNB:", rawTxn);
      resolve((await wallet.signTransaction(rawTxn)).slice(2));
    } catch (error) {
      console.error("Error signing transaction:", error);
      reject(error);
    }
  });
};

export const sendTokenBNB = async (
  toAddress,
  encodeData,
  nonce,
  gasPriceTxn,
  gasLimitTxn,
  chainID,
  pvtKey,
) => {
  return new Promise(async (resolve, reject) => {
    try {
      // const address = getCryptoAddress(coin_family);
      const wallet = new ethers.Wallet(pvtKey);

      const rawTxn = {
        nonce,
        gasPrice: gasPriceTxn,
        gasLimit: gasLimitTxn + 100,
        to: toAddress,
        value: 0,
        data: encodeData,
        chainId: chainID,
      };

      resolve((await wallet.signTransaction(rawTxn)).slice(2));
    } catch (error) {
      console.error("Error signing transaction:", error);
      reject(error);
    }
  });
};

