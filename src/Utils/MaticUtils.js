import { ethers } from "ethers";
import Singleton from "../Singleton";
import { getBalance, getWallet } from "./etherProviderUtils";
import { consoleLogFunc } from "./MethodsUtils";

const testnetUrlPol = Singleton.getInstance().MATIC_RPC_URL; //Constants.network == 'testnet' ? Constants.ETH_TESTNET_URL : Constants.ETH_MAINNET_URL
const provider = new ethers.providers.JsonRpcProvider(testnetUrlPol);
const coinType= 'polygon'

/************************************** Get matic Balance *****************************************/
// export const getMaticBal = async (walletAddress) => {
//   const web3 = new Web3(new Web3.providers.HttpProvider(Singleton.getInstance().MATIC_RPC_URL));
//   const balance = await web3.eth.getBalance(walletAddress); //Will give value in wei.
//   consoleLogFunc('chk matic balance::::::', balance / 10 ** 18);
//   return (balance / 10 ** 18);
// };

export const getMaticBal = async (walletAddress) => {
  try {
    const balance = await provider.getBalance(walletAddress); // Will return balance in wei
    // const balance = await getBalance(walletAddress, coinType); // Will return balance in wei
    consoleLogFunc('balance0000', balance);
    
    const polBalance = ethers.utils.formatEther(balance); // Convert wei to ETH
    consoleLogFunc("POL Balance:", polBalance);
    return polBalance;
  } catch (error) {
    console.error("Error fetching POL balance:", error);
    return null;
  }
};
// ************************************** Generate Matic signed raw *****************************************
// export const getMaticRaw = async (amount, toAddress, nonce, gasPriceTxn, gasLimitTxn, chainID, pvtKey, fromCrossChain = false) => {
//   const amountToSend = Web3.utils.toWei(amount, 'ether',);
//   consoleLogFunc(amount + 'klsdjnfklnsd  matic' + '-----chainID', chainID);
//   consoleLogFunc('in send matic');
//   return new Promise((resolve, reject) => {
//     try {

//       let rawTxn;
//       fromCrossChain ?
//         rawTxn = {
//           nonce: nonce,
//           gasPrice: gasPriceTxn,
//           gasLimit: (gasLimitTxn),
//           to: toAddress,
//           value: amountToSend,
//           from: Singleton.getInstance().defaultMaticAddress,
//           // data: '0x0',
//           chainId: chainID
//         } :
//         rawTxn = {
//           nonce: nonce,
//           gasPrice: gasPriceTxn,
//           gasLimit: gasLimitTxn,
//           to: toAddress,
//           value: amountToSend,
//           from: Singleton.getInstance().defaultMaticAddress,
//           data: '0x0',
//           chainId: chainID
//         }

//       consoleLogFunc("rawTxn>>>", rawTxn);

//       web3Matic.eth.accounts.signTransaction(rawTxn, pvtKey).then(res => {
//         consoleLogFunc("res111111>>>", res);
//         resolve(res.rawTransaction.slice(2));
//         // web3Matic.eth.sendSignedTransaction(res.rawTransaction).then(res => {
//         //   consoleLogFunc("res>>>", res);
//         // }).catch(error => {
//         //   consoleLogFunc("error>>>", error);
//         // })
//       })

//     } catch (error) {
//       reject(error)
//     }
//   })
// };

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
      // const wallet = getWallet(pvtKey, coinType);
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
// ************************************** Generate POL ERC-20 signed raw *****************************************
// export const getMaticTokenRaw = async (toAddress, encodeData, nonce, gasPriceTxn, gasLimitTxn, chainID, pvtKey,) => {
//   return new Promise((resolve, reject) => {
//     const rawTransaction = {
//       nonce: nonce,
//       gasPrice: gasPriceTxn,
//       gasLimit: gasLimitTxn,
//       to: toAddress,
//       value: '',
//       from: Singleton.getInstance().defaultMaticAddress,
//       data: encodeData,
//       chainId: chainID
//     };
//     web3Matic.eth.accounts.signTransaction(rawTransaction, pvtKey).then(res => {
//       resolve(res.rawTransaction.slice(2));
//     }).catch(error => {
//       reject(error);
//     });
//   })
// };

