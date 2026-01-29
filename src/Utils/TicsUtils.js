import { ethers } from "ethers";
import Singleton from "../Singleton";
import Web3 from 'web3';
import ticsAbi from "../ticsAbi.json";
import { COIN_INFO_BY_FAMILY } from "../Constants";
import { consoleLogFunc } from "./MethodsUtils";
const ChainAbstractionAbi = require("../chainAbstractionAbi.json");

/************************************** Get matic Balance *****************************************/
export const getTicsBal = async (walletAddress) => {
  const web3 = new Web3(new Web3.providers.HttpProvider(Singleton.getInstance().TICS_RPC_URL));
  const balance = await web3.eth.getBalance(walletAddress); //Will give value in wei.
  return (balance / 10 ** 18);
};


// const testnetUrlEth = Singleton.getInstance().ETH_RPC_URL; //Constants.network == 'testnet' ? Constants.ETH_TESTNET_URL : Constants.ETH_MAINNET_URL
// const provider =  new ethers.providers.JsonRpcProvider(testnetUrlEth);
// const coinType= 'ethereum'

let ticsProvider = null;

const getTicsProvider = () => {
  if (!ticsProvider) {
    const rpcUrl = Singleton.getInstance().TICS_RPC_URL;
    // const rpcUrl = 'https://rpc-testnet.qubetics.work';   // for only chain Abstraction testnet
    ticsProvider = new ethers.providers.JsonRpcProvider(rpcUrl);
    consoleLogFunc('TICS Provider initialized');
  }
  return ticsProvider;
};

const getTicsContract = (address, abi) => {
  return new ethers.Contract(address, abi, getTicsProvider());
};

const getTicsWallet = (privateKey) => {
  return new ethers.Wallet(privateKey, getTicsProvider());
};

const getTicsBalance = async (address) => {
  const provider = getTicsProvider();
  const balance = await provider.getBalance(address);
  return balance.toHexString();
};

const getTicsTransactionCount = async (address) => {
  return await getTicsProvider().getTransactionCount(address, 'latest');
};

const getTicsFeeData = async () => {
  return await getTicsProvider().getFeeData();
};

const getTicsPriorityFee = async () => {
  return await getTicsProvider().send('eth_maxPriorityFeePerGas', []);
};

const getTicsGasPrice = async () => {
  return await getTicsProvider().getGasPrice();
};

const estimateTicsGas = async (transaction) => {
  return await getTicsProvider().estimateGas(transaction);
};

const sendTicsTransaction = async (rawTransaction) => {
  return await getTicsProvider().sendTransaction(rawTransaction);
};

const getTicsReceipt = async (txHash) => {
  return await getTicsProvider().getTransactionReceipt(txHash);
};

const getTicsNetwork = async () => {
  return await getTicsProvider().getNetwork();
};

const resetTicsProvider = () => {
  ticsProvider = null;
  consoleLogFunc('TICS provider reset');
};

const isTicsProviderInitialized = () => {
  return ticsProvider !== null;
};


const depositIntent = async (privateKey, fromAddress, toAddress, fromAmount,toAmount, hash, fromToken, toToken) => {
  try {
  const provider = getTicsProvider();
  const wallet = new ethers.Wallet(privateKey).connect(provider);
  const tokenAddress = "0x" + "1379BD303fb4e4b11bd9b3473DC5670C47B96C4e";
  const contract = new ethers.Contract(
    tokenAddress,
    ChainAbstractionAbi,
    wallet
  );
  let fromTokenNew = fromToken?.coin_symbol
  let toTokenNew = toToken?.coin_symbol

  consoleLogFunc("intent_data", {
   fromAddress: fromAddress,
   toAddress: toAddress,
   sourceChain: getIntentChainId(fromToken?.coin_family),
    destinationChain: getIntentChainId(toToken?.coin_family),
    toAmount: toAmount,
    fromAmount: fromAmount,
    sourceToken: fromTokenNew,
    destinationToken: toTokenNew,
    byte: fromToken?.coin_symbol + "->" + toToken?.coin_symbol,
    intentHash: hash
  })
  const tx = await contract.depositIntent(
    fromAddress,
    toAddress,
    getIntentChainId(fromToken?.coin_family),
    getIntentChainId(toToken?.coin_family),
    toAmount,
    fromAmount,
    fromTokenNew,
    toTokenNew,
    ethers.utils.toUtf8Bytes(fromToken?.coin_symbol + "->" + toToken?.coin_symbol),
    hash
  );
  consoleLogFunc("depositIntentTics>>>", tx);
  


      return tx.hash; // or return signedTx if you need that instead
    } catch (error) {
      console.error("depositIntent error:", error);
      throw error;
    }
  

}

const getIntentChainId = (coinFamily) => {
  switch (coinFamily) {
    case 7:
      return "TICS";
    case 2:
      return "sepolia";
    case 3:
      return "BTC";
    default:
      return "TICS";
  }
}

function btcToSatoshi(btc) {
  return ethers.BigNumber.from(Math.floor(Number(btc) * 1e8).toString());
}

const ticsDataEncode = async (tokenAdrs, toAdrs, amountSent) => {
  try {
    consoleLogFunc("----------------------- tokenAdrs TICS ", tokenAdrs);
    consoleLogFunc("----------------------- toAdrs TICS ", toAdrs);
    consoleLogFunc("----------------------- amountSent TICS ", amountSent.toString());
    const provider = getTicsProvider();
    const contract = new ethers.Contract(tokenAdrs, ticsAbi, provider);
    // const contract = getContract(tokenAdrs, idaAbi, 'binance');

    const parsedAmount = ethers.BigNumber.from(amountSent.toString());
    const dataEncoded = contract.interface.encodeFunctionData("transfer", [
      toAdrs,
      parsedAmount,
    ]);

    consoleLogFunc("----------------------- dataEncoded ethers TICS", dataEncoded);
    return dataEncoded;
  } catch (error) {
    consoleLogFunc("----------------------- dataEncoded error TICS", error);
  }
};

export const sendTokenTics = async (
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
        gasPrice: chainID == 9029 ? gasPriceTxn : ethers.BigNumber.from(gasPriceTxn),
        gasLimit: gasLimitTxn,
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

// Export all utility functions
export {
  getTicsProvider,
  getTicsContract,
  getTicsWallet,
  getTicsBalance,
  getTicsFeeData,
  getTicsPriorityFee,
  getTicsTransactionCount,
  getTicsGasPrice,
  estimateTicsGas,
  sendTicsTransaction,
  getTicsReceipt,
  getTicsNetwork,
  resetTicsProvider,
  isTicsProviderInitialized,
  depositIntent,
  btcToSatoshi,
  ticsDataEncode
};


//in function call const contract = getTicsContract(tokenAdrs, idaAbi);