import { NativeModules, Platform } from 'react-native';
import { entropyToMnemonic } from 'ethers/lib/utils';
import { utils } from 'ethers';
import { validateMnemonic } from 'bip39';
import * as Constants from '../Constants';
import Address from '@bitsler/tron-address';
import { consoleLogFunc, saveData } from './MethodsUtils';
const BIP84 = require('bip84');
const { derivePath } = require("ed25519-hd-key");
import bip39 from "react-native-bip39";
import nacl from "tweetnacl";
const solanaWeb3 = require("@solana/web3.js");

import { Slip10, Slip10Curve, Keccak256 } from "@cosmjss/crypto";
import {
  Bip39,
  EnglishMnemonic,
  Secp256k1,
  Secp256k1Signature,
} from "@cosmjss/crypto";
// import { sha256 } from "@cosmjs/crypto";
// import { toUtf8, toBase64, toHex, fromBase64 } from "@cosmjs/encoding";
// import { serializeSignDoc } from "@cosmjs/launchpad";
import secp256k1 from "secp256k1";
import { keccak_256 } from "js-sha3";
import { createAddressFromMnemonic, createCosmosAddress } from './MnemonicsUtilsCosmos';

// import { DirectSecp256k1HdWallet } from '@cosmjss/proto-signing';
// import { stringToPath } from '@cosmjs/crypto';
const {stringToPath} = require('@cosmjss/crypto');
const {DirectSecp256k1HdWallet} = require('@cosmjss/proto-signing');

const { CreateWallet } = NativeModules;
/************************************** generate mnemonics ************************************/
export const generateMnemonics = () => {
    const mnemonics = entropyToMnemonic(utils.randomBytes(16));
    //  consoleLogFunc('generateMnemonics::::::::', mnemonics)
    return mnemonics;
};
/************************************************** validate Mnemonics ***************************************************/
export const validateMnemonics = (mnemonics) => {
    return new Promise((resolve, reject) => {
        try {
            const validMnemonics = validateMnemonic(mnemonics);
            resolve(validMnemonics);
        } catch (e) {
            reject(Constants.INVALID_MNEMONICS);
        }
    });
}
/************************************************** create wallet ***************************************************/
export const createWallet = async () => {
    return new Promise((resolve, reject) => {
        try {
            CreateWallet.generateMnemonics(async obj => {
                consoleLogFunc('---------Obj111', JSON.parse(obj));
                let data = JSON.parse(obj);
                let mnemonics = data?.mnemonics;
                let mnemonicsArray = mnemonics?.split(' ')
                const duplicates = mnemonicsArray.filter((item, index) => mnemonicsArray.some((elem, idx) => elem === item && idx !== index));
                if (duplicates?.length > 0) {
                    resolve({retry: true})
                }
                let ethWallet = data?.eth;
                let BTC_obj = data?.btc;
                let solObj;
                let cosmos_obj;
        // let cosmos_obj = data?.cosmos;

                consoleLogFunc('---------ethWallet', data?.eth);
                consoleLogFunc('---------BTC_obj', data?.btc);
                // consoleLogFunc('---------cosmos_obj', data?.cosmos_obj);

                // if (Platform.OS == "android") {
                //     let ethPvtKey = '0x' + Buffer.from(decodeBase64(ethWallet?.pvtKey)).toString('hex');
                //     ethWallet.pvtKey = ethPvtKey
                // }
                if (ethWallet.pvtKey?.length < 66) {
                    let suffix = '0x' + '0'.repeat(66 - ethWallet.pvtKey?.length);
                    ethWallet.pvtKey = suffix + ethWallet.pvtKey.substring(2);
                }
                let tronObj = await createTronAddress(mnemonics);
                const account = await createSolAddress(mnemonics);
                solObj = {
                    address: account.publicKey.toString(),
                    account: account
                }
                cosmos_obj = await createAddressFromMnemonic(mnemonics);
                consoleLogFunc("cosmos_obj-------Obj11", cosmos_obj);
                return resolve({
                    mnemonics,
                    eth_address: ethWallet.address,
                    ethObj: ethWallet,
                    btc_address: BTC_obj.address,
                    btcObj: BTC_obj,
                    trx_address: tronObj.address,
                    tronObj,
                    sol_address: solObj.address,
                    solObj,
                    cosmos_address: cosmos_obj?.address,
                    cosmos_obj,
                });
            });
        } catch (e) {
            console.warn('MM', 'create wallet error ', e);
            return reject(e);
        }
    });
}
/************************************************** tron address generation ***************************************************/

export const createTronAddress = mnemonic => {
    try {
        const addressobj = new Address(mnemonic, 0);
        const address = addressobj.getAddressInfo(0).address;
        const privateKey = addressobj.getAddressInfo(0).privateKey;
        return { address, privateKey };
    } catch (error) {
        consoleLogFunc('createTronAddress error==', error);
    }
};
/************************************************** sol address generation ***************************************************/

export const createSolAddress = async (mnemonics) => {
    try {
        const seed = await bip39.mnemonicToSeed(mnemonics);
        const path = `m/44'/501'/0'`;
        // consoleLogFunc("path----::::::::::::::::::::", path);

        const derivedSeed = derivePath(path, seed).key;
        // consoleLogFunc("derivedSeed----::::::::::::::::::::", derivedSeed);

        var account = new solanaWeb3.Account(
            nacl.sign.keyPair.fromSeed(derivedSeed).secretKey
        );
        consoleLogFunc("account----::::::::::::::::::::secretKey", account.secretKey.toString());
        consoleLogFunc("account----::::::::::::::::::::publicKey", account.publicKey.toString());
        return account;
    } catch (error) {
        consoleLogFunc('createSolAddress error==', error);
    }
};

export const getBTCAddress = async (mnemonics, addressIndex) => {
    var root = new BIP84.fromSeed(
        mnemonics,
        '',
        // false,
        Constants.network == 'testnet' ? true : false,
    ); //pass true for testnet and false for mainnet
    var child0 = root.deriveAccount(0);
    var account0 = new BIP84.fromZPrv(child0);
    const obj = {
        address: account0.getAddress(0),
        pvtKey: account0.getPrivateKey(0),
        mnemonics: mnemonics,
        index: addressIndex,
    };

    return obj;
};
/************************************************** import wallet ***************************************************/

export const importWallet = (mnemonics, btcOnly = false) => {
    return new Promise(async (resolve, reject) => {
        try {
            if (!validateMnemonic(mnemonics)) {
                return reject('Invalid Mnemonics');
            }
            // ********************************  FOR ETH  ************************************
            CreateWallet.generateAddressFromMnemonics(mnemonics, async obj => {
                consoleLogFunc('---------Obj', JSON.parse(obj));
                let data = JSON.parse(obj);
                let ethWallet = data.eth;
                let tronObj;
                let solObj;
                let BTC_obj = data.btc;
                let cosmos_obj;


                // if (Platform.OS == "android") {
                //     let ethPvtKey = '0x' + Buffer.from(decodeBase64(ethWallet?.pvtKey)).toString('hex');
                //     ethWallet.pvtKey = ethPvtKey
                // }

                if (ethWallet.pvtKey?.length < 66) {
                    let suffix = '0x' + '0'.repeat(66 - ethWallet.pvtKey?.length);
                    ethWallet.pvtKey = suffix + ethWallet.pvtKey.substring(2);
                }

                tronObj = await createTronAddress(mnemonics);
                const account = await createSolAddress(mnemonics);
                solObj = {
                    address: account.publicKey.toString(),
                    account: account
                }

                // cosmos_obj = await createCosmosAddress(mnemonics);
                cosmos_obj = await createAddressFromMnemonic(mnemonics);

                
                consoleLogFunc("cosmos_obj-------Obj", cosmos_obj);


                return resolve({
                    mnemonics,
                    eth_address: ethWallet.address,
                    ethObj: ethWallet,
                    btc_address: BTC_obj.address,
                    btcObj: BTC_obj,
                    trx_address: tronObj.address,
                    tronObj,
                    sol_address: solObj.address,
                    solObj,
                    cosmos_address: cosmos_obj?.address,
                    cosmos_obj,
                });


            });
        } catch (e) {
            //console.warn('MM','import wallet error ', e);
            return reject(e);
        }
    });
}


// export const createCosmosAddress = async (mnemonic) => {
//   try {
//     if (!mnemonic || typeof mnemonic !== "string") {
//       throw new Error("Invalid or missing mnemonic");
//     }

//     const prefix = "qubetics";
//     const hdPath = stringToPath("m/44'/60'/0'/0/0");

//     // const HD_PATHS = [
//     //   stringToPath("m/44'/118'/0'/0/0"),
//     //   stringToPath("m/44'/60'/0'/0/0"),
//     // ];

//     // Generate wallet
//     const wallet = await DirectSecp256k1HdWallet.fromMnemonic(mnemonic, {
//       prefix,
//       hdPaths: [hdPath],
//       // hdPaths: HD_PATHS,
//     });

//     // Get address
//     const [account] = await wallet.getAccounts();
//     // const [oldAddressAccountData, newAddressAccountData] = await wallet.getAccounts();
//     // console.log(
//     //   oldAddressAccountData.address,
//     //   '-=-=--=-=-=adsadadsas=-==-=-=-=-=-',
//     //   newAddressAccountData.address,
//     //   // '--=-=bech32Converter-=-=-=-=-',
//     //   // bech32Converter(PREFIX).toHex(newAddressAccountData.address),
//     // );
//     // Derive raw private key
//     const seed = await Bip39.mnemonicToSeed(new EnglishMnemonic(mnemonic));
//     // const { privkey } = Slip10.derivePath(Slip10Curve.Secp256k1, seed, hdPath);

//     // Optional: convert to base64 or hex for exporting
//     // const privateKeyHex = Buffer.from(privkey).toString("hex");

//     console.log("Address:", account.address);
//     // console.log("Private Key (hex):", privateKeyHex);

//     return {
//       address: account.address,
//       // privateKey: privateKeyHex,
//     };
//   } catch (error) {
//     console.error("createCosmosAddress error:", error);
//     throw error;
//   }
// };

  // export const signCosmosMessage = async (mnemonic, signerAddress, rawMessage) => {
  //   // 1. Derive private key using Secp256k1
  
  //   const seed = await Bip39.mnemonicToSeed(new EnglishMnemonic(mnemonic));
  //   const hdPath = stringToPath("m/44'/60'/0'/0/0");
  //   const { privkey } = Slip10.derivePath(Slip10Curve.Secp256k1, seed, hdPath);
  //   const privKeyBuffer = Buffer.from(privkey);
  //   const pubkeyCompressed = secp256k1.publicKeyCreate(privKeyBuffer, true);
  //   const pubKeyBase64111 = toBase64(pubkeyCompressed);
  
  //   const base64Data = Buffer.from(rawMessage).toString("base64");
  //   console.log("✅ base64Data base64Data-----", base64Data);
  
  //   const aminoDoc = {
  //     chain_id: "",
  //     account_number: "0",
  //     sequence: "0",
  //     fee: {
  //       gas: "0",
  //       amount: [],
  //     },
  //     msgs: [
  //       {
  //         type: "sign/MsgSignData",
  //         value: {
  //           signer: signerAddress,
  //           data: base64Data,
  //         },
  //       },
  //     ],
  //     memo: "",
  //   };
  
  //   // 3. Serialize and hash (Keccak256 for ETH-style)
  //   const serialized = serializeSignDoc(aminoDoc);
  //   const hash = require("js-sha3").keccak_256(serialized); // hex string
  //   const hashBytes = Buffer.from(hash, "hex");
  //   const signature = await Secp256k1.createSignature(hashBytes, privkey);
  //   const signatureBytes = new Uint8Array([
  //     ...signature.r(32),
  //     ...signature.s(32),
  //   ]);
  //   const signatureBase64 = toBase64(signatureBytes);
  //   console.log("✅ signatureBase64 signatureBase64-----", {
  //     wallet_address: signerAddress,
  //     pubKey: pubKeyBase64111,
  //     signature: {
  //       pub_key: {
  //         type: "tendermint/PubKeySecp256k1",
  //         value: pubKeyBase64111,
  //       },
  //       signature: signatureBase64,
  //     },
  //   });
  //   const isValid = await verifyCosmosSignature(
  //     rawMessage,
  //     signatureBase64, // base64
  //     pubKeyBase64111, // base64
  //     signerAddress
  //   );
  //   console.log("✅ signatureBase64 isValid:", isValid);
  
  //   // 5. Return formatted object
  //   return {
  //     wallet_address: signerAddress,
  //     pubKey: pubKeyBase64111,
  //     signature: {
  //       pub_key: {
  //         type: "tendermint/PubKeySecp256k1",
  //         value: pubKeyBase64111,
  //       },
  //       signature: signatureBase64,
  //     },
  //   };
  // };

  // export const verifyCosmosSignature = async (
  //   message,
  //   signatureBase64,
  //   pubKeyBase64,
  //   signerAddress
  // ) => {
  //   try {
  //     // 1. Prepare Amino doc (must match exactly)
  //     const base64Data = Buffer.from(message).toString("base64");
  
  //     const aminoDoc = {
  //       chain_id: "",
  //       account_number: "0",
  //       sequence: "0",
  //       fee: {
  //         gas: "0",
  //         amount: [],
  //       },
  //       msgs: [
  //         {
  //           type: "sign/MsgSignData",
  //           value: {
  //             signer: signerAddress,
  //             data: base64Data,
  //           },
  //         },
  //       ],
  //       memo: "",
  //     };
  
  //     // 2. Serialize & hash
  //     const serialized = serializeSignDoc(aminoDoc);
  //     const hash = Buffer.from(keccak_256.array(serialized)); // use same hash method
  
  //     // 3. Decode pubkey and signature
  //     const pubkeyBytes = fromBase64(pubKeyBase64);
  //     const signatureBytes = fromBase64(signatureBase64);
  //     const signature = Secp256k1Signature.fromFixedLength(signatureBytes);
  
  //     // 4. Verify
  //     const valid = await Secp256k1.verifySignature(signature, hash, pubkeyBytes);
  //     return valid;
  //   } catch (err) {
  //     console.error("❌ Signature verification failed:", err);
  //     return false;
  //   }
  // };