import { ethers } from "ethers";
import * as Constants from "../Constants";
import Singleton from "../Singleton";
import idaAbi from "../idaAbi.json";
import nftAbi from '../nftAbi.json';
import { consoleLogFunc, saveData } from "./MethodsUtils";
import { getWallet } from "./etherProviderUtils";
import { getNft1155DataEncode } from "./nft1155Utils";

const testnetUrlEth = Singleton.getInstance().ETH_RPC_URL; //Constants.network == 'testnet' ? Constants.ETH_TESTNET_URL : Constants.ETH_MAINNET_URL
const provider =  new ethers.providers.JsonRpcProvider(testnetUrlEth);
const coinType= 'ethereum'
/************************************** Get Eth Balance *****************************************/
// export const getEthBal = async (walletAddress) => {
//   const web3 = new Web3(
//     new Web3.providers.HttpProvider(Singleton.getInstance().ETH_RPC_URL)
//   );
//   const balance = await web3.eth.getBalance(walletAddress); //Will give value in wei.
//   consoleLogFunc("chk eth balance::::::", balance / 10 ** 18);
//   return balance / 10 ** 18;
// };

// export const getEthBal = async (walletAddress) => {
//   return new Promise(async (resolve, reject) => {
//     try {
//       const balance = await provider.getBalance(walletAddress);
//       // const balance = await getBalance(walletAddress,coinType);

//       consoleLogFunc('balance is ::::::', balance);
//       resolve(ethers.utils.formatEther(balance));
//     } catch (error) {
//       console.error("Error signing transaction:eth", error);
//       reject(error);
//     }
//   });
// };

export const getEthBal = async (walletAddress, coinFamily = 2) => {
  return new Promise(async (resolve, reject) => {
    try {
      const provider =  new ethers.providers.JsonRpcProvider(coinFamily == 2 ? Singleton.getInstance().ETH_RPC_URL : Singleton.getInstance().TICS_RPC_URL);
      const balance = await provider.getBalance(walletAddress);
      // const balance = await getBalance(walletAddress,coinType);
      resolve(ethers.utils.formatEther(balance));
    } catch (error) {
      console.error("Error signing transaction:eth", error);
      reject(error);
    }
  });
};

/************************************** Generate ETH Wallet ************************************/
/************************************** Generate ETH Wallet ************************************/
export const convertPrivateKeyToAddress = (privateKey) => {
  try {
    const privateKeyToAddress = require("ethereum-private-key-to-address");
    const address = privateKeyToAddress(privateKey);
    // consoleLogFunc('eth address from pvt key::::', address);
    saveData(address + "_pk", privateKey);
    return { eth_address: address, privateKey: privateKey };
  } catch (e) {
    consoleLogFunc("exception", e);
  }
};
//************************************** validate ETH Address ************************************/
export const validateEthAddress = (text) => {
  const reg = Constants.ETH_REGEX;
  if (reg.test(text) === false) {
    consoleLogFunc("Eth Address is Not Correct");
    return false;
  } else {
    consoleLogFunc("Eth Address is Correct");
    return true;
  }
};
/************************************** Get ETH Fee *****************************************/
// export const getTotalGasFee = async () => {
//   // const web3 = createAlchemyWeb3(testnetUrlEth);
//   try {
//     consoleLogFunc(
//       "Singleton.getInstance().ETH_RPC_URL:::::",
//       Singleton.getInstance().ETH_RPC_URL
//     );
//     const web3Eth = new Web3(Singleton.getInstance().ETH_RPC_URL);
//     const totalgasPrice = await web3Eth.eth.getGasPrice();
//     consoleLogFunc("chk totalgasPrice::::::", totalgasPrice);
//     return totalgasPrice || 0;
//   } catch (error) {
//     consoleLogFunc("chk errrr getTotalGasFee:::::", error);
//   }
// };

  // export const getTotalGasFee = async () => {
  //   try {
  //     // consoleLogFunc("Gas gasPrice:provider", provider);

  //     const gasPrice = await provider.getGasPrice();
  //     // const gasPrice = await getGasPrice(coinType);
  //     consoleLogFunc("Gas gasPrice:", gasPrice);

  //     consoleLogFunc("Gas Price:", gasPrice.toString());
  //     consoleLogFunc("Gas Price (gwei):", ethers.utils.formatUnits(gasPrice, "gwei"));
  //   consoleLogFunc("Gas Price (ether):", ethers.utils.formatUnits(gasPrice, "ether"));
  //     return gasPrice.toString() || '0';
  //   } catch (error) {
  //     console.error("Error fetching network or gas price:", error);
  //   }
  // };

  export const getTotalGasFee = async (coinFamily = 2) => {
    try {
      const provider =  new ethers.providers.JsonRpcProvider(coinFamily == 2 ? Singleton.getInstance().ETH_RPC_URL : Singleton.getInstance().TICS_RPC_URL);

      const gasPrice = await provider.getGasPrice();
      return gasPrice.toString() || '0';
    } catch (error) {
      console.error("Error fetching network or gas price:", error);
    }
  };

  // export const EthDataEncode = async (tokenAdrs, toAdrs, amountSent) => {
  //   try {
  //     consoleLogFunc("----------------------- tokenAdrs ", tokenAdrs);
  //     consoleLogFunc("----------------------- toAdrs ", toAdrs);
  //     consoleLogFunc("----------------------- amountSent ", amountSent.toString());
  
  //     const contract = new ethers.Contract(tokenAdrs, idaAbi, provider);
  //     // const contract = getContract(tokenAdrs, idaAbi, coinType);
  //     const parsedAmount = ethers.BigNumber.from(amountSent.toString());
  //     const dataEncoded = contract.interface.encodeFunctionData("transfer", [
  //       toAdrs,
  //       parsedAmount,
  //     ]);
  
  //     consoleLogFunc("----------------------- dataEncoded ethers", dataEncoded);
  //     return dataEncoded;
  //   } catch (error) {
  //     consoleLogFunc("----------------------- dataEncoded error ", error);
  //   }
  // };
/************************************** Get ETH Fee *****************************************/
// export const getNonce = async () => {
//   try {
//     const web3 = createAlchemyWeb3(Singleton.getInstance().ETH_RPC_URL);
//     const nonce = await web3.eth.getTransactionCount(
//       Singleton.getInstance().defaultEthAddress,
//       "latest"
//     );
//     consoleLogFunc("chk nonce::::::", nonce);
//     return nonce;
//   } catch (error) {
//     consoleLogFunc("chk nonce err::::::", error);
//   }
// };
export const getNonce = async () => {
  try {
    const nonce = await provider.getTransactionCount(
      Singleton.getInstance().defaultEthAddress,
      "latest"
    );
    // const nonce = await getTransactionCount(
    //   Singleton.getInstance().defaultEthAddress,
    //   coinType
    // );
    consoleLogFunc("Ether Nonce:", nonce);
    return nonce;
  } catch (error) {
    console.error("Error fetching nonce:", error);
    return null;
  }
};
/************************************** Generate erc20 data encode *****************************************/
// export const EthDataEncode = async (tokenAdrs, toAdrs, amountSent) => {
//   try {
//     consoleLogFunc("----------------------- tokenAdrs ", tokenAdrs);
//     consoleLogFunc("----------------------- toAdrs ", toAdrs);
//     consoleLogFunc("----------------------- amountSent ", amountSent.toString());
//     const web3 = createAlchemyWeb3(Singleton.getInstance().ETH_RPC_URL);
//     var contract = new web3.eth.Contract(idaAbi, tokenAdrs);
//     let dataEncoded = await contract.methods
//       .transfer(toAdrs, exponentialToDecimal(amountSent).toString())
//       .encodeABI();
//     consoleLogFunc("----------------------- dataEncoded ", dataEncoded);
//     return dataEncoded;
//   } catch (error) {
//     consoleLogFunc("----------------------- dataEncoded error ", error);
//   }
// };

export const EthDataEncode = async (tokenAdrs, toAdrs, amountSent) => {
  try {
    consoleLogFunc("----------------------- tokenAdrs ", tokenAdrs);
    consoleLogFunc("----------------------- toAdrs ", toAdrs);
    consoleLogFunc("----------------------- amountSent ", amountSent.toString());

    const contract = new ethers.Contract(tokenAdrs, idaAbi, provider);
    // const contract = getContract(tokenAdrs, idaAbi, coinType);
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
/************************************** Generate ETH signed raw ************************************/
// export const createEthRaw = async (
//   my_address,
//   to_address,
//   pvt_key,
//   amount,
//   fromCrossChain = false
// ) => {
//   let multiWallet = await getData(Constants.MULTI_WALLET_LIST);
//   let multiWalletData = JSON.parse(multiWallet);
//   let currentWallet = multiWalletData.filter(
//     (el) => el?.defaultWallet == true
//   )[0];
//   consoleLogFunc("---------currentWallet", currentWallet);

//   try {
//     const web3Eth = new Web3(Singleton.getInstance().ETH_RPC_URL);
//     const web3 = createAlchemyWeb3(Singleton.getInstance().ETH_RPC_URL);
//     const amountToSend = web3.utils.toWei(amount.toString(), "ether");
//     const amountNew = web3.utils.toHex(amountToSend);
//     const priorityOrTip = await web3.eth.getMaxPriorityFeePerGas();
//     const nonce = await web3.eth.getTransactionCount(my_address, "latest");
//     const totalgasPrice = await web3Eth.eth.getGasPrice();
//     const defaultgaslimit = 23000;

//     let txData;
//     fromCrossChain
//       ? (txData = {
//         // data: '',
//         gasLimit: web3.utils.toHex(defaultgaslimit),
//         maxPriorityFeePerGas: priorityOrTip,
//         maxFeePerGas: web3.utils.toHex(totalgasPrice),
//         nonce: nonce,
//         to: to_address,
//         value: web3.utils.toHex(amountNew),
//         chainId: Constants.network == "testnet" ? "0x05" : "0x01",
//         accessList: [],
//         type: 2,
//       })
//       : (txData = {
//         data: "",
//         gasLimit: web3.utils.toHex(defaultgaslimit),
//         maxPriorityFeePerGas: priorityOrTip,
//         maxFeePerGas: web3.utils.toHex(totalgasPrice),
//         nonce: nonce,
//         to: to_address,
//         value: web3.utils.toHex(amountNew),
//         chainId: Constants.network == "testnet" ? "0x05" : "0x01",
//         accessList: [],
//         type: 2,
//       });

//     const common = new Common({
//       chain: Constants.network == "testnet" ? "goerli" : "mainnet",
//       hardfork: "london",
//     });
//     const tx = FeeMarketEIP1559Transaction.fromTxData(txData, { common });
//     const privateKey = pvt_key.includes("0x")
//       ? Buffer.from(pvt_key.substring(2), "hex")
//       : Buffer.from(pvt_key, "hex");
//     const signedTx = await tx.sign(privateKey);
//     const serializedTx = signedTx.serialize();
//     return { txn_hash: serializedTx.toString("hex"), nonce: nonce };

//     // }
//   } catch (error) {
//     consoleLogFunc("error:::::::::::::::", error);
//   }
// };

export const createEthRaw = async (
  my_address,
  to_address,
  pvt_key,
  amount,
  fromCrossChain = false,
  priorityOrTip,
) => {
  return new Promise(async (resolve, reject) => {
    try {
      // const wallet = new ethers.Wallet(pvt_key);
      consoleLogFunc('pvt_key---createEthRaw',pvt_key,'--',coinType);
      
      const wallet = getWallet(pvt_key,coinType);
      consoleLogFunc('wallet---createEthRaw',wallet);

      const amountToSend = ethers.utils.parseUnits(amount.toString(), "ether");
      consoleLogFunc('amountToSend---createEthRaw',amountToSend);

      const nonce =  await provider.getTransactionCount(
        Singleton.getInstance().defaultEthAddress,
        "latest"
      );
      consoleLogFunc('nonce---createEthRaw',nonce);

      // const nonce = await getTransactionCount(
      //   Singleton.getInstance().defaultEthAddress,
      //   coinType
      // );
      const maxFeePerGas = await provider.getGasPrice();
      // const maxFeePerGas = await getGasPrice(coinType);

      const defaultgaslimit = 23000;
      const maxPriorityFeePerGas = await provider.send("eth_maxPriorityFeePerGas", []);
      // const maxPriorityFeePerGas =await getMaxPriorityFee(coinType);

      
    consoleLogFunc("Max Priority Fee Per Gas:", ethers.utils.formatUnits(maxPriorityFeePerGas, "gwei"), "Gwei");
    consoleLogFunc("maxPriorityFeePerGas>>s:", maxPriorityFeePerGas);
    consoleLogFunc("maxPriorityFeePerGas>>s:", maxFeePerGas);


      let rawTxn;
      fromCrossChain
        ? (rawTxn = {
            // data: '',
            gasLimit: ethers.BigNumber.from(defaultgaslimit),
            maxPriorityFeePerGas,
            maxFeePerGas,
            nonce: nonce,
            to: to_address,
            value: amountToSend,
            chainId: Constants.network == "testnet" ? "0x05" : "0x01",
            accessList: [],
            type: 2,
          })
        : (rawTxn = {
            data: "",
            gasLimit: ethers.BigNumber.from(defaultgaslimit),
            maxPriorityFeePerGas,
            maxFeePerGas,
            nonce: nonce,
            to: to_address,
            value: amountToSend,
            chainId: Constants.network == "testnet" ? "0x05" : "0x01",
            accessList: [],
            type: 2,
          });

      consoleLogFunc("RAW TXN:", rawTxn);
      resolve({txn_hash:(await wallet.signTransaction(rawTxn)).slice(2), nonce: nonce });
    } catch (error) {
      console.error("Error signing transaction:", error);
      reject(error);
    }
  });
};
/************************************** Generate ERC-20 signed raw ************************************/
// export const CreateEthTokenRaw = async (
//   my_address,
//   to_address,
//   pvt_key,
//   gasLimit,
//   data
// ) => {
//   const web3Eth = new Web3(Singleton.getInstance().ETH_RPC_URL);
//   const web3 = createAlchemyWeb3(Singleton.getInstance().ETH_RPC_URL);
//   const priorityOrTip = await web3.eth.getMaxPriorityFeePerGas();
//   const nonce = await web3.eth.getTransactionCount(my_address, "latest");
//   const totalgasPrice = await web3Eth.eth.getGasPrice();
//   const defaultgaslimit = gasLimit;
//   const txData = {
//     data: data,
//     gasLimit: web3.utils.toHex(defaultgaslimit),
//     maxPriorityFeePerGas: priorityOrTip,
//     maxFeePerGas: web3.utils.toHex(totalgasPrice),
//     nonce: nonce,
//     to: to_address,
//     value: "0x0",
//     chainId: Constants.network == "testnet" ? "0x05" : "0x01",
//     accessList: [],
//     type: 2,
//   };
//   const common = new Common({
//     chain: Constants.network == "testnet" ? "goerli" : "mainnet",
//     hardfork: "london",
//   });
//   const tx = FeeMarketEIP1559Transaction.fromTxData(txData, { common });
//   const privateKey = pvt_key.includes("0x")
//     ? Buffer.from(pvt_key.substring(2), "hex")
//     : Buffer.from(pvt_key, "hex");
//   const signedTx = tx.sign(privateKey);
//   const serializedTx = signedTx.serialize();
//   return { txn_hash: serializedTx.toString("hex"), nonce: nonce };

// };


export const CreateEthTokenRaw = async (
  my_address,
  to_address,
  pvt_key,
  gasLimit,
  data,
) => {
  try {
    const wallet = new ethers.Wallet(pvt_key, provider);
    // const wallet = getWallet(pvt_key, coinType);
    const defaultgaslimit = gasLimit;
    const maxPriorityFeePerGas = await provider.send("eth_maxPriorityFeePerGas", []);
    // const maxPriorityFeePerGas = await getMaxPriorityFee();


    consoleLogFunc("Max Priority Fee Per Gas:", ethers.utils.formatUnits(maxPriorityFeePerGas, "gwei"), "Gwei");
    consoleLogFunc("maxPriorityFeePerGas>>s:", maxPriorityFeePerGas);
    const maxFeePerGas = await provider.getGasPrice();
    // const maxFeePerGas = await getGasPrice(coinType);
    consoleLogFunc('maxFeePerGas----', maxFeePerGas);

    const nonce = await provider.getTransactionCount(Singleton.getInstance().defaultEthAddress,"latest");
    // const nonce = await getTransactionCount(Singleton.getInstance().defaultEthAddress,coinType);
    consoleLogFunc('nonce----', nonce);
    

      const txData = {
    data: data,
    gasLimit: ethers.BigNumber.from(defaultgaslimit),
    maxPriorityFeePerGas,
    maxFeePerGas,
    nonce,
    to: to_address,
    value: "0x0",
    chainId: Constants.network == "testnet" ? "0x05" : "0x01",
    accessList: [],
    type: 2,
  };

    const signedTx = await wallet.signTransaction(txData);
    return { txn_hash: signedTx, nonce };
  } catch (error) {
    console.error("Error creating ETH Token raw transaction:", error);
    return null;
  }
};
export function isValidEthereumPrivateKey(privateKey) {
  // Check if it’s a 64-character hexadecimal string
  return /^0x[a-fA-F0-9]{64}$/.test(privateKey);
}



// export const getSignRawTxnTokenForNft = async (
//   chainId,
//   pKey,
//   tokenId,
//   token_address,
//   gas_estimate,
//   toAddress,
//   myAddress,
// ) => {
//   const web3 = createAlchemyWeb3(testnetUrlEth);
//   consoleLogFunc("WEB3>>>>>");

//   var priorityOrTip = await web3.eth.getMaxPriorityFeePerGas();
//   consoleLogFunc("priorityOrTip>>>>>", priorityOrTip);

//   var block = await web3.eth.getBlock('pending');

//   var nonce = await web3.eth.getTransactionCount(myAddress, 'latest');
//   consoleLogFunc("nonce>>>>>", nonce);


//   const totalgasPrice = await web3Eth.eth.getGasPrice();
//   consoleLogFunc("totalgasPrice>>>>>", totalgasPrice);

//   var defaultgaslimit = gas_estimate.toString();
//   let dataEncoded = null;

//   var contract = new web3.eth.Contract(nftAbi, token_address);
//   dataEncoded = contract.methods
//     .transferFrom(myAddress, toAddress, tokenId)
//     .encodeABI();

//   consoleLogFunc("dataEncoded>>>>>", dataEncoded);

//   const txData = {
//     data: dataEncoded,
//     gasLimit: web3.utils.toHex(defaultgaslimit),
//     maxPriorityFeePerGas: priorityOrTip,
//     maxFeePerGas: web3.utils.toHex(totalgasPrice),
//     nonce: nonce,
//     to: token_address,
//     value: '0x0',
//     chainId: chainId,
//     accessList: [],
//     type: '0x02',
//   };

//   consoleLogFunc("txData>>>>>", txData);

//   const common = new Common({
//     chain: 'mainnet',
//     hardfork: 'london',
//   });
//   const tx = FeeMarketEIP1559Transaction.fromTxData(txData, { common });

//   consoleLogFunc("tx>>>>>", tx);

//   const privateKey = pKey.includes('0x')
//     ? Buffer.from(pKey.substring(2), 'hex')
//     : Buffer.from(pKey, 'hex');

//   consoleLogFunc("privateKey>>>>>", privateKey);

//   const signedTx = tx.sign(privateKey);

//   const serializedTx = signedTx.serialize();
//   //consoleLogFunc("serializedTx:::::::::::::::", serializedTx.toString("hex"));
//   return { signedRaw: serializedTx.toString('hex'), nonce: nonce };
// };


// export const getSignRawTxnTokenForNft = async (
//   chainId,
//   pKey,
//   tokenId,
//   token_address,
//   gas_estimate,
//   toAddress,
//   myAddress,
// ) => {

//   const priorityOrTip = await provider.getFeeData();
//   // const priorityOrTip =await getFee(coinType);
//   consoleLogFunc("priorityOrTip>>>>>", priorityOrTip.maxPriorityFeePerGas.toString());

//   // const block = await provider.getBlock('pending');

//   const nonce = await provider.getTransactionCount(myAddress);
//   // const nonce = await getTransactionCount(myAddress,coinType);

//   consoleLogFunc("nonce>>>>>", nonce);

//   const totalgasPrice = await provider.getGasPrice();
//   // const totalgasPrice = await getGasPrice(coinType);

//   consoleLogFunc("totalgasPrice>>>>>", totalgasPrice.toString());

//   const defaultgaslimit = gas_estimate.toString();
//   let dataEncoded = null;

//   const contract = new ethers.Contract(token_address, nftAbi, provider);
//   // const contract = getContract(token_address, nftAbi, coinType);
//   dataEncoded = contract.interface.encodeFunctionData('transferFrom', [myAddress, toAddress, tokenId]);

//   consoleLogFunc("dataEncoded>>>>>", dataEncoded);

//   const txData = {
//     data: dataEncoded,
//     gasLimit: defaultgaslimit,
//     maxPriorityFeePerGas: priorityOrTip.maxPriorityFeePerGas.toString(),
//     maxFeePerGas: totalgasPrice.toString(),
//     nonce: nonce,
//     to: token_address,
//     value: '0',
//     chainId: chainId,
//     type: 2,
//   };

//   const tx = {
//     ...txData,
//     accessList: [],
//   };

//   const wallet = new ethers.Wallet(pKey, provider);
//   // const wallet = getWallet(pKey, coinType);
//   const signedTx = await wallet.signTransaction(tx);

//   const serializedTx = signedTx.rawTransaction;
//   consoleLogFunc("serializedTx:::::::::::::::", serializedTx);
//   return { signedRaw: serializedTx, nonce: nonce };
// };


export const getSignRawTxnTokenForNft = async (
  chainId,
  pKey,
  tokenId,
  token_address,
  gas_estimate,
  toAddress,
  myAddress,
  coinFamily,
  isNft721 = true,
  amount
) => {
  const provider =  new ethers.providers.JsonRpcProvider(coinFamily == 2 ? Singleton.getInstance().ETH_RPC_URL : Singleton.getInstance().TICS_RPC_URL);

  const priorityOrTip = await provider.getFeeData();
  // const priorityOrTip =await getFee(coinType);
  consoleLogFunc("priorityOrTip>>>>>", priorityOrTip.maxPriorityFeePerGas.toString());

  // const block = await provider.getBlock('pending');

  const nonce = await provider.getTransactionCount(myAddress);
  // const nonce = await getTransactionCount(myAddress,coinType);

  consoleLogFunc("nonce>>>>>", nonce);

  const totalgasPrice = await provider.getGasPrice();
  // const totalgasPrice = await getGasPrice(coinType);

  consoleLogFunc("totalgasPrice>>>>>", totalgasPrice.toString());

  const defaultgaslimit = gas_estimate.toString();
  let dataEncoded = null;

  consoleLogFunc("isNft1155>>>>>", isNft721);
  if(isNft721){
    const contract = new ethers.Contract(token_address, nftAbi, provider);
    dataEncoded = contract.interface.encodeFunctionData('transferFrom', [myAddress, toAddress, tokenId]);
  }else{
    dataEncoded = await getNft1155DataEncode(token_address, myAddress, toAddress, tokenId, amount, coinFamily);

 }

  consoleLogFunc("dataEncoded>>>>>", dataEncoded);

  const txData = {
    data: dataEncoded,
    gasLimit: defaultgaslimit,
    maxPriorityFeePerGas: priorityOrTip.maxPriorityFeePerGas.toString(),
    maxFeePerGas: totalgasPrice.toString(),
    nonce: nonce,
    to: token_address,
    value: '0',
    chainId: chainId,
    type: 2,
  };

  consoleLogFunc("txData>>>>>", txData);

  const tx = {
    ...txData,
    accessList: [],
  };

  consoleLogFunc("tx>>>>>", tx);

  try{
  const wallet = new ethers.Wallet(pKey, provider);
  // const wallet = getWallet(pKey, coinType);
  const signedTx = await wallet.signTransaction(tx);

  const serializedTx = signedTx;
  consoleLogFunc("serializedTx:::::::::::::::", serializedTx);
  return { signedRaw: serializedTx, nonce: nonce };
  }catch(error){
    console.error("Error signing transaction:", error);
    return null;
  }
};

export const dynamicGasEstimateUrl = (coinFamily, token_address) => {
  if(coinFamily == 2){
    return `ethereum/${token_address}/gas_estimation`;
  }else if(coinFamily == 7){
    return `qubetics/${token_address}/gas_estimation`;
  }
}
export const dynamicSendUrl = (coinFamily, token_address) => {
  if(coinFamily == 2){
    return `ethereum/${token_address}/send`;
  }else if(coinFamily == 7){
    return `qubetics/${token_address}/send`;
  }
}