import Singleton from "../Singleton";
import Web3 from 'web3';

/************************************** Get matic Balance *****************************************/
export const getTicsBal = async (walletAddress) => {
    const web3 = new Web3(new Web3.providers.HttpProvider(Singleton.getInstance().TICS_RPC_URL));
    const balance = await web3.eth.getBalance(walletAddress); //Will give value in wei.
    return (balance / 10 ** 18);
};