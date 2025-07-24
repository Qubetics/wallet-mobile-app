import { Images } from './theme';
import Web3 from 'web3';
import { IS_PRODUCTION } from '../src/EndPoint';
import { Alert, Platform } from 'react-native';
import { request, PERMISSIONS, openSettings } from 'react-native-permissions';
import { Wallet } from 'ethers';
import * as Constants from './Constants'
import { LanguageManager } from '../LanguageManager';
import colors from './theme/Colors';
import { consoleLogFunc, decryptDataAES, encryptDataAES, getData, getEncryptedData, saveData } from './Utils/MethodsUtils';
import SInfo from 'react-native-sensitive-info';
import { ethers } from 'ethers';
import { getEthProvider, getEVMEtherProvider, getWallet } from './Utils/etherProviderUtils';
import checkVersion from "react-native-store-version";
import DeviceInfo from 'react-native-device-info';
export default class Singleton {
  static myInstance = null;
  static bottomBar = null;
  static isCameraOpen = false;
  static isPermission = false;
  static isFirsLogin = false;
  static isNotification = false;
  static themeStatus = '1';
  defaultEthAddress = '';
  defaultBtcAddress = '';
  defaultTrxAddress = '';
  defaultBnbAddress = '';
  defaultLtcAddress = '';
  defaultMaticAddress = '';
  defaultSolAddress = '';
  defaultTicsAddress = '';
  defaultCosmosAddress = '';
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
  SOL_RPC_URL = '';
  // TICS_RPC_URL = 'https://rpc-testnet.qubetics.work/';
  TICS_RPC_URL = 'https://rpc.qubetics.com/';
  COSMO_TICS_RPC_URL = "https://tendermint-internal.qubetics.com";
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

        console.log('provider----new', provider);
        // const wallet = new ethers.Wallet(pKey, provider);
        const chainType = 'ethereum';
        const wallet = getWallet(pKey,chainType);
        console.log('wallet----wallet', provider);
        const signature = wallet.signMessage(data);
        signature.then((sig) => {
          resolve(sig);
        }).catch((err) => {
          reject(err);
        });
        // const EthRpcUrl = Singleton.getInstance().ETH_RPC_URL
        // const web3 = new Web3(EthRpcUrl);
        // const signature = web3.eth.accounts.sign(data, pKey)
        // // console.log('signPersonalMessage res::::::', signature);
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
      let web3Dapp = null;
      if (symbol?.toLowerCase() == 'bnb') {
        web3Dapp = new Web3(BscRpcUrl);
      } else if (symbol?.toLowerCase() == 'pol') {
        web3Dapp = new Web3(MaticRpcUrl);
      } else {
        web3Dapp = new Web3(EthRpcUrl);
      }
      const web3Dapp1 = web3Dapp
      const amountToSend = web3Dapp1.utils.toWei(toAmount, 'ether');
      const amount = web3Dapp1.utils.toHex(amountToSend);
      let gasPrice = gas_gwei_price;
      gasPrice = (symbol?.toLowerCase() == 'bnb' || symbol?.toLowerCase() == 'pol') ? gasPrice * 10 ** 9 : gasPrice
      const estimateGas = gas_estimate;
      const chainID = symbol?.toLowerCase() == 'bnb' ? (IS_PRODUCTION == 0 ? 97 : 56) : symbol?.toLowerCase() == 'pol' ? (IS_PRODUCTION == 0 ? 80001 : 137) : (IS_PRODUCTION == 0 ? 11155111 : 1)
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
      }
      if (status == 'unconfirmed') {
        return detailTrx.pending;
      }
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
      }
      if (status == 'unconfirmed') {
        return 'rgba(211, 155, 73, 1)';
      }
    }
  }
  //******************************************* getStatusImage **********************************************/
  getStatusImage(item, address) {
    // console.log('getStatusImage--', item?.from_adrs, '---', item?.to_adrs, address, Singleton.getInstance().defaultCosmosAddress);
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
       const encryptedPin = await encryptDataAES(pin, Constants.PIN_ENCRYPTED)
        const deviceHasSensor = await SInfo.isSensorAvailable();
        if (!deviceHasSensor) {
          //  alert('No sensor found');
          reject('No sensor found')
        }
        try {
          setTimeout(async () => {
            SInfo.setItem(Constants.KEYCHAIN_DATA_KEY, encryptedPin, {
              sharedPreferencesName: Constants.SHARED_PREFERENCES_NAME,
              keychainService: Constants.KEYCHAIN_SERVICE_NAME,
              kSecAccessControl: 'kSecAccessControlBiometryAny',
              touchID: true,
              showModal: true,
              strings: {
                header: LanguageManager.commonText.sInfoHeader,
                description: LanguageManager.commonText.sInfoDesc,
                hint: 'Biometric',
                success: LanguageManager.commonText.sInfoSuccess,
                notRecognized: LanguageManager.commonText.sInfoNotRecognized,
                cancelled: LanguageManager.commonText.sInfoCancelled, // reject error message
              },
              kSecUseOperationPrompt: LanguageManager.commonText.sInfoPermission,
            }).then((value) => {
              resolve(value); // value;
            }).catch((error) => {
              consoleLogFunc('error in setItem method in Keychain ' + error);
              reject(error); // error;
            });
          }, 1200);
        } catch (error) {
          consoleLogFunc(">>>> error", error);
          reject(error);
        }
      } catch (ex) {
        consoleLogFunc(">>>> ex", ex);
        reject(ex);
      }
    })
  }

  getTouchIDItem = async (isBiometricRequired) => {
    return new Promise(async (resolve, reject) => {
      const deviceHasSensor = await SInfo.isSensorAvailable();

      if (!deviceHasSensor) {
        // alert('No sensor found');
        reject({
          cancelled: true
        })
      }

      try {
        const data = await SInfo.getItem(Constants.KEYCHAIN_DATA_KEY, {
          sharedPreferencesName: Constants.SHARED_PREFERENCES_NAME,
          keychainService: Constants.KEYCHAIN_SERVICE_NAME,
          kSecAccessControl: 'kSecAccessControlBiometryAny',
          touchID: true,
          showModal: true,
          strings: {
            header: LanguageManager.commonText.sInfoGetHeader,
            description: LanguageManager.commonText.sInfoGetDesc,
          },
          kSecUseOperationPrompt: LanguageManager.commonText.sInfoPermission,
        });
        consoleLogFunc("data>>>", data);
        const decryptedPin = await decryptDataAES(data, Constants.PIN_ENCRYPTED)

        if ((decryptedPin == null || decryptedPin == undefined || decryptedPin == "") && !isBiometricRequired) {
          alert(LanguageManager.commonText.tryPin);
          saveData(Constants.BIOMETRIC_MODE, "false");
          reject({
            cancelled: false
          })
        } else {
          resolve(decryptedPin)
        }
      } catch (ex) {
        if (ex.message == "Cancel") {
          reject({
            cancelled: true
          })
        } else {
          reject({
            cancelled: false
          })
        }

        // alert(ex.message);
      }
    })

  }
  deleteKeyChainData = () => {
    return new Promise((resolve, reject) => {
      SInfo.deleteItem(Constants.KEYCHAIN_DATA_KEY, {
        sharedPreferencesName: Constants.SHARED_PREFERENCES_NAME,
        keychainService: Constants.KEYCHAIN_SERVICE_NAME,
        kSecAccessControl: 'kSecAccessControlBiometryAny',
      }).then(res => {
        resolve()
      }).catch(err => {
        reject()
      })
    })
  }

  isNewerVersion1 () {
    const currentVersion = DeviceInfo?.getVersion();
    const BuildVersion = DeviceInfo?.getBuildNumber();
    consoleLogFunc('-=====currentVersion=====INSIDE', currentVersion);
    consoleLogFunc('-=====BuildVersion=====INSIDE', BuildVersion);
    return new Promise(async (resolve, reject) => {
      try {
        const check = await checkVersion({
          version:  Platform.OS == 'android' ? currentVersion: Constants.CURRENT_IOS_VERSION,
          // version: Platform.OS == 'android'
          //     ? Constants.CURRENT_ANDROID_VERSION
          //     : Constants.CURRENT_IOS_VERSION, // app local version
          iosStoreURL: Constants.APP_STORE_LINK,
          androidStoreURL: Constants.ANDROID_STORE_LINK,
        });
        consoleLogFunc('-==========check', check);
        // if app store version is new
        if (check.result === 'new') {
          // resolve(check.result);
          Singleton.getInstance().isUpdateApp.showUpdateApp();
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

