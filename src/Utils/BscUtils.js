import Singleton from "../Singleton";
import Web3 from "web3";
import idaAbi from "../idaAbi.json";
import { consoleLogFunc, exponentialToDecimal, getData } from "./MethodsUtils";
const web3BNB = new Web3(Singleton.getInstance().BSC_RPC_URL);
import * as Constants from "../Constants";
import { ethers } from "ethers";
import { getBalance, getContract, getWallet } from "./etherProviderUtils";

const testnetUrlBNB = Singleton.getInstance().BSC_RPC_URL;
const provider = new ethers.providers.JsonRpcProvider(testnetUrlBNB);
// /************************************** Get Bnb Balance *****************************************/
// export const getBnbBal = async (walletAddress) => {
//   // const web3 = new Web3(new Web3.providers.HttpProvider(Singleton.getInstance().BSC_RPC_URL));
// const testnetUrlBNB = Singleton.getInstance().BSC_RPC_URL
// const provider =  new ethers.providers.JsonRpcProvider(testnetUrlBNB);
//   const balance = await provider.getBalance(walletAddress); //Will give value in wei.
//   consoleLogFunc('chk bsc balance::::::', balance / 10 ** 18);
//   return (balance / 10 ** 18);
// };
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

// /************************************** Generate bep-20 data encode *****************************************/
// export const bnbDataEncode = async (tokenAdrs, toAdrs, amountSent) => {
//   const testnetUrlBNB = Singleton.getInstance().BSC_RPC_URL
//   const provider =  new ethers.providers.JsonRpcProvider(testnetUrlBNB);
//   const contract = new ethers.Contract(tokenAdrs,idaAbi,provider);
//   let dataEncoded = await contract.methods.transfer(toAdrs, exponentialToDecimal(amountSent).toString()).encodeABI();
//   return dataEncoded;
// };

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
// ************************************** Generate BNB signed raw *****************************************
// export const getBnbRaw = async (amount, toAddress, nonce1, gasPriceTxn, gasLimitTxn, chainID, pvtKey) => {
//   const web3BNB = new Web3(chainID == 56 ? Singleton.getInstance().BSC_RPC_URL : Singleton.getInstance().MATIC_RPC_URL)

//   let multiWallet = await getData(Constants.MULTI_WALLET_LIST)
//   let multiWalletData = JSON.parse(multiWallet)
//   let currentWallet = multiWalletData.filter(el => el?.defaultWallet == true)[0]
//   const amountToSend = web3BNB.utils.toWei(amount, 'ether',);
//   consoleLogFunc(Singleton.getInstance().defaultBnbAddress);
//   const nonce = await web3BNB.eth.getTransactionCount(Singleton.getInstance().defaultBnbAddress, 'latest');
//   return new Promise((resolve, reject) => {
//     const rawTxn = {
//       nonce: nonce,
//       gasPrice: gasPriceTxn,
//       gasLimit: (gasLimitTxn + 100),
//       to: toAddress,
//       value: web3BNB.utils.toHex(amountToSend),
//       // from: Singleton.getInstance().defaultBnbAddress,
//       // data: '0x00',
//       chainId: chainID
//     }

//     consoleLogFunc("RAW-----", rawTxn, pvtKey)
//     try {

//       web3BNB.eth.accounts.signTransaction(rawTxn, pvtKey).then(res => {
//         consoleLogFunc("res-----", res)

//         resolve(res.rawTransaction.slice(2));
//       }).catch(err => {
//         consoleLogFunc("err1111-----", err)

//       })
//     } catch (error) {
//       consoleLogFunc("error-----", rawTerrorxn)

//     }

//   })
// };

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

// ************************************** Generate BEP-20 signed raw *****************************************
// export const sendTokenBNB = async (
//   toAddress,
//   encodeData,
//   nonce,
//   gasPriceTxn,
//   gasLimitTxn,
//   chainID,
//   pvtKey
// ) => {
//   return new Promise(async (resolve, reject) => {
//     const web3Instance = new Web3(
//       chainID == 56
//         ? Singleton.getInstance().BSC_RPC_URL
//         : Singleton.getInstance().MATIC_RPC_URL
//     );
//     const rawTransaction = {
//       nonce: nonce,
//       gasPrice: gasPriceTxn,
//       gasLimit: gasLimitTxn,
//       to: toAddress,
//       value: "",
//       data: encodeData,
//       chainId: chainID,
//     };
//     consoleLogFunc("RAW_DATA=====", rawTransaction);
//     web3BNB.eth.accounts
//       .signTransaction(rawTransaction, pvtKey)
//       .then((res) => {
//         resolve(res.rawTransaction.slice(2));
//       })
//       .catch((error) => {
//         reject(error);
//       });
//   });
// };

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

