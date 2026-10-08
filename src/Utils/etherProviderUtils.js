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

  getWallet(pKey, chainType) {
    const provider = this.getProvider(chainType);
    return new ethers.Wallet(pKey, provider);
  }

}

// Singleton instance
let instance = null;

const getEVMEtherProvider = () => {
  if (!instance) {
    instance = new EVMEtherProvider();
  }
  return instance;
};

export const getDappProvider = (rpcUrl) => getEVMEtherProvider().getDappProvider(rpcUrl);
export const getWallet = (pKey, chainType) => getEVMEtherProvider().getWallet(pKey, chainType);
