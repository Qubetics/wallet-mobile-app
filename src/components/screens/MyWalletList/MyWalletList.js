import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  TouchableOpacity,
  Text,
  StyleSheet,
  Image,
  Alert,
  Platform,
  FlatList,
  BackHandler,
  NativeModules,
  ImageBackground,
} from 'react-native';
import styles from './MyWalletListStyles';
import { ThemeManager } from '../../../../ThemeManager';
import { LanguageManager } from '../../../../LanguageManager';
import {
  AppAlert,
  Button,
  CardView,
  Divider,
  HeaderMain,
  Input,
  InputCustom,
  LoaderView,
  ManageItem,
} from '../../common';
import { Actions } from '../../../navigation/RootNavigation';
import {
  bigNumberSafeMath,
  consoleLogFunc,
  exponentialToDecimal,
  getData,
  getEncryptedData,
  saveData,
  saveDataInStorage,
  toFixed,
  toFixedExp,
} from '../../../Utils/MethodsUtils';
import { Colors, Images } from '../../../theme';
import * as Constants from '../../../Constants';
import { ConfirmAlert } from '../../common/ConfirmAlert';
import Singleton from '../../../Singleton';
import { store } from '../../../Redux/Reducers';
import {
  requestCoinList,
  requestWalletLogin,
  logoutUser,
  logoutSingleUser,
  getAllWalletBal,
} from '../../../Redux/Actions';
import { useDispatch } from 'react-redux';
import CommonModal from '../../common/CommonModal';
import { BlurView } from '@react-native-community/blur';
import {
  bottomNotchWidth,
  getDimensionPercentage as dimen,
  getDimensionPercentage,
  heightDimen,
  widthDimen,
} from '../../../Utils';
import { clearStorage } from '../../../Utils/MethodsUtils';
import { EventRegister } from 'react-native-event-listeners';
import { ActionConst } from '../../../navigation/RootNavigation';
import WalletConnectInstance from '../../../Utils/WalletConnectInstance';
import { signCosmosMessage } from '../../../Utils/MnemonicsUtils';
import { disconnectVpn, stopVPN } from '../../common/WireGuardNative';
import { loginWithCosmosWallet, logoutCosmosWallet } from '../../Api/VPN/api/authWithCosmosWallet';

// import { LanguageManager } from "../../../../LanguageManager";
let selectedItem = '';
const MyWalletList = props => {
  // const {string} = languages;

  const dispatch = useDispatch();
  const [isMyWallet, setIsMyWallet] = useState(
    props?.isFrom == 'setting' ? false : true,
  );
  const [alertModal, setAlertModal] = useState(false);
  const [alertText, setAlertText] = useState('');
  const [multiwallet, setmultiwallet] = useState([]);
  const [deleteItem, setdeleteItem] = useState('');
  const [showAlertDialogConfirm, setshowAlertDialogConfirm] = useState(false);
  const [alertTxt, setalertTxt] = useState('');
  const [loading, setLoading] = useState(false);
  const [isSecretPhrase, setIsSecretPhrase] = useState(false);
  const [isNonMnemonics, setIsNonMnemonics] = useState(false);
  const [isNonPrivateKey, setIsNonPrivateKey] = useState(false);
  const [isLostSecretPhrase, setisLostSecretPhrase] = useState(false);
  const [checkedOne, setcheckedOne] = useState(false);
  const [checkedTwo, setcheckedTwo] = useState(false);
  const [checkedThree, setcheckedThree] = useState(false);
  const [wallet_name, setWallet_name] = useState(props?.walletItem?.walletName);
  const [walletNameCompare, setWalletNameCompare] = useState(
    props?.walletItem?.walletName,
  );
  const [isHideBalance, setIsHideBalance] = useState(false);
  const [integerPart, setIntegerPart] = useState('0');
  const [decimalPart, setDecimalPart] = useState('00');

  const { alertMessages, referral, pins, setting } = LanguageManager;
  const [selectionType, setSelectionType] = useState('');
  const isWalletChanging = useRef(false);
  const pinRejectRef = useRef(null);

  useEffect(() => {
    EventRegister.emit('REFRESH_PAGE_STATE');
    checkHideBalance();

    EventRegister.addEventListener('makerWalletCreated', () => {
      getData(Constants.MULTI_WALLET_LIST).then(multiWalletArray => {
        setmultiwallet(JSON.parse(multiWalletArray));
      });
    });

    getData(Constants.MULTI_WALLET_LIST).then(multiWalletArray => {
      const parsed = JSON.parse(multiWalletArray);
      consoleLogFunc('MWL_USEFFECT_STORAGE:', JSON.stringify(parsed?.map(w => ({ n: w.walletName, d: w.defaultWallet }))));
      setmultiwallet(parsed);
      getAllWalletBalance(parsed);
    });

    props.navigation.addListener('focus', () => {
      BackHandler.addEventListener('hardwareBackPress', handleBackButtonClick);
      consoleLogFunc('MWL_FOCUS_FIRED');
      if (isWalletChanging.current) {
        if (pinRejectRef.current) {
          consoleLogFunc('MWL_FOCUS: user backed out of PIN, cancelling wallet change');
          const reject = pinRejectRef.current;
          pinRejectRef.current = null;
          isWalletChanging.current = false;
          reject(new Error('PIN_CANCELLED'));
        } else {
          consoleLogFunc('MWL_FOCUS_SKIPPED: wallet change in progress');
        }
        return;
      }
      getData(Constants.MULTI_WALLET_LIST).then(multiWalletArray => {
        if (multiWalletArray) {
          const parsed = JSON.parse(multiWalletArray);
          consoleLogFunc('MWL_FOCUS_STORAGE:', JSON.stringify(parsed?.map(w => ({ n: w.walletName, d: w.defaultWallet }))));
          setmultiwallet(parsed);
          getAllWalletBalance(parsed);
        } else {
          consoleLogFunc('MWL_FOCUS_STORAGE: null/empty returned');
        }
      });
    });
    props.navigation.addListener('blur', () => {
      // BackHandler.removeEventListener('hardwareBackPress', handleBackButtonClick);
    });
    EventRegister.addEventListener(Constants.DOWN_MODAL, () => {
      setisLostSecretPhrase(false);
      setIsSecretPhrase(false);
      setAlertModal(false);
      setshowAlertDialogConfirm(false);
      setcheckedOne('');
      setcheckedThree('');
    });
  }, []);

  const checkHideBalance = () => {
    getData(Constants.HIDE_BALANCE).then(res => {
      setIsHideBalance(res == 'true' ? true : false);
    });
  };
  const getAllWalletBalance = async walletList => {
    if (isMyWallet) {
      setLoading(true);
      const fiatCurrency = await getData(Constants.SELECTED_CURRENCY);
      let walletIds = [];
      walletIds = walletList.map(item => {
        return item?.login_data?.userId;
      });
      dispatch(
        getAllWalletBal({
          userIds: walletIds,
          fiatType: fiatCurrency || 'USD',
        }),
      )
        .then(res => {
          let totalBalance = 0;
          const list = res?.data || [];
          list.map((item, index) => {
            const coins = item?.user_wallet_relation || [];
            coins.map((coin, index) => {
              totalBalance = bigNumberSafeMath(
                totalBalance,
                '+',
                bigNumberSafeMath(
                  coin?.coin?.fiat_price_data?.value || 0,
                  '*',
                  coin?.balance || 0,
                ),
              );
            });
          });
          totalBalance = toFixedExp(exponentialToDecimal(totalBalance), 2);
          consoleLogFunc('totalBalance11>>', totalBalance);

          let [wholePart, decimalPart = '00'] = totalBalance
            .toString()
            .split('.');
          wholePart = isNaN(wholePart) ? 0 : wholePart;
          wholePart = Number(wholePart).toLocaleString('en-GB');
          setIntegerPart(`${wholePart}`);
          setDecimalPart(decimalPart);
          setLoading(false);
        })
        .catch(err => {
          setLoading(false);
          consoleLogFunc('err>>>', err);
        });
    }
  };

  const checkIsPrivateKeyWallet = async item => {
    consoleLogFunc('ITE>>', item);

    if (item?.isPrivateKey) {
      setIsNonPrivateKey(true);
    } else {
      setIsNonPrivateKey(false);
    }
  };
  0;
  const handleBackButtonClick = () => {
    Actions.pop();

    return true;
  };

  const deleteWalletAction = item => {
    consoleLogFunc('multiwallet.length>>', multiwallet.length);

    setIsSecretPhrase(false);
    setdeleteItem(item);
    setTimeout(() => {
      setshowAlertDialogConfirm(true);
      setalertTxt(
        multiwallet.length == 1
          ? `${LanguageManager.manage.logout}`
          : LanguageManager.alertMessages.wantToDeleteThisWallet,
      );
    }, 500);
  };
  /* *********************************************delete***************************************** */
  const deleteWallet = () => {
    if (multiwallet.length == 1) {
      logout();
    } else {
      setLoading(true);
      setshowAlertDialogConfirm(false);

      let data = {
        deviceId: Singleton.getInstance().unique_id,
        userIds: [deleteItem?.login_data?.userId],
        type: 'single',
      };
      consoleLogFunc('deleteItem>>>', data);

      dispatch(logoutSingleUser({ data, accessToken: deleteItem?.user_jwtToken }))
        .then(res => {
          logoutCosmosWallet(deleteItem?.login_data?.defaultCosmosAddress);
          consoleLogFunc('res>>>', res);
          deleteSingleWalletFromLocal();
        })
        .catch(err => {
          consoleLogFunc('err>>>', err);
          deleteSingleWalletFromLocal(); //IF ACCESS TOKEN  NOT VALID SOMEHOW
        });
    }
  };
  const deleteSingleWalletFromLocal = () => {
    const arr = multiwallet;
    arr.map((item, index) => {
      if (item.walletName == deleteItem?.walletName) {
        arr.splice(index, 1);
      }
    });
    setmultiwallet(arr);
    saveData(Constants.MULTI_WALLET_LIST, JSON.stringify(arr));
    setAlertModal(false);
    setIsSecretPhrase(false);
    setLoading(false);
  };

  /******************************************************************************************/
  const logout = () => {
    setshowAlertDialogConfirm(false);
    setLoading(true);

    getData(Constants.DEVICE_TOKEN).then(device_token => {
      let data = {
        deviceId: Singleton.getInstance().unique_id,
        userIds: [deleteItem?.login_data?.userId],
        type: 'all',
      };
      consoleLogFunc('Logout-START==', data);
      dispatch(logoutUser({ data }))
        .then(res => {
          logoutCosmosWallet();
          clearData(data);
        })
        .catch(err => {
          consoleLogFunc('chk logotu err:::://///////', err);
          setLoading(false);
          clearData(data);
        });
    });
  };

  const clearData = async data => {
    clearStorage();
    await WalletConnectInstance.getInstance()?.deleteAllSessions();
    consoleLogFunc('Logout-response====-=-==-=-===');
    saveData(Constants.DEVICE_TOKEN, data.deviceToken);
    if (Platform.OS == 'android') {
      var ClrStorageModule = NativeModules.EncryptionModule;
      ClrStorageModule.clearApplicationData();
    }
    setTimeout(() => {
      setLoading(false);
      saveData(Constants.AUTO_LOCK_TIMEOUT, 0);
      Singleton.getInstance().dappDisconnectTimeout = 0;
      EventRegister.emit('turnOffDapp');
      saveData(Constants.DARK_MODE_STATUS, 1);
      ThemeManager.setLanguage('darkMode');
      EventRegister.emit('getThemeChanged', 1);
      EventRegister.emit('theme', '#0C0C0D');
      LanguageManager.setLanguage('English');
      Singleton.getInstance().userRefCode = '';
      global.isDeepLink = false;
      Singleton.getInstance().SelectedLanguage = 'en';
      saveData(Constants.SELECTED_LANGUAGE, 'en');

      Actions.currentScene != 'Onboarding' &&
        Actions.Onboarding({ type: ActionConst.RESET });
    }, 1200);
  };

  const makeDefault = async data => {
    if (loading) return;
    isWalletChanging.current = true;
    setLoading(true);
    consoleLogFunc('makeDefault called for:', data?.walletName);
    const allWallet = multiwallet;
    let selectedItem = '';
    const previousDefaultName = allWallet.find(w => w.defaultWallet)?.walletName;
    allWallet.map((item, index) => {
      if (
        item.walletName == data?.walletName &&
        item?.loginRequest?.wallet_address == data?.loginRequest?.wallet_address
      ) {
        item.defaultWallet = true;
        selectedItem = item;
      } else {
        item.defaultWallet = false;
      }
    });
    consoleLogFunc('MWL_MAKEDEFAULT_MUTATION:', JSON.stringify(allWallet.map(w => ({ n: w.walletName, d: w.defaultWallet }))));
    try {
      const mnemonics = await getMnemonics(selectedItem);
      consoleLogFunc('MWL_MNEMONICS_OK calling updateLocal');
      updateLocal(allWallet, selectedItem, mnemonics);
      consoleLogFunc('MWL_SET_MULTIWALLET_IMMEDIATE:', JSON.stringify(allWallet.map(w => ({ n: w.walletName, d: w.defaultWallet }))));
      setmultiwallet([...allWallet]);
    } catch (err) {
      if (err?.message !== 'PIN_CANCELLED') {
        consoleLogFunc('makeDefault getMnemonics error:', err?.message);
      }
      allWallet.forEach(item => {
        item.defaultWallet = item.walletName === previousDefaultName;
      });
      setmultiwallet([...allWallet]);
      isWalletChanging.current = false;
      setLoading(false);
    }
  };

  const getMnemonics = async selectedItem => {
    consoleLogFunc('getMnemonics: opening PIN screen for wallet:', selectedItem?.walletName);
    return new Promise((resolve, reject) => {
      pinRejectRef.current = reject;
      Singleton.getInstance().walletPinCallback = async pin => {
        pinRejectRef.current = null;
        consoleLogFunc('getMnemonics: PIN entered, fetching encrypted data...');
        setLoading(true);
        try {
          const mnemonics = await getEncryptedData(selectedItem.loginRequest.wallet_address, pin);
          consoleLogFunc('getMnemonics: encrypted data retrieved OK');
          resolve(mnemonics);
        } catch (error) {
          consoleLogFunc('getMnemonics: getEncryptedData error:', error?.message);
          setLoading(false);
          reject(error);
        }
      };
      Actions.EnterPinSecurity({
        from: 'Security',
        fromScreen: 'Security',
      });
    });
  };


  /* *********************************************updateLocal***************************************** */
  const updateLocal = async (newArray, selectedItem, mnemonics) => {
    consoleLogFunc('MWL_UPDATELOCAL_START:', JSON.stringify(newArray.map(w => ({ n: w.walletName, d: w.defaultWallet }))));
    const item = selectedItem;
    let ethAddress = '';
    let btcAddress = '';
    let solAddress = '';
    let trxAddress = '';
    let ticsAddress = '';
    let cosmosAddress = '';

    item.loginRequest.addressList.map((item, index) => {
      consoleLogFunc('loginRequest--', item);

      const symbol = item.symbol?.toLowerCase();
      if (symbol === 'trx') {
        trxAddress = item.address;
      } else if (symbol === 'btc') {
        btcAddress = item.address;
      } else if (symbol === 'sol') {
        solAddress = item.address;
      } else if (symbol === 'tics') {
        if (item.address?.startsWith('0x')) {
          ticsAddress = item.address; // Ethereum-based tics
        } else if (
          item.address?.startsWith('qubetics') ||
          item?.address?.startsWith('cosmos')
        ) {
          cosmosAddress = item.address; // Cosmos-based tics
        }
      } else if (symbol === 'eth') {
        ethAddress = item.address;
      }
    });

    consoleLogFunc('loginRequest--11', cosmosAddress, ticsAddress);

    Singleton.getInstance().defaultEthAddress = ethAddress;
    Singleton.getInstance().defaultBnbAddress = ethAddress;
    Singleton.getInstance().defaultMaticAddress = ethAddress;
    Singleton.getInstance().defaultBtcAddress = btcAddress;
    Singleton.getInstance().defaultTrxAddress = trxAddress;
    Singleton.getInstance().defaultSolAddress = solAddress;
    Singleton.getInstance().defaultTicsAddress = ticsAddress;
    Singleton.getInstance().defaultCosmosAddress = cosmosAddress;

    Singleton.getInstance().defaultEmail = item.login_data?.userEmail;
    Singleton.getInstance().refCode = item.login_data?.refCode;
    Singleton.getInstance().refCode = item.login_data?.refCode;

    consoleLogFunc('updateLocal: signing cosmos message...');
    const message = cosmosAddress ? cosmosAddress : 'Hello Cosmos';

    const { pubKey, signature } = await signCosmosMessage(
      mnemonics?.toLowerCase()?.trim(),
      cosmosAddress,
      message,
    );
    consoleLogFunc('updateLocal: cosmos message signed OK');

    consoleLogFunc('updateLocal: disconnecting VPN...');
    Platform.OS === 'android' ? await disconnectVpn() : await stopVPN();
    consoleLogFunc('updateLocal: calling loginWithCosmosWallet...');
    try {
      const result = await loginWithCosmosWallet({
        wallet_address: cosmosAddress,
        pubKey: pubKey,
        signatureBase64: signature,
      });
      consoleLogFunc('updateLocal: loginWithCosmosWallet OK');
    } catch (err) {
      consoleLogFunc('updateLocal: loginWithCosmosWallet FAILED:', err?.message || err);
      isWalletChanging.current = false;
      setLoading(false);
      setAlertModal(true);
      setAlertText(err);
      return;
    }



    let sessions =
      await WalletConnectInstance.getInstance()?.web3Wallet?.getActiveSessions();
    if (sessions) {
      let keys = Object?.keys(sessions);
      if (keys?.length > 0) {
        Singleton.getInstance().showToast?.show(
          'All connections disconnected successfully',
          2000,
        );
      }
    }
    consoleLogFunc('updateLocal: deleting WalletConnect sessions...');
    await WalletConnectInstance.getInstance()?.deleteAllSessions();
    consoleLogFunc('MWL_SAVE_BEFORE:', JSON.stringify(newArray.map(w => ({ n: w.walletName, d: w.defaultWallet }))));
    await saveDataInStorage(Constants.USER_ID, item.login_data.userId);
    await saveDataInStorage(
      Constants.MULTI_WALLET_LIST,
      JSON.stringify(newArray),
    );
    consoleLogFunc('MWL_SAVE_DONE');
    await saveDataInStorage(Constants.ACCESS_TOKEN, item.user_jwtToken);
    await saveDataInStorage(
      Constants.ACTIVE_ADDRESS_LIST,
      JSON.stringify(item.loginRequest.addressList),
    );
    consoleLogFunc('CoinsList==2===', item.coinFamilyKeys);

    EventRegister.emit('isMakerWallet', false);
    Singleton.getInstance().isMakerWallet = false;
    Singleton.getInstance().isOnlyBtcCoin = false;
    Singleton.getInstance().isOnlyTrxCoin = false;
    await saveDataInStorage(
      Constants.ADDRESS_LIST,
      JSON.stringify(item.addrsListKeys),
    );
    await saveDataInStorage(
      Constants.COIN_FAMILY_LIST,
      JSON.stringify(item.coinFamilyKeys),
    );
    await saveDataInStorage(
      Constants.LOGIN_DATA,
      JSON.stringify(item.login_data),
    );
    await saveDataInStorage(Constants.WALLET_NAME, item.walletName);
    await saveDataInStorage(Constants.REFRESH_TOKEN, item.user_refreshToken);
    await saveDataInStorage(Constants.FAVORITE, JSON.stringify([]));
    saveData(Constants.COSMOS_ADDRESS, cosmosAddress);

    Singleton.getInstance().walletName = item.walletName;
    Singleton.isFirsLogin = true;

    const refreshed = JSON.parse(JSON.stringify(newArray));
    consoleLogFunc('MWL_SET_REFRESHED:', JSON.stringify(refreshed.map(w => ({ n: w.walletName, d: w.defaultWallet }))));
    setmultiwallet(refreshed);

    getData(Constants.MULTI_WALLET_LIST).then(verify => {
      consoleLogFunc('MWL_VERIFY_STORAGE:', JSON.stringify(JSON.parse(verify)?.map(w => ({ n: w.walletName, d: w.defaultWallet }))));
    });

    setTimeout(() => {
      EventRegister.emit('makerWalletChange', false);
      consoleLogFunc('MWL_REQUEST_COINLIST');
      store
        .dispatch(requestCoinList({}))
        .then(res => {
          consoleLogFunc('MWL_POP_NOW');
          setIsSecretPhrase(false);
          setLoading(false);
          isWalletChanging.current = false;
          Actions.pop();
        })
        .catch(err => {
          consoleLogFunc('MWL_POP_ERROR:', err?.message || err);
          setIsSecretPhrase(false);
          isWalletChanging.current = false;
          Actions.pop();
          setLoading(false);
        });
    }, 150);
  };

  /* *********************************************update wallet name***************************************** */

  const onPressContinue = () => {
    setIsSecretPhrase(false);

    if (wallet_name?.trim().length == 0) {
      setTimeout(() => {
        setAlertModal(true);
        setAlertText(LanguageManager.alertMessages.enterWalletName);
      }, 200);

      return;
    }
    consoleLogFunc('2');
    if (wallet_name?.length < 3) {
      setTimeout(() => {
        setAlertModal(true);
        setAlertText(LanguageManager.createWalletTexts.validName);
      }, 200);

      return;
    }
    consoleLogFunc('13');
    if (multiwallet?.length > 0) {
      const iswalletNameExist = multiwallet?.find(
        item => item?.walletName?.toLowerCase() == wallet_name?.toLowerCase(),
      );
      consoleLogFunc('4', iswalletNameExist);
      if (iswalletNameExist) {
        consoleLogFunc('56', iswalletNameExist);
        setTimeout(() => {
          setAlertModal(true);

          setAlertText(LanguageManager.alertMessages.walletAlreadyExists);
        }, 200);

        return;
      }
    }
    consoleLogFunc('4');

    consoleLogFunc('5');

    let wallet = selectedItem;
    let updatedList = multiwallet;
    consoleLogFunc('wallet--- ', wallet);

    updatedList?.length > 0 &&
      updatedList?.map((item, index) => {
        if (
          item.walletName == wallet?.walletName &&
          item?.loginRequest?.wallet_address ==
          wallet?.loginRequest?.wallet_address
        ) {
          item.walletName = wallet_name?.trim();
          item.loginRequest.wallet_name = wallet_name?.trim();
          item.login_data.walletName = wallet_name?.trim();
        }
      });
    setmultiwallet(updatedList);
    consoleLogFunc('updatedList--- ', updatedList);

    saveData(Constants.MULTI_WALLET_LIST, JSON.stringify(updatedList));

    if (wallet?.defaultWallet) {
      saveData(Constants.WALLET_NAME, wallet_name?.trim());
      Singleton.getInstance().walletName = wallet_name?.trim();
    }
    Singleton.getInstance().showToast?.show('Update Successfully', 2000);

    // Actions.pop()
  };
  const onHideShowBalance = () => {
    consoleLogFunc('onHideShowBalance>>>');
    const value = !isHideBalance;
    setIsHideBalance(value);
    Singleton.getInstance().isHideBalance = value;
    saveData(Constants.HIDE_BALANCE, `${value}`);
  };

  return (
    <>
      <ImageBackground
        source={ThemeManager.ImageIcons.mainBgImgNew}
        style={{ flex: 1, backgroundColor: ThemeManager.colors.mainBgNew }}>
        <View style={{ flex: 1 }}>
          <HeaderMain
            BackButtonText={
              isMyWallet
                ? LanguageManager.swapText.myWallets
                : LanguageManager.manageWallet.manageWallet
            }
            customStyle={{ paddingHorizontal: widthDimen(24) }}
          />

          <View style={styles.mainView}>
            <View style={styles.subView}>
              {isMyWallet && (
                <View>
                  <Text
                    style={[
                      styles.totalBal,
                      { color: ThemeManager.colors.blackWhiteText },
                    ]}>
                    {LanguageManager.walletMain.totalBal}
                  </Text>
                  <View
                    style={{
                      flexDirection: 'row',
                      marginVertical: heightDimen(10),
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}>
                    <Text
                      allowFontScaling={false}
                      style={[
                        styles.balAmount,
                        { color: ThemeManager.colors.blackWhiteText },
                      ]}>
                      {Singleton.getInstance().CurrencySymbol}
                      {isHideBalance ? '*****' : integerPart}
                      <Text
                        allowFontScaling={false}
                        style={[
                          styles.bal,
                          { color: ThemeManager.colors.blackWhiteText },
                        ]}>
                        {'.'}
                        {isHideBalance ? '**' : decimalPart}
                      </Text>
                    </Text>
                    <TouchableOpacity onPress={onHideShowBalance}>
                      <Image
                        style={{ tintColor: ThemeManager.colors.blackWhiteText }}
                        source={
                          !isHideBalance
                            ? Images.showBalanceIcon
                            : Images.hideBalanceIcon
                        }
                      />
                    </TouchableOpacity>
                  </View>
                </View>
              )}

              <FlatList
                bounces={false}
                keyExtractor={(item, index) => index + ''}
                showsVerticalScrollIndicator={false}
                data={multiwallet}
                renderItem={({ item, index }) => {
                  return (
                    <ManageItem
                      walletName={item?.login_data.walletName}
                      walletType={
                        item?.defaultWallet
                          ? LanguageManager.setting.defaultWallet
                          : item?.loginRequest.wallet_address.substring(0, 13) +
                          '...' +
                          item?.loginRequest.wallet_address.substring(
                            item?.loginRequest.wallet_address.length - 4,
                            item?.loginRequest.wallet_address.length,
                          )
                      }
                      // firstIcon={
                      //   !item?.defaultWallet
                      //     ? ThemeManager.ImageIcons.deleteIcon
                      //     : null
                      // }
                      secondIcon={
                        isMyWallet
                          ? null
                          : ThemeManager.ImageIcons.manageAlertIcon
                      }
                      onClickFirst={() => {
                        deleteWalletAction(item);
                      }}
                      onClickSecond={() => {
                        selectedItem = item;
                        // setClickedItem(item);
                        setTimeout(() => {
                          setWallet_name(item?.walletName);
                          setWalletNameCompare(item?.walletName);
                          checkIsPrivateKeyWallet(item);
                          setIsSecretPhrase(true);
                        }, 300);
                      }}
                      onclickWallet={() => {
                        makeDefault(item);
                      }}></ManageItem>
                  );
                }}
              />
            </View>

            <View style={{ marginBottom: heightDimen(50) }}>
              <Button
                onPress={() => {
                  Actions.currentScene != 'ManageOnboarding' &&
                    Actions.ManageOnboarding({ screen: 'managewallet' });
                }}
                customStyle={{ marginTop: 20 }}
                buttontext={LanguageManager.manageWallet.addnewWallet}
              />
            </View>
          </View>

          {showAlertDialogConfirm && (
            <ConfirmAlert
              text={LanguageManager.addressBook.yes}
              alertTxt={alertTxt}
              hideAlertDialog={() => {
                setshowAlertDialogConfirm(false);
              }}
              ConfirmAlertDialog={() => {
                deleteWallet();
              }}
            />
          )}
          <LoaderView isLoading={loading} />
        </View>
      </ImageBackground>
      {/* {isSecretPhrase && (
        <BlurView
          style={styles.blurView}
          blurType="dark"
          blurAmount={2}
        // reducedTransparencyFallbackColor="red"
        />
      )} */}

      {isSecretPhrase && (
        <CommonModal
          isTopLine={false}
          visible={isSecretPhrase}
          onClose={() => setIsSecretPhrase(false)}
          button={true}>
          <View style={styles.mainStyleOne}>
            <View style={styles.imagetextContainerNew}>
              <Text
                style={[
                  styles.txt2,
                  { color: ThemeManager.colors.blackWhiteText },
                ]}>
                {LanguageManager.walletMain.Wallet}
              </Text>
              <TouchableOpacity
                onPress={() => {
                  setIsSecretPhrase(false);
                  // navigation.navigate('VerifySecretPhrase');
                }}>
                <Image
                  style={styles.crossIconStyle}
                  source={ThemeManager.ImageIcons.cardCross}
                />
              </TouchableOpacity>
            </View>

            <View
              style={[
                styles.ViewStyle2,
                { borderColor: ThemeManager.colors.dividerColor },
              ]}>
              <Input
                // editable={false}
                labelRow={true}
                labelOne={LanguageManager.walletName.walletName}
                labelTwo={
                  selectedItem?.defaultWallet
                    ? LanguageManager.setting.default
                    : 'Multicoin Wallet'
                }
                value={wallet_name}
                onChangeText={val => {
                  if (Constants.ALPHANUMERIC_WITH_SPACE_REGEX.test(val)) {
                    setWallet_name(val);
                  }
                }}
                placeholder={LanguageManager.walletName.walletName}
                maxLength={20}
                inputStyle={{
                  color: ThemeManager.colors.blackWhiteText,
                  borderRadius: dimen(14),
                  backgroundColor: ThemeManager.colors.inputBgNew,
                }}
                style={{ marginTop: dimen(0) }}
              />
            </View>

            {!isNonMnemonics && (
              <>
                {isNonPrivateKey ? (
                  <View style={{ height: dimen(23) }} />
                ) : (
                  <CardView
                    leftImg={true}
                    imgStyleLeft={{
                      height: dimen(20),
                      width: dimen(20),
                      resizeMode: 'contain',
                    }}
                    imgStyle={{
                      height: dimen(16),
                      width: dimen(22),
                      resizeMode: 'contain',
                    }}
                    leftImgIcon={ThemeManager.ImageIcons.backupMnemonics}
                    leftTextStyle={styles.textStyle}
                    leftText={setting.backupMnemonics}
                    gradientStyle={{ marginTop: dimen(23) }}
                    // ViewStyle={{paddingVertical: dimen(20)}}
                    imgIcon={ThemeManager.ImageIcons.rightArrowLong}
                    showIcon={true}
                    mainStyle={{
                      paddingHorizontal: dimen(0),
                      marginTop: dimen(16),
                    }}
                    hideBottom={true}
                    onPress={() => {
                      setSelectionType('mnemonics');
                      setIsSecretPhrase(false);
                      setTimeout(() => {
                        setisLostSecretPhrase(true);
                      }, 10);
                    }}
                    cardStyle={{
                      backgroundColor: ThemeManager.colors.inputBgNew,
                    }}
                  />
                )}

                <CardView
                  leftImg={true}
                  imgStyleLeft={{
                    height: dimen(20),
                    width: dimen(20),
                    resizeMode: 'contain',
                  }}
                  leftImgIcon={ThemeManager.ImageIcons.backupPrivateKey}
                  leftText={setting.backupPrivateKey}
                  leftTextStyle={styles.textStyle}
                  imgStyle={{
                    height: dimen(16),
                    width: dimen(22),
                    resizeMode: 'contain',
                  }}
                  imgIcon={ThemeManager.ImageIcons.rightArrowLong}
                  gradientStyle={{ marginTop: dimen(16) }}
                  // imgStyle={{ tintColor: ThemeManager.colors.cloudy }}
                  mainStyle={{
                    paddingHorizontal: dimen(0),
                    marginTop: dimen(0),
                  }}
                  hideBottom={false}
                  onPress={() => {
                    setSelectionType('managewallet');

                    setIsSecretPhrase(false);
                    setTimeout(() => {
                      setisLostSecretPhrase(true);
                    }, 10);
                  }}
                  cardStyle={{
                    backgroundColor: ThemeManager.colors.inputBgNew,
                  }}
                />
              </>
            )}

            {walletNameCompare !== wallet_name && (
              <Button
                buttontext={'Update'}
                onPress={() => {
                  onPressContinue(wallet_name);
                }}
              />
            )}

            {selectedItem?.defaultWallet && multiwallet.length > 1 ? (
              <View style={{ marginBottom: heightDimen(30) }} />
            ) : (
              <TouchableOpacity
                onPress={() => {
                  deleteWalletAction(selectedItem);
                }}
                style={{
                  borderWidth: 1,
                  borderColor: ThemeManager.colors.borderColor,
                  borderRadius: 14,
                  marginTop: dimen(15),
                  marginBottom: dimen(40),
                  paddingVertical: dimen(15),
                }}>
                <Text
                  allowFontScaling={false}
                  style={[
                    styles.txtDelete,
                    {
                      color: ThemeManager.colors.redColor,
                      textAlign: 'center',
                    },
                  ]}>
                  {LanguageManager.setting.deleteWallet}
                </Text>
              </TouchableOpacity>
            )}
            {/* {!selectedItem?.defaultWallet && (
              <CardView
              imgStyleLeft={{
                height: dimen(20),
                width: dimen(20),
                resizeMode: "contain",
              }}
         
                leftImg={true}
                leftImgIcon={ThemeManager.ImageIcons.backupPrivateKey}
                leftText={"Make Default"}
             
                // imgIcon={ThemeManager.ImageIcons.rightArrowLong}
                gradientStyle={{ marginTop: dimen(16) }}
                // imgStyle={{ tintColor: ThemeManager.colors.cloudy }}
                mainStyle={{ paddingHorizontal: dimen(0), marginTop: dimen(0) }}
                hideBottom={false}
                onPress={() => {
                  makeDefault(selectedItem);
                }}
                imgStyle={{
                  height: dimen(16),
                  width: dimen(22),
                  resizeMode: "contain",
                }}
                imgIcon={ThemeManager.ImageIcons.arrowRight}
                // img={Images.Lock}
                // text={pins.resetPasscode}
              />
            )} */}

            {/* {!selectedItem?.defaultWallet && (
              <TouchableOpacity
                onPress={() => {
                  deleteWalletAction(selectedItem);
                }}
              >
                <Text
                  allowFontScaling={false}
                  style={[
                    styles.txtDelete,
                    { color: ThemeManager.colors.DarkRed, textAlign: "center" },
                  ]}
                >
                  {LanguageManager.setting.deleteWallet}
                </Text>
              </TouchableOpacity>
            )} */}
            {/* <Button
              myStyle={[styles.buttonstyle]}
              buttontext={"Update"}
              onPress={() => {
                onPressContinue();
              }}
            /> */}
          </View>
        </CommonModal>
      )}

      <AppAlert
        visible={alertModal}
        alertTxt={alertText}
        hideAlertDialog={() => {
          setAlertModal(false);
        }}
      />
      <CommonModal
        isTopLine={false}
        visible={isLostSecretPhrase}
        onClose={() => {
          setcheckedOne('');
          setcheckedThree('');
          setisLostSecretPhrase(false);
        }}
        button={true}>
        <View style={styles.mainStyle}>
          <View style={styles.imagetextContainer}>
            <Text
              style={[
                styles.txt2,
                { color: ThemeManager.colors.blackWhiteText },
              ]}>
              {selectionType == 'mnemonics'
                ? LanguageManager.walletName.thisSecretPhrase
                : LanguageManager.walletName.thisPrivateKey}
            </Text>
            <Text
              style={[
                styles.txt3,
                { color: ThemeManager.colors.legalGreyColor },
              ]}>
              {LanguageManager.walletName.tapOnAll}
            </Text>
          </View>
          <TouchableOpacity
            onPress={() => setcheckedOne(!checkedOne)}
            style={styles.imagetextContainerOne}>
            <View>
              <Image
                style={[
                  styles.dotStyle,
                  { tintColor: ThemeManager.colors.primaryColor },
                ]}
                source={
                  checkedOne
                    ? ThemeManager.ImageIcons.checkedIcon
                    : ThemeManager.ImageIcons.unCheckedIcon
                }
                resizeMode="contain"
              />
            </View>

            <Text
              style={[
                styles.txt4,
                { color: ThemeManager.colors.legalGreyColor },
              ]}>
              {LanguageManager.walletName.ifILose}
            </Text>
          </TouchableOpacity>

          {/* <TouchableOpacity onPress={() => setcheckedTwo(!checkedTwo)}>
            <View style={styles.imagetextContainerTwo}>
              <Image
                style={styles.dotStyle}
                source={
                  checkedTwo
                    ? ThemeManager.ImageIcons.checkedIcon
                    : ThemeManager.ImageIcons.unCheckedIcon
                }
              />
              <Text
                style={[styles.txt4, { color: ThemeManager.colors.blackWhiteText }]}
              >
                {LanguageManager.walletName.ifILose}
              </Text>
            </View>
          </TouchableOpacity> */}

          <TouchableOpacity
            onPress={() => setcheckedThree(!checkedThree)}
            style={styles.imagetextContainerThree}>
            <View>
              <Image
                style={[
                  styles.dotStyle,
                  { tintColor: ThemeManager.colors.primaryColor },
                ]}
                source={
                  checkedThree
                    ? ThemeManager.ImageIcons.checkedIcon
                    : ThemeManager.ImageIcons.unCheckedIcon
                }
              />
            </View>
            <Text
              style={[
                styles.txt4,
                { color: ThemeManager.colors.legalGreyColor },
              ]}>
              {LanguageManager.walletName.walletSupportNotice}
            </Text>
          </TouchableOpacity>

          {/* <View style={styles.btnMainView}>
              <Button
                btnTextStyle={{color: ThemeManager.colors.mainColor}}
                btnstyle={[styles.buttonstyleOne]}
                buttontext={LanguageManager.sendTrx.Cancel}
                onPress={() => {
                  setisTransactionSetting(false);
                }}
              />
              <Button
                btnstyle={[styles.buttonstyle]}
                buttontext={LanguageManager.pins.Continue}
                onPress={() => {
                  setisTransactionSetting(false);
                }}
              />
            </View> */}

          <View style={[styles.btnViewModal]}>
            <View style={{ marginRight: dimen(8) }}>
              <Button
                buttontext={LanguageManager.sendTrx.Cancel}
                onPress={() => {
                  setcheckedOne('');
                  setcheckedThree('');
                  setisLostSecretPhrase(false);
                }}
                myStyle={{ width: widthDimen(182), alignItems: 'center' }}
                viewStyle={{
                  backgroundColor: ThemeManager.colors.mnemonicsBg,
                  ...styles.borderButtonStyle,
                }}
              />
              {/* <Button
                  btnstyle={{ color: ThemeManager.colors.mainColor, }}
                  myStyle={[styles.buttonstyleOne]}
                  buttontext={LanguageManager.sendTrx.Cancel}
                  onPress={() => {
                    setisLostSecretPhrase(false)
                  }}
                /> */}
            </View>
            <View style={{ marginLeft: dimen(8) }}>
              <Button
                buttontext={LanguageManager.pins.Continue}
                disabled={!(checkedOne && checkedThree)}
                myStyle={{ width: widthDimen(182), alignItems: 'center' }}
                onPress={() => {
                  setcheckedOne('');
                  setcheckedThree('');
                  setisLostSecretPhrase(false);
                  {
                    selectionType == 'mnemonics'
                      ? Actions.currentScene !== 'EnterPinSecurity' &&
                      Actions.EnterPinSecurity({
                        fromScreen: 'WalletManage',
                        selectionType: 'mnemonics',
                        walletItem: selectedItem,
                      })
                      : Actions.currentScene !== 'EnterPinSecurity' &&
                      Actions.EnterPinSecurity({
                        fromScreen: 'WalletManage',
                        walletItem: selectedItem,
                      });
                  }

                  setcheckedOne(''); // Example of setting checkedOne to true
                  setcheckedTwo(''); // Example of setting checkedTwo to true
                  setcheckedThree('');
                }}
              />
            </View>
          </View>
        </View>
      </CommonModal>
    </>
  );
};

export default MyWalletList;
