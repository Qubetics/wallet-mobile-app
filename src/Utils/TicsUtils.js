import { ethers } from "ethers";
import Singleton from "../Singleton";
import Web3 from 'web3';
import { consoleLogFunc } from "./MethodsUtils";

/************************************** Get matic Balance *****************************************/
export const getTicsBal = async (walletAddress) => {
  const web3 = new Web3(new Web3.providers.HttpProvider(Singleton.getInstance().TICS_RPC_URL));
  const balance = await web3.eth.getBalance(walletAddress); //Will give value in wei.
  return (balance / 10 ** 18);
};


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


// Export all utility functions
export {
  getTicsProvider
};


//in function call const contract = getTicsContract(tokenAdrs, idaAbi);