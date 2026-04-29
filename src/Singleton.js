import { Wallet } from 'ethers';
import { Alert, Platform } from 'react-native';
import { openSettings, PERMISSIONS, request } from 'react-native-permissions';
import Web3 from 'web3';
import { LanguageManager } from '../LanguageManager';
import { IS_PRODUCTION } from '../src/EndPoint';
import * as Constants from './Constants';
import { Images } from './theme';
import colors from './theme/Colors';
import { bigNumberSafeMath, consoleLogFunc, toFixed } from './Utils/MethodsUtils';
import * as Keychain from 'react-native-keychain';
import checkVersion from "react-native-store-version";
import { getEthProvider, getWallet } from './Utils/etherProviderUtils';
import DeviceInfo from 'react-native-device-info';

export default class Singleton {
  static myInstance = null;
  static bottomBar = null;
  static isCameraOpen = false;
  static isPermission = false;
  static isFirsLogin = false;
  static isNotification = false;
  static themeStatus = '1';
  static lastSyncBalanceTime = null;
  defaultEthAddress = '';
  defaultBtcAddress = '';
  defaultTrxAddress = '';
  defaultBnbAddress = '';
  defaultLtcAddress = '';
  defaultMaticAddress = '';
  defaultSolAddress = '';
  defaultTicsAddress = '';
  defaultCosmosAddress = '';
  defaultMpcEthAddress = '';
  defaultMpcBtcAddress = '';
  refCode = '';
  defaultEmail = '';
  walletName = 'Basic';
  CurrencySymbol = '$';
  CurrencySelected = 'USD';
  SelectedLanguage = 'en';
  ETH_RPC_URL = '';
  ETH_DAPP_RPC_URL = '';
  unique_id = '';
  BSC_RPC_URL = '';
  BTC_RPC_URL = '';
  MATIC_RPC_URL = '';
  SOL_RPC_URL = 'https://api.mainnet-beta.solana.com';
  TICS_RPC_URL = 'https://rpc.qubetics.com/'; //Fallback URL
  TESTNETICS_RPC_URL = 'https://rpc-testnet.qubetics.work/'; //Fallback URL
  COSMO_TICS_RPC_URL = "https://tendermint-internal.qubetics.com"; //Fallback URL
  updateAlert = null;
  updateRefModal = null;
  updateAlertModal = null;
  reqListPopup = null;
  makerReqStatusPopup = null;
  showToast = null;
  swapSelectedCoin = null;
  buySellSelectedCoin = null;
  fromWatchList = false;
  walletConnectRef = false;
  userRefCode = '';
  card = {}
  cardActive = false;
  phyAndvirtualCard = false;
  hide = false;
  isHideBalance = false;
  virtualCardStatus = 'inactive'
  physicalCardStatus = 'inactive'
  isMakerWallet = false;
  isOnlyBtcCoin = false;
  isOnlyTrxCoin = false;
  dappDisconnectTimeout =  null
  isUpdateApp = null;
  static getInstance() {
    if (Singleton.myInstance == null) {
      Singleton.myInstance = new Singleton();
    }
    return this.myInstance;
  }
  //******************************************* signPersonalMessage **********************************************/
  signPersonalMessage(data, pKey) {
    return new Promise((resolve, reject) => {
      try {
        // const EthRpcUrl = Singleton.getInstance().ETH_RPC_URL;
        // const provider = new ethers.providers.JsonRpcProvider(EthRpcUrl);
        const provider = getEthProvider();

        // const wallet = new ethers.Wallet(pKey, provider);
        const chainType = 'ethereum';
        const wallet = getWallet(pKey,chainType);
        const signature = wallet.signMessage(data);
        signature.then((sig) => {
          resolve(sig);
        }).catch((err) => {
          reject(err);
        });
        // const EthRpcUrl = Singleton.getInstance().ETH_RPC_URL
        // const web3 = new Web3(EthRpcUrl);
        // const signature = web3.eth.accounts.sign(data, pKey)
        // resolve(signature?.signature);
      }
      catch (err) {
        consoleLogFunc('ignPersonalMessage err::::::', err);
        reject(err);
      }
    });
  }
  //******************************************* dappApprovalHash **********************************************/
  async dappApprovalHash(pvt_key, approvalParam) {
    return new Promise(async (resolve, reject) => {
      let wallet = new Wallet(pvt_key);
      wallet._signTypedData(
        approvalParam.domain,
        approvalParam.types,
        approvalParam.message).then(async (resww) => {
          consoleLogFunc("resww>>", resww);
          resolve(resww)

        }).catch(err => {
          consoleLogFunc('dappApprovalHash err::::', err);
          reject(err)
        });
    })
  };

  //******************************************* getsignRawTxnDapp **********************************************/
  async getsignRawTxnDapp(pKey, toAmount, gas_gwei_price, gas_estimate, nonce, toAddress, myAddress, data, symbol) {

    try {
      const EthRpcUrl = Singleton.getInstance().ETH_RPC_URL
      const BscRpcUrl = Singleton.getInstance().BSC_RPC_URL
      const MaticRpcUrl = Singleton.getInstance().MATIC_RPC_URL
      const TicsRpcUrl = Singleton.getInstance().TICS_RPC_URL
      // const TicsRpcUrl = Singleton.getInstance().TESTNETICS_RPC_URL   // for only chain Abstraction testnet


      let web3Dapp = null;
      if (symbol?.toLowerCase() == 'bnb') {
        web3Dapp = new Web3(BscRpcUrl);
      } else if (symbol?.toLowerCase() == 'pol') {
        web3Dapp = new Web3(MaticRpcUrl);
      } else if(symbol?.toLowerCase() == 'tics') {
        web3Dapp = new Web3(TicsRpcUrl);
      } else {
        web3Dapp = new Web3(EthRpcUrl);
      }
      const web3Dapp1 = web3Dapp
      const amountToSend = web3Dapp1.utils.toWei(toAmount, 'ether');
      const amount = web3Dapp1.utils.toHex(amountToSend);
      let gasPrice = gas_gwei_price;
      // gasPrice = (symbol?.toLowerCase() == 'bnb' || symbol?.toLowerCase() == 'pol') ? gasPrice * 10 ** 9 : gasPrice
      gasPrice = (symbol?.toLowerCase() == 'bnb' || symbol?.toLowerCase() == 'pol' || symbol?.toLowerCase() == 'tics') ? gasPrice * 10 ** 9 : gasPrice

      let estimateGas = bigNumberSafeMath(gas_estimate, '*', 1.2);
      estimateGas = toFixed(estimateGas, 0);
      const chainID = symbol?.toLowerCase() == 'bnb' ? (IS_PRODUCTION == 0 ? 97 : 56) : symbol?.toLowerCase() == 'pol' ? (IS_PRODUCTION == 0 ? 80001 : 137) : symbol?.toLowerCase() == 'tics' ? 9030 : (IS_PRODUCTION == 0 ? 11155111 : 1)
      // const chainID = symbol?.toLowerCase() == 'bnb' ? (IS_PRODUCTION == 0 ? 97 : 56) : symbol?.toLowerCase() == 'pol' ? (IS_PRODUCTION == 0 ? 80001 : 137) : (IS_PRODUCTION == 0 ? 11155111 : 1)
      consoleLogFunc('gasPrice', gasPrice);
      consoleLogFunc('estimateGas', estimateGas);
      const rawTransaction = {
        nonce: nonce,
        gasPrice: web3Dapp1.utils.toHex(gasPrice),
        gasLimit: web3Dapp1.utils.toHex(estimateGas ),
        to: toAddress,
        value: amount,
        from: myAddress,
        data: data,
        chainId: chainID,
      };
      consoleLogFunc("rawTransaction>>>>>", rawTransaction);

      let serializedTx = '';
      const signedTx = await web3Dapp1.eth.accounts.signTransaction(rawTransaction, pKey);
      // consoleLogFunc('signedTx::::::', signedTx);
      serializedTx = signedTx?.rawTransaction?.substring(2);

      return serializedTx;
    }
    catch (err) {
      consoleLogFunc("SignRawTxnDapp_ERR:::::", err);
      return err
    }
  }
  //******************************************* cameraPermission **********************************************/
  async cameraPermission() {
    Singleton.isCameraOpen = true;
    var response = '';
    if (Platform.OS == 'android') {
      response = await request(PERMISSIONS.ANDROID.CAMERA);
    } else {
      response = await request(PERMISSIONS.IOS.CAMERA);
    }
    if (response != 'granted') {
      Alert.alert('Camera Permission', 'Please allow from setting manually.', [
        {
          text: 'Cancel',
          onPress: () => null,
          style: 'cancel',
        },
        { text: 'Ok', onPress: () => openSettings() },
      ]);
    }
    return response;
  }
  //******************************************** getStatus **************************************************/
  getStatus(item) {
    const { detailTrx } = LanguageManager;
    const trx_type = item.type?.toLowerCase();
    const status = item.status?.toLowerCase();
    const blockChain_status = item.blockchain_status != null ? item.blockchain_status?.toLowerCase() : item?.blockchain_status;
    if (status == 'failed' || blockChain_status == 'failed') {
      return detailTrx.Failed;
    } else if (trx_type == 'withdraw' || trx_type == 'approve' || trx_type == 'cross_chain' || trx_type == 'swap') {
      if (blockChain_status == 'confirmed' && status == 'completed') {
        return detailTrx.completed;
      }
      if ((blockChain_status == null || blockChain_status == 'pending') && status == 'completed') {
        return detailTrx.pending;
      }
      if (blockChain_status == null && status == 'unconfirmed') {
        return detailTrx.pending;
      }
    } else if (trx_type == 'buy' || trx_type == 'sell') {
      if (status == 'completed') {
        return detailTrx.completed;
      }
      if (status == 'pending') {
        return detailTrx.pending;
      }
    } else if (trx_type != 'withdraw') {
      if (status == 'completed') {
        return detailTrx.completed;
      } else if (status == 'unconfirmed' || status == 'pending') {
        return detailTrx.pending;
      } else {
        return detailTrx.Failed;
      }
    }else{ 
      return detailTrx.Failed;
    } 
  }
  //******************************************* getStatusColor **********************************************/
  getStatusColor(item) {
    const trx_type = item.type?.toLowerCase();
    const status = item.status?.toLowerCase();
    const blockChain_status = item.blockchain_status != null ? item.blockchain_status?.toLowerCase() : item?.blockchain_status;
    if (status == 'failed' || blockChain_status == 'failed') {
      return 'red';
    } else if (trx_type == 'withdraw' || trx_type == 'approve' || trx_type == 'cross_chain' || trx_type == 'swap') {
      if (blockChain_status == 'confirmed' && status == 'completed') {
        return colors.profitColor;
      }
      if ((blockChain_status == null || blockChain_status == 'pending') && status == 'completed') {
        return 'rgba(211, 155, 73, 1)';
      }
      if (blockChain_status == null && status == 'unconfirmed') {
        return 'rgba(211, 155, 73, 1)';
      }
    } else if (trx_type == 'buy' || trx_type == 'sell') {
      if (status == 'completed') {
        return 'green';
      }
      if (status == 'pending') {
        return 'rgba(211, 155, 73, 1)';
      }
    } else if (trx_type != 'withdraw') {
      if (status == 'completed') {
        return 'green';
      }else {
        return 'rgba(211, 155, 73, 1)';
      }
    }
  }
  //******************************************* getStatusImage **********************************************/
  getStatusImage(item, address) {
    // consoleLogFunc('getStatusImage--item', item);
    // consoleLogFunc('getStatusImage--', item?.from_adrs, '---', item?.to_adrs, address, Singleton.getInstance().defaultCosmosAddress);
    const trx_type = item.type?.toLowerCase();
    const status = item.status?.toLowerCase();
    const blockChain_status = item.blockchain_status != null ? item.blockchain_status?.toLowerCase() : item?.blockchain_status;
    const Address = address;
    if (status == 'failed' || blockChain_status == 'failed') {
      return Images.icTransactionFail;
    } else if (trx_type?.toLowerCase() == 'card_fees' || trx_type?.toLowerCase() == 'card_recharge' || trx_type?.toLowerCase() == 'level_upgradation_fee') {
      return Images.withdrawNew;
    }
    // else if (trx_type?.toLowerCase() == 'withdraw' && item?.from_adrs?.toLowerCase() == Singleton.getInstance().defaultCosmosAddress?.toLowerCase()) {
    //   return Images.withdrawNew;
    // }
    else if (trx_type?.toLowerCase() == 'withdraw' && item?.from_adrs?.toLowerCase() == address?.toLowerCase()) {
      return Images.withdrawNew;
    }
    else if (trx_type?.toLowerCase() == 'withdraw' && item?.to_adrs?.toLowerCase() == address?.toLowerCase()) {
      return Images.deposit;
    }
    // else if (trx_type?.toLowerCase() == 'withdraw' && item?.to_adrs?.toLowerCase() == Singleton.getInstance().defaultCosmosAddress?.toLowerCase()) {
    //   return Images.deposit;
    // }
    else if (trx_type?.toLowerCase() == 'swap' || trx_type?.toLowerCase() == 'cross_chain' || trx_type?.toLowerCase() == 'approve') {
      return Images.icTransactionSwap;
    } else if (trx_type?.toLowerCase() == 'buy') {
      return Images.deposit;
    } else if (trx_type?.toLowerCase() == 'sell') {
      return Images.withdrawNew;
    } else if (trx_type?.toLowerCase() != 'withdraw') {
      return Images.deposit;
    }
  }


  async handleSetItemUsingTouchIDOnPress(pin) {
    return new Promise(async (resolve, reject) => {
      try {
        try {
          await Keychain.setGenericPassword(
            Constants.KEYCHAIN_DATA_KEY,
            pin,
            {
              service: Constants.KEYCHAIN_SERVICE_NAME,
              accessControl: Keychain.ACCESS_CONTROL.BIOMETRY_ANY_OR_DEVICE_PASSCODE,
              accessible: Keychain.ACCESSIBLE.WHEN_UNLOCKED,
              storage: Keychain.STORAGE_TYPE.AES_GCM,
              authenticationPrompt: {
                title:  "Tap to register biometrics/face id",
              },
            }
          ).then( async (result) => {

          if (Platform.OS === "ios") {
            consoleLogFunc("👉 iOS detected: Triggering biometric popup...");

            try {
              const credentials = await Keychain.getGenericPassword({
                service: Constants.KEYCHAIN_SERVICE_NAME,
                authenticationPrompt: {
                  title: "Tap to register biometrics/face id",
                },
              });

              if (credentials) {
                resolve(true);
              } else {
                consoleLogFunc("❌ Biometrics cancelled by user");
                reject("Authentication failed or cancelled");
              }
            } catch (iosError) {
              consoleLogFunc("❌ iOS biometric error", iosError);
              reject(iosError);
            }
          } else {
            // ✅ Android works directly on set
            resolve(result); // true if successful
          }

            // resolve(result); // true if successful
          }).catch(async (error) => {
            if (error.message.includes('IllegalBlockSizeException')) {
              reject('Secure storage is corrupted. Clearing...');
              await Keychain.resetGenericPassword( {
                  service: Constants.KEYCHAIN_SERVICE_NAME,
                }
              );
            } else {
              reject(error);
            }
          });
  
        } catch (error) {
          consoleLogFunc('error>>>>>>>', error);
          reject(error);
        }
  
      } catch (ex) {
        consoleLogFunc("ex>>>>>>>>>>", ex);
        reject(ex);
      }
    });
  }
  

  getTouchIDItem = async (isBiometricRequired) => {
    return new Promise(async (resolve, reject) => {
      try {
  
        // Get the credentials directly
        const credentials = await Keychain.getGenericPassword({
          service: Constants.KEYCHAIN_SERVICE_NAME,
          authenticationType: Keychain.AUTHENTICATION_TYPE.BIOMETRICS,
        });

        // Check the retrieved data
        const data = credentials ? credentials.password : null;

        if ((data === null || data === undefined || data === "")) {
          Alert.alert("Qubetics Wallet", LanguageManager.common.tryPin);
          reject({
            cancelled: false
          });
        } else {
          resolve(data);
        }
  
      } catch (ex) {
        if(ex?.message?.includes('The specified item could not be found in the keychain') && Platform.OS === 'ios'){
          Alert.alert(
          'Qubetics Wallet',
          'Please connect your biometrics in security tab.',
          [
            {
              text: 'Security Tab',
              onPress: async() => {
                consoleLogFunc('Security Tab')
                // await Singleton.getInstance().saveData(
                //             Constants.ENABLE_BIOMETRIC,
                //             'false'
                //           );
                // navigate('Security')},
              },
              style: 'default',
            },
            {
              text: 'Proceed with Pin',
              onPress: () => {},
              style: 'cancel',
            },
          ]
        )
        reject({
          cancelled: false
        });
      };
        // Handle specific error cases
        if (ex.code === Keychain.ERRORS.USER_CANCELED || String(ex).includes('canceled')) {
          reject({
            cancelled: true
          });
        } else {
          reject({
            cancelled: false
          });
        }
      }
    });
  };
  
  deleteKeyChainData = () => {
    return new Promise(async (resolve, reject) => {
      try {
        consoleLogFunc('>>>> Attempting to delete Keychain data');
        await Keychain.resetGenericPassword({
          service: Constants.KEYCHAIN_SERVICE_NAME,
        });
        consoleLogFunc('>>>> Keychain data deleted successfully');
        resolve();
      } catch (err) {
        consoleLogFunc('>>>> Error deleting Keychain data:', err);
        reject(err);
      }
    });
  };
  

  isNewerVersion1 () {
    const currentVersion = DeviceInfo?.getVersion();
    consoleLogFunc('-=====currentVersion=====INSIDE', currentVersion);
    return new Promise(async (resolve, reject) => {
      try {
        const check = await checkVersion({
          version:  currentVersion,//Platform.OS == 'android' ? currentVersion: Constants.CURRENT_IOS_VERSION,
          iosStoreURL: Constants.APP_STORE_LINK,
          androidStoreURL: Constants.ANDROID_STORE_LINK,
        });
        consoleLogFunc('-==========check', check);
        // if app store version is new
        if (check.result === 'new') {
          // resolve(check.result);
          Singleton.getInstance()?.isUpdateApp?.showUpdateApp();
        } else {
          // reject(check.result);
        }
      } catch (e) {
        consoleLogFunc(e);
        reject('old');
      }
    });
  }

}

