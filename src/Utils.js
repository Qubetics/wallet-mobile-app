import { LanguageManager } from '../LanguageManager';
import * as Constants from './Constants'
import NodeRSA from 'node-rsa';
import { Dimensions, Platform } from 'react-native';
import { hasDynamicIsland, hasNotch } from 'react-native-device-info';
import DeviceInfo from 'react-native-device-info';
import Singleton from './Singleton';
import { consoleLogFunc, saveData } from './Utils/MethodsUtils';
import Web3 from 'web3';
import bs58 from 'bs58';
import { ethers } from 'ethers';
import { getBnbProvider, getEthProvider, getWallet } from './Utils/etherProviderUtils';
export const { width: screenWidth, height: screenHeight } = Dimensions.get("screen");

export function wordsWithOutSpace(value) {
    let regex = /^[a-zA-Z_]*$/
    if (regex.test(value)) {
        return value
    }
}
export function wordsWithSpace(value) {
    let regex = /^[a-zA-Z_ ]*$/
    if (regex.test(value)) {
        return value
    }
}
export function addressCheck(value) {
    let regex = /^[a-zA-Z0-9 ]*$/
    if (regex.test(value)) {
        return value
    }
}
export function addressCheck1(value) {
    let regex = /^[ A-Za-z0-9_@./#&+-]*$/ ///^[a-zA-Z0-9 ]*$/
    if (regex.test(value)) {
        return value
    }
}
export function phoneNoCheck(value) {
    let regx = /^[0-9]*$/
    if (regx.test(value)) {
        return value
    }
}
export function decimalCheck(value) {
    let regx = /^\d*\.?\d*$/
    if (regx.test(value)) {
        return value
    }
}
export function emailCheck(value) {
    let regx = /^[^\s@]+@[^\s@.]+\.[^\s@]{2,}$/
    if (regx.test(value?.trim())) {
        return value
    }
}
export function email(value) {
    let regex = /^.*?$/
    if (regex.test(value?.trim())) {
        return value
    }
}
export function checkAlphaNumeric(value) {
    let regex = /^[a-zA-Z0-9_]*$/
    if (regex.test(value)) {
        return value
    }
}

export const decodeData = async data => {
    return new Promise(async (resolve, reject) => {
        try {
            // consoleLogFunc("data::::", data);
            const key = new NodeRSA(Constants.CARD_KEY);
            key.setOptions({ encryptionScheme: "pkcs1" });
            const decrypted = await key.decrypt(data, "utf8");
            let originalText = await JSON.parse(decrypted);
            // consoleLogFunc("originalText:::", originalText);
            resolve(originalText);
        } catch (err) {
            consoleLogFunc("errr:::::", err)
            reject(err)
        }
    })
};
export function getTransactionStatus(value) {
    const { merchantCard } = LanguageManager;
    consoleLogFunc("value:::", value);
    if (value == 0) {
        return merchantCard.progress
    } else if (value == 1) {
        return merchantCard.Success
    } else if (value == 2) {
        return merchantCard.Failed
    }
}
export function getTransactionType(value) {
    const { merchantCard } = LanguageManager;
    if (value == 1) {
        return merchantCard.Consume
    } else if (value == 2) {
        return merchantCard.Recharge
    } else if (value == 3) {
        return merchantCard.Withdrawal
    } else if (value == 4) {
        return merchantCard.TransferIn
    } else if (value == 5) {
        return merchantCard.Transfer
    } else if (value == 6) {
        return merchantCard.Other
    } else if (value == 7) {
        return merchantCard.SettlementAdjustment
    } else if (value == 8) {
        return merchantCard.Refund
    } else if (value == 9) {
        return merchantCard.Paymentreversal
    } else if (value == 10) {
        return merchantCard.Fee
    } else if (value == 11) {
        return merchantCard.Feereversal
    } else if (value == 12) {
        return merchantCard.OTCrefund
    } else if (value == 13) {
        return merchantCard.OTCrefundreversal
    } else if (value == 100) {
        return merchantCard.Creditreconciliation
    } else if (value == 101) {
        return merchantCard.PurchaseCoin
    } else if (value == 102) {
        return merchantCard.CancelCard
    }
}
export const getDimensionPercentage = dimension => {
    let height = 926;
    let width = 428;
    let percentage = (dimension / (2 * (height + width))) * 100;
    let screenHeight = Dimensions.get('screen').height;
    let screenWidth = Dimensions.get('screen').width;
    let actualDImension = 2 * (screenHeight + screenWidth) * (percentage / 100);
    return actualDImension;
};
export { getDimensionPercentage as dimen };
export const heightDimen = dimension => {
    let height = 926;
    let percentage = (dimension / height) * 100;
    let screenHeight = Dimensions.get('screen').height;
    let actualDImension = screenHeight * (percentage / 100);
    return actualDImension;
};
export const widthDimen = dimension => {
    let width = 428;
    let percentage = (dimension / width) * 100;
    let screenWidth = Dimensions.get('screen').width;
    let actualDImension = screenWidth * (percentage / 100);
    return actualDImension;
};

export const dynamicFont = text => {
    const length = text?.length;
    return length > 9 && length <= 11
        ? 40
        : length > 11 && length <= 12
            ? 36
            : length > 12 && length <= 14
                ? 32
                : length > 14 && length <= 17
                    ? 28
                    : length > 17 && length <= 19
                        ? 24
                        : length > 19
                            ? 20
                            : 50;
};
export const dynamicFontNew = text => {
    const length = text?.length;
    return length > 8 ? getDimensionPercentage(12) : getDimensionPercentage(14)
};

export const hasNotchWithIOS = () => {
    return Platform.OS === 'ios' && (hasDynamicIsland() || hasNotch());
}

export const myDeviceId = async () => {
    const deviceId = await DeviceInfo.getUniqueId();
    consoleLogFunc("myDeviceId deviceId ------", deviceId);
    return deviceId;
};

export const getCoinSymbol = (coinFamily) => {
    const tempTarget = Constants.AssetList.find((val) => val.coin_family == coinFamily);
    return tempTarget.coin_symbol;
};

export const sleep = (ms) => {
    return new Promise((resolve) => setTimeout(resolve, ms));
};

export const roundToDecimal = (input, decimalPlaces = 8, roundingMethod = 'floor') => {
    // Ensure the input is treated as a number
    let num = typeof input === 'string' ? parseFloat(input) : input;

    // Multiply by 10^decimalPlaces to shift the decimal point
    const factor = Math.pow(10, decimalPlaces);

    // Apply rounding based on the specified method
    let rounded;
    if (roundingMethod === 'floor') {
        rounded = Math.floor(num * factor) / factor;
    } else if (roundingMethod === 'ceiling') {
        rounded = Math.ceil(num * factor) / factor;
    } else {
        // Default to rounding normally
        rounded = Math.round(num * factor) / factor;
    }

    // Convert the result back to a number to remove unnecessary trailing zeros
    return parseFloat(rounded.toFixed(decimalPlaces));
}


export const getGasLimitFromData = async (from, to, data, coinFamily) => {
    return new Promise(async (resolve, reject) => {
        let web3 = await web3BNBfn(coinFamily);

        web3.eth
            .estimateGas({
                from: from,
                data: data,
                to: to,
            })
            .then(res => {
                consoleLogFunc('resget_getlimitConnect=== ', res);
                resolve(res);
            })
            .catch(error => {
                reject(error);
            });
    });
};
export const getGasPriceForWc = async (coinFamily) => {
    return new Promise(async (resolve, reject) => {
        let web3 = await web3BNBfn(coinFamily);
        web3.eth.getGasPrice().then(res => {
            consoleLogFunc('resget_getlimitConnect=== ', res);
            resolve(res);
        }).catch(error => {
            reject(0);
        });
    });
};

export const getSepoliaGasPrice = async (coinFamily) => {
    return new Promise(async (resolve, reject) => {
        let web3 = new Web3("https://sepolia.infura.io/v3/REDACTED")
        web3.eth.getGasPrice().then(res => {
            consoleLogFunc('resget_getlimitConnect=== ', res);
            resolve(res);
        }).catch(error => {
            reject(0);
        });
    });
};

export const getNonceForWc = async (address, coinFamily) => {
    return new Promise(async (resolve, reject) => {
        let web3 = await web3BNBfn(coinFamily);
        web3.eth.getTransactionCount(address, "latest").then(res => {
            consoleLogFunc('resget_getlimitConnect=== ', res);
            resolve(res);
        }).catch(error => {
            reject(0);
        });
    });
};
export const signPersonalMessage = async (data, pKey, coinFamily) => {
    return new Promise(async (resolve, reject) => {
        try {
            //     const web3 = await web3BNBfn(coinFamily);
            //     const signature= web3.eth.accounts.sign(data, pKey);
            //     resolve(signature?.signature);
            // } catch (err) {
            //     consoleLogFunc("Err_signPersonalMessage::", err);
            //     reject(err);
            // }
            let signature = null;
            if (coinFamily == 4) {
                let privateKeyBytes = bs58.decode(pKey);
                let keyPair = nacl.sign.keyPair.fromSecretKey(privateKeyBytes);
                const rawMessage = data;
                const encodedMessage = new TextEncoder().encode(rawMessage);
                let sig = nacl.sign.detached(encodedMessage, keyPair.secretKey);
                const uint8Array = new Uint8Array(sig);
                signature = bs58.encode(uint8Array);
            } else {
                const rpcUrl = coinFamily ==2 ? Singleton.getInstance().ETH_RPC_URL: Singleton.getInstance().BSC_RPC_URL
                const provider = new ethers.providers.JsonRpcProvider(rpcUrl);

                // const provider = coinFamily ==2 ? getEthProvider(): getBnbProvider();
                // console.log('signPersonalMessage---NEW');

                // const chainType = coinFamily == 2 ? 'ethereum' : 'binance';
                // console.log('signPersonalMessage---chainType', chainType);

                // const wallet = getWallet(pKey, chainType);
                // console.log('signPersonalMessage---wallet', wallet);

                  let wallet = new ethers.Wallet(
                    pKey,
                    provider
                  );
                signature = await wallet.signMessage(data);
            }
            resolve(signature);
        } catch (err) {
            consoleLogFunc("Err_signPersonalMessage::", err);
            reject(err);
        }
    });
};

// export const web3BNBfn = coinFamily => {
//     switch (coinFamily) {
//         case 1: //BNB
//             return new Web3(Singleton.getInstance().BSC_RPC_URL);
//         case 2: //ETH
//             return new Web3(Singleton.getInstance().ETH_DAPP_RPC_URL);
//         case 4: //MATIC
//             return new Web3(Singleton.getInstance().MATIC_RPC_URL);
//     }
// };

export const web3BNBfn = coinFamily => {
    switch (coinFamily) {
        case 1: //BNB
            return new Web3(Singleton.getInstance().BSC_RPC_URL);
        case 2: //ETH
        return new Web3(Singleton.getInstance().ETH_DAPP_RPC_URL);
            // return new Web3("https://sepolia.infura.io/v3/REDACTED") //new Web3(Singleton.getInstance().ETH_DAPP_RPC_URL);
        case 4: //MATIC
            return new Web3(Singleton.getInstance().MATIC_RPC_URL);
        case 7: //TICS
            return new Web3(Singleton.getInstance().TICS_RPC_URL);
            // return new Web3(Singleton.getInstance().TESTNETICS_RPC_URL); // for only chain Abstraction testnet
            
    }
};

export const getSymbolByCoinFamily = (coinFamily) => {
    const tempTarget = Constants.AssetList.find((val) => val.coin_family == coinFamily);
    return tempTarget.coin_symbol?.toUpperCase();
};

export const getQubeticsEventLabel = (event, status) => {
    switch (event) {
      case Constants.QUBETICS_EVENTS.SUBSCRIPTION_CREATE:
        return { label: "Subscription", status: "Success" };
      case Constants.QUBETICS_EVENTS.SESSION_UPDATE_STATUS:
        return status == "inactive_pending" ? { label: "End Session", status: "Success" } : { label: "Unknown Event", status: "Failed" };
      case Constants.QUBETICS_EVENTS.SUBSCRIPTION_CREATE_SESSION:
        return { label: "Start Session", status: "Success" };
      default:
        return { label: "Unknown Event", status: "Failed" };
    }
  };
