import TronWeb from 'tronweb';
import * as Constants from '../Constants';
import { consoleLogFunc } from './MethodsUtils';
const HttpProvider = TronWeb.providers.HttpProvider;
const fullNode = Constants.network == 'testnet' ? new HttpProvider('https://api.shasta.trongrid.io') : new HttpProvider('https://api.trongrid.io/');
const solidityNode = Constants.network == 'testnet' ? new HttpProvider('https://api.shasta.trongrid.io') : new HttpProvider('https://api.trongrid.io/');
const eventServer = Constants.network == 'testnet' ? new HttpProvider('https://api.shasta.trongrid.io') : new HttpProvider('https://api.trongrid.io/');

/************************************** getTronBalance TRON ************************************/

/************************************** Validate TRON Address ************************************/
export const validateTRXAddress = text => {
    consoleLogFunc('chk Valid trx Addresss::::::::::::', text);
    return TronWeb.isAddress(text);
};
/************************************** Generate TRC signed raw ************************************/
export const createTrxRaw = async (fromAddress, toAddress, amount, pvtkey,) => {
    const privateKey = pvtkey;
    const tronWeb = new TronWeb(fullNode, solidityNode, eventServer, privateKey);
    consoleLogFunc('tronwebSendTRX inside function');
    const tradeobj = await tronWeb.transactionBuilder.sendTrx(toAddress, tronWeb.toSun(amount), fromAddress,);
    const signedtxn = await tronWeb.trx.sign(tradeobj, privateKey);
    return await signedtxn;
};
/************************************** Generate TRC20 signed raw ************************************/
export const createTrxTokenRaw = async (fromAddress, toAddress, amount, token_address, pvtkey, feeLimit,) => {
    const tronWeb = new TronWeb(fullNode, solidityNode, eventServer, pvtkey);
    const BigNumber = require("bignumber.js");
    const largeNumber = new BigNumber(amount);
    const formattedAmt = largeNumber.toFixed();
    const parameter = [
        { type: "address", value: toAddress },
        { type: "uint256", value: formattedAmt },
    ];
    const options = { feeLimit: feeLimit, callValue: 0 };
    const transaction = await tronWeb.transactionBuilder.triggerSmartContract(token_address, 'transfer(address,uint256)', options, parameter, fromAddress,);
    let transactionObject = transaction;
    if (!transactionObject.result || !transactionObject.result.result)
        return console.error('Unknown error: ' + txJson, null, 2);
    const signedTransaction = await tronWeb.trx.sign(transactionObject.transaction,);
    if (!signedTransaction.signature) {
        return console.error('Transaction was not signed properly');
    }
    return await signedTransaction;
};
