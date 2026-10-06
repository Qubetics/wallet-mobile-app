import { ethers, } from 'ethers';
import Singleton from '../Singleton';
import { consoleLogFunc } from './MethodsUtils';

class EVMEtherProvider {
  constructor() {
    this.providers = {
      eth: null,
      bnb: null,
      polygon: null,
      dapp:null
    };
    this.rpcUrls = {
      eth: Singleton.getInstance().ETH_RPC_URL,
      bnb: Singleton.getInstance().BSC_RPC_URL,
      polygon: Singleton.getInstance().MATIC_RPC_URL,
    };
  }

  getEthProvider() {
    if (!this.providers.eth) {
      const rpcUrl = this.rpcUrls.eth;
      this.providers.eth = new ethers.providers.JsonRpcProvider(rpcUrl);
      consoleLogFunc('ETH Provider initialized');
    }
    return this.providers.eth;
  }

  getDappProvider(url) {
    if (!this.providers.dapp) {
      const rpcUrl = url;
      this.providers.dapp = new ethers.providers.JsonRpcProvider(rpcUrl);
      consoleLogFunc('DAPP Provider initialized');
    }
    return this.providers.dapp;
  }

  getBnbProvider() {
    if (!this.providers.bnb) {
      const rpcUrl = this.rpcUrls.bnb;
      this.providers.bnb = new ethers.providers.JsonRpcProvider(rpcUrl);
      consoleLogFunc('BNB Provider initialized');
    }
    return this.providers.bnb;
  }

  getPolygonProvider() {
    if (!this.providers.polygon) {
      const rpcUrl = this.rpcUrls.polygon;
      this.providers.polygon = new ethers.providers.JsonRpcProvider(rpcUrl);
      consoleLogFunc('Polygon Provider initialized');
    }
    return this.providers.polygon;
  }

  getProvider(chainType) {
    switch (chainType?.toLowerCase()) {
      case 'ethereum':
        return this.getEthProvider();
      case 'binance':
        return this.getBnbProvider();
      case 'polygon':
        return this.getPolygonProvider();
      default:
        throw new Error(`Unsupported chain type: ${chainType}`);
    }
  }

  getProviderByCoinFamily(coinFamily) {
    switch (coinFamily) {
      case 2:
        return this.getEthProvider();
      case 1:
        return this.getBnbProvider();
      case 4:
        return this.getPolygonProvider();
      default:
        throw new Error(`Unsupported coin family: ${coinFamily}`);
    }
  }

 async getMaxPriorityFee(chainType) {
    const provider = this.getProvider(chainType);
    const maxPriorityFeePerGas = await provider.send("eth_maxPriorityFeePerGas", []);
    return maxPriorityFeePerGas;
  }

  getContract(contractAddress, abi, chainType) {
    const provider = this.getProvider(chainType);
    return new ethers.Contract(contractAddress, abi, provider);
  }

  getWallet(pKey, chainType) {
    const provider = this.getProvider(chainType);
    // const wallet = new ethers.Wallet(pKey, provider);
    return new ethers.Wallet(pKey, provider);
  }

  async getBalance(address, chainType) {
    consoleLogFunc('bal--', address, '--', chainType);
    
    const provider = this.getProvider(chainType);
    consoleLogFunc('bal--provider',provider);

    const balance = await provider.getBalance(address);
    consoleLogFunc('bal--balance',balance,'---', balance.toHexString());

    return balance.toHexString();
  }

  async getFee(chainType) {
    const provider = this.getProvider(chainType);
    const priorityOrTip = await provider.getFeeData();
    return priorityOrTip;
  }

  async getTransactionCount(address, chainType) {
    consoleLogFunc('getTransactionCount11----', address,chainType );

    const provider = this.getProvider(chainType);
    consoleLogFunc('provider11----', provider);
    const count = await provider.getTransactionCount(address,  "latest");
    consoleLogFunc('count----', count);

    // return await provider.getTransactionCount(address, 'pending');
    return count;

   
  }

  async getGasPrice(chainType) {    
    const provider = this.getProvider(chainType);
     const gasPrice = await provider.getGasPrice();
     consoleLogFunc('getGasPrice====gasPrice', gasPrice);
    return gasPrice;
  }

  async estimateGas(transaction, chainType) {
    const provider = this.getProvider(chainType);
    return await provider.estimateGas(transaction);
  }

  async sendRawTransaction(rawTransaction, chainType) {
    const provider = this.getProvider(chainType);
    return await provider.sendTransaction(rawTransaction);
  }

  async getTransactionReceipt(transactionHash, chainType) {
    const provider = this.getProvider(chainType);
    return await provider.getTransactionReceipt(transactionHash);
  }

  async getNetwork(chainType) {
    const provider = this.getProvider(chainType);
    return await provider.getNetwork();
  }

  resetProvider(chainType = 'all') {
    if (chainType === 'all') {
      this.providers.eth = null;
      this.providers.bnb = null;
      this.providers.polygon = null;
      consoleLogFunc('All providers reset');
    } else {
      this.providers[chainType?.toLowerCase()] = null;
      consoleLogFunc(`${chainType} provider reset`);
    }
  }

  isProviderInitialized(chainType) {
    return this.providers[chainType?.toLowerCase()] !== null;
  }

}

// Singleton instance
let instance = null;

export const getEVMEtherProvider = () => {
  if (!instance) {
    instance = new EVMEtherProvider();
  }
  return instance;
};

export { EVMEtherProvider };

export const getEthProvider = () => getEVMEtherProvider().getEthProvider();
export const getDappProvider = (rpcUrl) => getEVMEtherProvider().getDappProvider(rpcUrl);
export const getBnbProvider = () => getEVMEtherProvider().getBnbProvider();
export const getPolygonProvider = () => getEVMEtherProvider().getPolygonProvider();
export const getProvider = (chainType) => getEVMEtherProvider().getProvider(chainType);
export const getProviderByCoinFamily = (coinFamily) => getEVMEtherProvider().getProviderByCoinFamily(coinFamily);
export const getContract = (contractAddress, abi, chainType) => getEVMEtherProvider().getContract(contractAddress, abi, chainType);
export const getWallet = (pKey, chainType) => getEVMEtherProvider().getWallet(pKey, chainType);
export const getBalance = (address, chainType) => getEVMEtherProvider().getBalance(address, chainType);
export const getFee = (chainType) => getEVMEtherProvider().getFee(chainType);
export const getMaxPriorityFee = (chainType) => getEVMEtherProvider().getMaxPriorityFee(chainType);
export const getTransactionCount = (address, chainType) => getEVMEtherProvider().getTransactionCount(address, chainType);
export const getGasPrice = (chainType) => getEVMEtherProvider().getGasPrice(chainType);
export const estimateGas = (transaction, chainType) => getEVMEtherProvider().estimateGas(transaction, chainType);
export const sendRawTransaction = (rawTransaction, chainType) => getEVMEtherProvider().sendRawTransaction(rawTransaction, chainType);
export const getTransactionReceipt = (transactionHash, chainType) => getEVMEtherProvider().getTransactionReceipt(transactionHash, chainType);
export const getNetwork = (chainType) => getEVMEtherProvider().getNetwork(chainType);
export const resetProvider = (chainType) => getEVMEtherProvider().resetProvider(chainType);
export const isProviderInitialized = (chainType) => getEVMEtherProvider().isProviderInitialized(chainType);