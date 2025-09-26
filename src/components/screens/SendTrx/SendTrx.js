/* eslint-disable react-native/no-inline-styles */
import Clipboard from "@react-native-clipboard/clipboard";
import React, { Component } from "react";
import {
  AppState,
  Image,
  ImageBackground,
  Modal,
  Platform,
  Text,
  TouchableOpacity,
  View
} from "react-native";
import ReactNativeBiometrics, { BiometryTypes } from 'react-native-biometrics';
import { EventRegister } from "react-native-event-listeners";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { ActionConst, Actions } from "react-native-router-flux";
import { connect } from "react-redux";
import { LanguageManager } from "../../../../LanguageManager";
import { ThemeManager } from "../../../../ThemeManager";
import * as Constants from "../../../Constants";
import {
  addAddress,
  fetchNative_CoinPrice,
  fetchNativePrice,
  getFeeLimit,
  requestCoinBalance,
  requestGasEstimation,
  requestSendCoin,
} from "../../../Redux/Actions";
import Singleton from "../../../Singleton";
import { getDimensionPercentage, heightDimen } from "../../../Utils";
import {
  bigNumberFormat,
  clearGarbageCollection,
  consoleLogFunc,
  exponentialToDecimal,
  getData,
  getEncryptedData,
  toFixedExp
} from "../../../Utils/MethodsUtils";
import {
  createTrxRaw,
  createTrxTokenRaw,
  validateTRXAddress,
} from "../../../Utils/TronUtils";
import { Colors, Fonts } from "../../../theme";
import {
  AddressModal,
  AppAlert,
  Button,
  ConfirmTxnModal,
  HeaderMain,
  InputCustom,
  InputCustomWithPasteButton,
  QRCodeScannerNew
} from "../../common";
import { KeyBoardAwareComp } from "../../common/KeyBoardAwareComp";
import { LoaderView } from "../../common/LoaderView";
import ContactsBook from "../ContactsBook/ContactsBook";
import EnterPinForTransaction from "../EnterPinForTransaction/EnterPinForTransaction";
import styles from "./SendTrxStyle";

const rnBiometrics = new ReactNativeBiometrics();

class SendTrx extends Component {
  constructor(props) {
    super(props);
    this.state = {
      disabled: false,
      newObj: "",
      showConfirmModal: false,
      nativePrice: 0,
      modalVisible: false,
      isButtonDisabled: false,
      toAddress:
        this.props.from == "Card" || this.props.from == "referral"
          ? this.props.address.toString()
          : "",
      selectedCoin: this.props.selectedCoin,
      isLoading: false,
      amount:
        this.props.from == "Card" || this.props.from == "referral"
          ? this.props.fee
            ? this.props.fee.toString()
            : ""
          : "",
      totalFee: 0,
      isVisible: false,
      valueInUSD:
        this.props.from == "Card"
          ? toFixedExp(
            exponentialToDecimal(
              this.props.fee * this.props.selectedCoin?.fiat_price_data?.value
            ),
            8
          )
          : this.props.from == "referral"
            ? toFixedExp(
              exponentialToDecimal(
                this.props.fee *
                this.props.selectedCoin?.card_fiat_price_data?.value
              ),
              8
            )
            : 0,
      bioMetricMode: false,
      showAlertDialog: false,
      alertTxt: "",
      maxclicked: false,
      PinModal: false,
      errorMsg: "",
      txnRaw: "",
      showFee: false,
      feeLimit: "40000000",
      showContactlModal: false,
      showAddressBookModal: false,
      selectedItem: '',
      selected_Index: undefined,
      isReqSent: false,
      walletName: '',
      coinBal: 0
    };
    this.isMakerWallet = Singleton.getInstance().isMakerWallet
  }

  //******************************************************************************************/
  componentDidMount() {
    consoleLogFunc("Props:::::1111", this.props.selectedCoin);
    getData(Constants.LOGIN_DATA).then((res) => {
      const result = JSON.parse(res);
      consoleLogFunc("LOGIN_DATA ------");
      this.setState({
        makerUserId: result?.makerUserId,
      });
    });
    getData(Constants.WALLET_NAME).then(async (res) => {
      consoleLogFunc('walletName res ------', res);
      this.setState({ walletName: res })
    });
    EventRegister.addEventListener(Constants.DOWN_MODAL, () => {
      this.setState({
        showAlertDialog: false,
        alertTxt: "",
        showConfirmModal: false,
        isVisible: false,
        PinModal: false,
        disabled: false,
        showAddressBookModal: false

      });
    });
    this.fetchNativePrice();
    this.fetchFeeLimit();
    this.focusListener = this.props.navigation.addListener("didFocus", async () => {
      this.fetchNativeCoinBal();
    });
    AppState.addEventListener("change", (nextState) => {
      if (Platform.OS == "android")
        this.setState({
          isVisible: false,
          modalVisible: false,
          PinModal: false,
        });
      else this.setState({ isVisible: false, modalVisible: false });
    });
    getData(Constants.BIOMETRIC_MODE).then((bio_mode) => {
      if (bio_mode == "false") this.setState({ bioMetricMode: false });
      else this.setState({ bioMetricMode: true });
    });
    // this.backhandle = BackHandler.removeEventListener('hardwareBackPress', this.handleBackButtonClick);
    // if (this.backhandle) this.backhandle.remove();
  }

  componentWillUnmount() {
    clearGarbageCollection()
    if (this.focusListener) this.focusListener?.remove();

  }

  //******************************************************************************************/
  fetchNativePrice() {
    const data = {
      fiat_currency: Singleton.getInstance().CurrencySelected,
      coin_family: 6,
    };
    this.props
      .fetchNativePrice({ data })
      .then((res) => {
        this.setState({
          nativePrice: toFixedExp(res?.fiatCoinPrice?.value, 2),
        });
        consoleLogFunc("chk res native price:::::", res);
      })
      .catch((err) => {
        consoleLogFunc("chk err native price:::::", err);
      });
  }

  /******************************************************************************************/
  fetchNativeCoinBal() {
    let data = {
      wallet_address: Singleton.getInstance().defaultTrxAddress,
      coin_family: 6,

    };
    this.props
      .requestCoinBalance(data)
      .then((res) => {
        this.setState({
          coinBal: res?.data?.wallet_data?.balance || 0
        });
        consoleLogFunc("chk res fetchNative_CoinPrice price:::::", res);
      })
      .catch((err) => {
        consoleLogFunc("chk err fetchNative_CoinPrice price:::::", err);
      });
  }

  //******************************************************************************************/
  fetchFeeLimit() {
    this.props
      .getFeeLimit({})
      .then((res) => {
        this.setState({ feeLimit: res ? res * 10 ** 6 : "40000000" });
        consoleLogFunc("chk res native price:::::fetchFeeLimit", res);
      })
      .catch((err) => {
        consoleLogFunc("chk err native price:::::", err);
      });
  }

  getPreCalculateTransactionFees = () => {

    clearTimeout(this.getFeesTimer)
    this.getFeesTimer = setTimeout(async () => {
      if (validateTRXAddress(this.state.toAddress) && this.state.amount > 0) {
        const gasEstimationReq = {
          to_address: this.state.toAddress,
          from_address: Singleton.getInstance().defaultTrxAddress,
          amount: this.state.amount
        };

        const { is_token, token_address, coin_symbol } = this.state.selectedCoin;
        this.setState({ isLoading: true });
        getData(Constants.ACCESS_TOKEN).then((token) => {
          this.props
            .requestGasEstimation({
              url: `tron/${is_token == 0 ? coin_symbol?.toLowerCase() : token_address
                }/gas_estimation`,
              gasEstimationReq,
              token,
            })
            .then((res) => {
              consoleLogFunc("chk gasEstimate res:::::", res);
              this.setState({ isLoading: false, totalFee: res?.data?.trx, });
            })
            .catch((e) => {
              consoleLogFunc("ERR>>", e);

              this.setState({ isLoading: false });
            });
        });
      }
    }, 1000);

  };

  //******************************************************************************************/
  checkBiometricAvailabilty() {
    rnBiometrics.isSensorAvailable().then((resultObject) => {
      const { available, biometryType } = resultObject;
      if (available && biometryType === BiometryTypes.TouchID) {
        consoleLogFunc("TouchID is supported");
        this.bimetricPrompt();
      } else if (available && biometryType === BiometryTypes.FaceID) {
        consoleLogFunc("FaceID is supported");
        this.bimetricPrompt();
      } else if (
        available &&
        biometryType === BiometryTypes.Biometrics
      ) {
        consoleLogFunc("Biometrics is supported");
        this.bimetricPrompt();
      } else {
        consoleLogFunc("Biometrics not supported");
      }
    });
  }

  //******************************************************************************************/
  bimetricPrompt() {
    try {
      Singleton.getInstance().getTouchIDItem().then((res) => {
        this.onPinSuccess(res);
      }).catch((err) => {
      })
    } catch (e) {
      consoleLogFunc('Device not Support Fingerprint');
    }
  }
  setModalVisible = (visible) => {
    this.setState({ modalVisible: visible });
  };

  //******************************************************************************************/
  requestCameraPermission() {
    Singleton.getInstance()
      .cameraPermission()
      .then((res) => {
        if (res == "granted") {
          Singleton.isCameraOpen = true;
          this.setState({ isVisible: true });
        }
      });
  }

  //******************************************************************************************/
  sendSerializedTxn(tx_raw) {
    const { toAddress, amount, selectedCoin, totalFee } = this.state;
    const { is_token, token_address, coin_symbol, coin_id } = selectedCoin;
    const sendCoinReq = {
      nonce: 0,
      tx_raw: tx_raw,
      from: Singleton.getInstance().defaultTrxAddress,
      to: toAddress,
      amount: amount,
      gas_estimate: "",
      gas_price: "",
      tx_type:
        this.props.from == "Card"
          ? this.props.fee == ""
            ? "card_recharge"
            : "card_fees"
          : this.props.from == "referral"
            ? "level_upgradation_fee"
            : "withdraw",
      referral_upgrade_level:
        this.props.from == "referral" ? this.props.next_level_refTyp : "",
      coin_id: coin_id,
      card_id: this.props.from == "Card" ? this.props.cardId : "",
      fee: totalFee,
    };
    consoleLogFunc("sendCoinReq::::", sendCoinReq);
    this.props
      .requestSendCoin({
        url: `tron/${is_token == 0 ? coin_symbol?.toLowerCase() : token_address
          }/send`,
        coinSymbol: coin_symbol,
        sendCoinReq,
      })
      .then((res) => {
        if (this.props.from == "Card") {
          if (this.props.fee == "") {
            Actions.PrepaidCard();
          } else {
            global.fromSendTrx = true;
            Actions.pop();
          }
        } else if (this.props.from == "referral") {
          Singleton.bottomBar?.navigateTab("Settings");
          Actions.jump("Settings");
        } else {
          consoleLogFunc('TransactionHistory------:::::');
          // Actions.replace("TransactionHistory", {
          //   selectedCoin: this.state.selectedCoin,
          // });
          Actions.TransactionHistory({ type: ActionConst.RESET, selectedCoin: this.state.selectedCoin });
          this.setState({ isLoading: false });
        }
      })
      .catch((e) => {
        this.setState({ isLoading: false });
        this.setState({ showAlertDialog: true, alertTxt: e });
      });
  }

  //******************************************************************************************/
  async sendTransaction() {
    consoleLogFunc('sendTransaction ----')
    const { alertMessages, sendTrx } = LanguageManager;
    const { toAddress, amount, selectedCoin, showFee, totalFee } = this.state;
    let coinBal = this.state.selectedCoin?.balance;

    consoleLogFunc("chk bala:::::", selectedCoin.balance);
    if (toAddress.trim().length == 0)
      return this.setState({
        showAlertDialog: true,
        alertTxt: alertMessages.pleaseEnterWalletAddress,
      });
    else if (!validateTRXAddress(toAddress))
      return this.setState({
        showAlertDialog: true,
        alertTxt: alertMessages.pleaseEnterValidAddress,
      });
    else if (
      toAddress.toLowerCase() ==
      Singleton.getInstance().defaultTrxAddress.toLowerCase()
    )
      return this.setState({
        showAlertDialog: true,
        alertTxt: alertMessages.youCannotSendToSameAddress,
      });
    else if (amount.trim().length == 0 || amount == 0)
      return this.setState({
        showAlertDialog: true,
        alertTxt: alertMessages.pleaseEnterAmount,
      });
    else if (isNaN(parseFloat(amount)))
      return this.setState({
        showAlertDialog: true,
        alertTxt: alertMessages.pleaseEnterValidAmount,
      });
    else if (!/^\d*\.?\d*$/.test(amount)) {
      return this.setState({
        showAlertDialog: true,
        alertTxt: alertMessages.youCanEnterOnlyOneDecimal,
      });
    } else if (parseFloat(amount) > parseFloat(toFixedExp(selectedCoin.balance, 8))) {
      return this.setState({
        showAlertDialog: true,
        alertTxt: alertMessages.youhaveInsufficientBalance,
      });
    } else if (
      selectedCoin.is_token == 0 &&
      parseFloat(totalFee) > parseFloat(toFixedExp(coinBal, 8))
    ) {
      return this.setState({
        showAlertDialog: true,
        alertTxt: alertMessages.youhaveInsufficientTrxBalance,
      });
    } else if (selectedCoin.is_token == 1 && bigNumberFormat(totalFee).isGreaterThan(this.state.coinBal)) {

      consoleLogFunc('youhaveInsufficientTrxBalance tron------', totalFee, this.state.coinBal)
      return this.setState({
        showAlertDialog: true,
        alertTxt: alertMessages.youhaveInsufficientTrxBalance,
      });

    }

    else {
      if (this.props.from == "Card" && this.props.fee == "") {
        if (
          parseFloat(this.props.minRechargeAmount) >
          parseFloat(this.state.amount)
        ) {
          return this.setState({
            showAlertDialog: true,
            alertTxt:
              sendTrx.rechargeAmountshouldgreaterthanequal +
              " " +
              `${toFixedExp(this.props.minRechargeAmount, 6)} USDT`,
          });
        }
      }
      // if (showFee == true) {
      consoleLogFunc('jasvdhasvdhasd -----')
      const newObj = {
        valueInUSD: this.state.valueInUSD,
        amount: this.state.amount,
        totalFee: this.state.totalFee,
        nativePrice: this.state.nativePrice,
        toAddress: this.state.toAddress,
        fromAddress: Singleton.getInstance().defaultTrxAddress,
        feeSymbol: "TRX",
        fiatAmount: toFixedExp(
          parseFloat(this.state.amount) *
          parseFloat(this.state.selectedCoin.currentPriceInMarket),
          2
        ),
        fiatCoin: toFixedExp(
          parseFloat(this.state.totalFee) *
          parseFloat(this.state.nativePrice),
          2
        ),
      };
      this.setState({ showConfirmModal: true, newObj: newObj });
      return;
      // } else {
      // this.state.selectedCoin.is_token == 0
      //   ? this.SendTron()
      //   : this.SendTRC20();

      // this.setState({ PinModal: true });
      // this.setState({ showConfirmModal: false });
      // setTimeout(() => {
      //   if (this.state.bioMetricMode) this.checkBiometricAvailabilty();
      // }, 2000);

      // }
    }
  }


  //******************************************************************************************/
  SendTron(pin) {
    this.setState({ isLoading: true });
    consoleLogFunc(
      "sendMakerTransData SendTron SendTron ------",
      this.isMakerWallet
    );
    const { toAddress, amount } = this.state;

    setTimeout(async () => {
      const { toAddress, amount } = this.state;
      let privateKey = await getEncryptedData(`${Singleton.getInstance().defaultTrxAddress}_pk`, pin);

      consoleLogFunc("privateKey", privateKey);
      createTrxRaw(
        Singleton.getInstance().defaultTrxAddress,
        toAddress,
        exponentialToDecimal(amount),
        privateKey
      )
        .then((trxSignedRaw) => {
          this.sendSerializedTxn(trxSignedRaw);
          privateKey = ""
          consoleLogFunc('SendTron-------');
        })
        .catch((err) => {
          consoleLogFunc("chk signed raw err::::::::::::", err);
          this.setState({ isLoading: false });
          privateKey = ""
        });


    }, 200);

  }
  onPressItem(item, index) {
    this.setState({ selected_Index: index });
    setTimeout(() => {
      this.setState({ showContactlModal: false });
      this.getAddress(item?.wallet_address);
      // Actions.currentScene == 'ContactsBook' && Actions.pop();
    }, 800);
  }
  //******************************************************************************************/
  SendTRC20(pin) {
    this.setState({ isLoading: true });
    consoleLogFunc(
      "sendMakerTransData SendTron SendTRC20 ------",
      this.isMakerWallet
    );
    const { toAddress, amount, feeLimit } = this.state;

    setTimeout(async () => {
      const { toAddress, amount, feeLimit } = this.state;
      const { decimals, token_address } = this.state.selectedCoin;
      const privateKey = await getEncryptedData(`${Singleton.getInstance().defaultTrxAddress}_pk`, pin);

      createTrxTokenRaw(
        Singleton.getInstance().defaultTrxAddress,
        toAddress,
        exponentialToDecimal(amount * decimals),
        token_address,
        privateKey,
        feeLimit
      )
        .then((tokenRaw) => {
          this.sendSerializedTxn(tokenRaw);
          privateKey = ""
        })
        .catch((err) => {
          consoleLogFunc("chk signed raw err::::::::::::", err);
          this.setState({ isLoading: false });
          privateKey = ""
        });

    }, 200);

  }

  //******************************************************************************************/
  showActualAmount(enteredAmount) {
    consoleLogFunc("enteredAmount::::::::::", enteredAmount, isNaN(enteredAmount));
    let amt;
    if (this.props.from == "Card") {
      amt = exponentialToDecimal(
        enteredAmount * this.state.selectedCoin.fiat_price_data?.value
      );
    } else if (this.props.from == "referral") {
      amt = exponentialToDecimal(
        enteredAmount * this.state.selectedCoin.card_fiat_price_data?.value
      );
    } else {
      amt = exponentialToDecimal(
        enteredAmount * this.state.selectedCoin.currentPriceInMarket
      );
    }
    consoleLogFunc("amount::::", amt, isNaN(amt));
    this.setState({
      valueInUSD: isNaN(enteredAmount)
        ? 0
        : amt < 0.000001
          ? toFixedExp(amt, 8)
          : amt < 0.01
            ? toFixedExp(amt, 4)
            : toFixedExp(amt, 2),
    });
  }

  //******************************************************************************************/
  setToAmountMax() {
    const { alertMessages } = LanguageManager;

    if (this.state.selectedCoin.balance == 0)
      return this.setState({
        showAlertDialog: true,
        alertTxt: alertMessages.Youdonthaveenoughbalance,
      });
    let val;
    if (this.state.selectedCoin.is_token == 0) {
      val = (
        this.state.selectedCoin.balance -
        this.state.totalFee -
        2.01
      ).toFixed(8);
      if (val.toString().includes("-")) {
        return this.setState({
          showAlertDialog: true,
          alertTxt: alertMessages.YoudonthaveEnoughbalanceAmountTransactionFee,
        });
      }
      this.setState({ amount: (val * 1).toFixed(6).toString() }, () => {
        this.getPreCalculateTransactionFees()
      });
      consoleLogFunc("val", val);
      this.showActualAmount(val);
    } else {
      val = toFixedExp(this.state.selectedCoin.balance, 8);
      if (val.toString().includes("-")) {
        return this.setState({
          showAlertDialog: true,
          alertTxt: alertMessages.YoudonthaveEnoughbalanceAmountTransactionFee,
        });
      }
      const decim =
        this.state.selectedCoin.decimals.toString().length - 1 > 18
          ? 8
          : this.state.selectedCoin.decimals.toString().length - 1;

      this.setState({ amount: toFixedExp(val * 1, decim).toString() }, () => {
        this.getPreCalculateTransactionFees()
      });
      this.showActualAmount(val);
    }
  }

  //******************************************************************************************/
  onPinSuccess(pin) {
    this.setState({ PinModal: false, isLoading: true });
    setTimeout(() => {
      // if (this.state.showFee) {
      //   this.sendSerializedTxn(this.state.txnRaw);
      // } else {
      this.state.selectedCoin.is_token == 0
        ? this.SendTron(pin)
        : this.SendTRC20(pin);
      // }
    }, 1000);
  }

  //******************************************************************************************/
  getAddress = (address) => {
    this.setState({ toAddress: address }, () => {
      this.getPreCalculateTransactionFees()
    });
  };

  //******************************************************************************************/
  onPressAddressBook() {
    this.setState({ showAddressBookModal: true })
  }

  //******************************************************************************************/
  onChangeAmount(val) {
    consoleLogFunc("val::::");
    if (val.includes(",")) val = val.replace(",", ".");
    if (val == ".") val = "0.";
    const decim =
      this.state.selectedCoin.decimals.toString().length - 1 > 18
        ? 8
        : this.state.selectedCoin.decimals.toString().length - 1;
    const expression = new RegExp("^\\d*\\.?\\d{0," + decim + "}$");
    if (expression.test(val)) {
      if (/^\d*\.?\d*$/.test(val)) {
        if (val.includes(".") && val.split(".")[1].length > 18) {
          return;
        }
        this.setState({ amount: val, maxclicked: false }, () => {
          this.getPreCalculateTransactionFees()
        });
        this.showActualAmount(val);
      }
    }
    this.setState({ showFee: false, totalFee: 0 });
  }

  //******************************************************************************************/
  onPressConfirm() {
    this.setState({ showConfirmModal: false }, () => {
      setTimeout(() => {
        this.setState({ PinModal: true }, () => {
          if (this.state.bioMetricMode) this.checkBiometricAvailabilty();
        });
      }, 500);
    });
  }

  //******************************************************************************************/
  onMaxClicked() {
    this.setState({ maxclicked: true });
    setTimeout(() => {
      this.setToAmountMax();
    }, 300);
  }

  //******************************************************************************************/
  getValue = (bal) => {
    if (bal > 0) {
      const NewBal =
        bal < 0.000001
          ? toFixedExp(bal, 8)
          : bal < 0.0001
            ? toFixedExp(bal, 6)
            : toFixedExp(bal, 4);
      return NewBal;
    } else return "0.0000";
  };

  onPressPaste = () => {
    Clipboard.getString().then((address) => {
      this.setState({
        toAddress: address,
      }, () => {
        this.getPreCalculateTransactionFees()
      })
    })
  }
  //******************************************************************************************/
  render() {
    // consoleLogFunc("this.props.from:::::", this.props.from);
    const { walletMain, placeholderAndLabels, sendTrx } = LanguageManager;
    const { modalVisible } = this.state;

    consoleLogFunc('sendTron this.isMakerWallet ------', this.isMakerWallet)
    if (this.state.isVisible)
      return (
        <View
          style={{
            flex: 1,
            backgroundColor: ThemeManager.colors.Mainbg,
          }}
        >
          <Modal
            animationType={"slide"}
            transparent={true}
            visible={this.state.isVisible}
            onRequestClose={() => {
              consoleLogFunc("Modal has been closed.");
            }}
          >
            <View style={[styles.modalView, { flex: 1 }]}>
              <View
                style={{ backgroundColor: ThemeManager.colors.mainBgNew, flex: 1, marginTop: -5 }}
              >


                <QRCodeScannerNew
                  cameraStyle={styles.cameraStyle}
                  onRead={(event) => {
                    const address = event.data;
                    let newAddress = ''
                    if (address.includes(':')) {
                      let address1 = address.split(':')
                      newAddress = address1[1];
                      if (newAddress.includes('?')) {
                        let address1 = newAddress.split('?')
                        newAddress = address1[0];
                      }
                    }
                    else {
                      newAddress = address;

                    }
                    this.setState({ isVisible: false, toAddress: newAddress }, () => {
                      setTimeout(() => {
                        this.getPreCalculateTransactionFees()
                      }, 1000);

                    });
                  }}
                />

                <TouchableOpacity
                  onPress={() => {
                    this.setState({ isVisible: false });
                  }}
                >
                  <Text allowFontScaling={false} style={[styles.txtCancel, { color: ThemeManager.colors.blackWhiteText, marginRight: Platform.OS == 'ios' ? getDimensionPercentage(30) : getDimensionPercentage(15) }]}>
                    {sendTrx.Cancel}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </Modal>
        </View>
      );
    return (
      <KeyBoardAwareComp>
        <ImageBackground
          source={ThemeManager.ImageIcons.mainBgImgNew}
          style={{ flex: 1, backgroundColor: ThemeManager.colors.mainBgNew }}
        >
          <View style={{ flex: 1 }}>
            <HeaderMain
              BackButtonText={
                walletMain.send +
                " " +
                this.state.selectedCoin.coin_symbol?.toUpperCase()
              }
            />
            <KeyboardAwareScrollView keyboardShouldPersistTaps={"always"}>
              <View style={{ flex: 1 }}>
                <View style={styles.mainView}>
                  <View
                    style={{
                      flexDirection: "row",
                      justifyContent: "space-between",
                    }}
                  >
                    <Text
                      allowFontScaling={false}
                      style={[
                        styles.txtWallet,
                        { color: ThemeManager.colors.blackWhiteText },
                      ]}
                    >
                      {sendTrx.walletAddress}
                    </Text>
                  </View>
                  <View style={{}}>
                    <View
                      style={[
                        styles.ViewStyle,
                        { borderColor: ThemeManager.colors.inputBorder, backgroundColor: "transparent", },
                      ]}
                    >
                      <InputCustomWithPasteButton
                        value={this.state.toAddress}
                        onChangeText={(val) => {
                          this.setState({ toAddress: val }, () => {
                            this.getPreCalculateTransactionFees()
                          });
                        }}
                        placeHolder={'Wallet Address'}
                        placeholderTextColor={ThemeManager.colors.inputBorder}
                        customInputStyle={[
                          styles.ViewStyle1,
                          {
                            backgroundColor: "transparent",
                            color: ThemeManager.colors.blackWhiteText,

                          },
                        ]}
                        editable={true}
                      />
                      <TouchableOpacity
                        style={{ position: "absolute", right: 80, top: 17, alignSelf: "center" }}
                        onPress={() => this.onPressPaste()}>
                        <Text style={[styles.txtWallet, { color: ThemeManager.colors.blackWhiteText, fontFamily: Fonts.dmBold }]}>
                          {sendTrx.paste}
                        </Text>
                      </TouchableOpacity>

                      {this.props.from == "Card" ||
                        this.props.from == "referral" ? null : (
                        <TouchableOpacity
                          disabled={this.state.isButtonDisabled || Singleton.getInstance().isMakerWallet}
                          onPress={() => {
                            this.setState({ isButtonDisabled: true })
                            this.onPressAddressBook()
                            setTimeout(() => {
                              this.setState({ isButtonDisabled: false });
                            }, 2000);

                          }

                          }
                          // onPress={() => this.onPressAddressBook()}
                          style={{ position: "absolute", right: 50, top: 17, alignSelf: "center" }}
                        >
                          <Image source={ThemeManager.ImageIcons.addressBook} style={{ tintColor: ThemeManager.colors.blackWhiteText }} />
                        </TouchableOpacity>
                      )}
                      {this.props.from == "Card" ||
                        this.props.from == "referral" ? null : (
                        <TouchableOpacity
                          disabled={this.state.isButtonDisabled}
                          onPress={() => {
                            this.setState({ isButtonDisabled: true })
                            this.requestCameraPermission()
                            setTimeout(() => {
                              this.setState({ isButtonDisabled: false });
                            }, 2000);
                          }
                          }
                          // onPress={() => this.requestCameraPermission()}
                          style={styles.scan}
                        >
                          <Image

                            source={ThemeManager.ImageIcons.scan} style={{ tintColor: ThemeManager.colors.blackWhiteText }} />
                        </TouchableOpacity>
                      )}
                    </View>
                    {/* ------------------------------------------------------------------- */}
                    <Text
                      allowFontScaling={false}
                      style={[
                        styles.txtWallet,
                        {
                          height: 40,
                          marginTop: 25,
                          color: ThemeManager.colors.blackWhiteText,
                        },
                      ]}
                    >
                      {sendTrx.enterAmount}
                    </Text>
                    <View
                      style={[
                        styles.ViewStyle2,
                        { borderColor: ThemeManager.colors.inputBorder, backgroundColor: "transparent" },
                      ]}
                    >
                      <InputCustom
                        value={this.state.amount}
                        onChangeText={(val) => {
                          this.onChangeAmount(val);
                        }}
                        placeHolder={sendTrx.enterAmount}


                        keyboardType="decimal-pad"
                        maxLength={15}
                        customInputStyle={[
                          styles.ViewStyle4,
                          { color: ThemeManager.colors.blackWhiteText, backgroundColor: "transparent" },
                        ]}
                        placeholderTextColor={ThemeManager.colors.inputBorder}
                        editable={
                          this.props.from == "Card" || this.props.from == "referral"
                            ? this.props.fee != ""
                              ? false
                              : true
                            : true
                        }
                      />
                      <View style={styles.ViewStyle3}>
                        {/* {this.state.selectedCoin.coin_image ? (
                      <View style={[styles.ImgStyle, { backgroundColor: ThemeManager.colors.borderUnderLine }]}>
                        <Image style={styles.ImgStyle} source={{ uri: this.state.selectedCoin.coin_image }} />
                      </View>
                    ) : (
                      <View style={[styles.ImgStyle, { backgroundColor: ThemeManager.colors.borderUnderLine }]}>
                        <Text allowFontScaling={false} style={[styles.coinSymbolStyle, { color: ThemeManager.colors.Text, textTransform: 'capitalize', paddingLeft: 0, }]}>{this.state.selectedCoin.coin_symbol?.substring(0, 1)}</Text>
                      </View>
                    )} */}
                        {/* <Text
                      allowFontScaling={false}
                      style={[
                        styles.coinSymbolStyle,
                        { color: ThemeManager.colors.subTextColor },
                      ]}
                    >
                      {this.state.selectedCoin.coin_symbol.toUpperCase()}
                    </Text> */}
                      </View>
                      {this.props.from == "Card" ||
                        this.props.from == "referral" ? null : (
                        <TouchableOpacity
                          onPress={() => {
                            this.onMaxClicked();
                          }}
                          style={styles.maxStyle}
                        >
                          <Text
                            allowFontScaling={false}
                            style={[
                              styles.maxText,
                              { color: ThemeManager.colors.blackWhiteText },
                            ]}
                          >
                            {sendTrx.max}
                          </Text>
                        </TouchableOpacity>
                      )}
                    </View>

                    <View style={styles.ViewStyle5}>

                      <Text
                        allowFontScaling={false}
                        style={[
                          styles.fiatStyle,
                          { color: ThemeManager.colors.blackWhiteText },
                        ]}
                      >
                        ≈ {this.props.from == "Card" || this.props.from == "referral"
                          ? this.props.currency
                          : Singleton.getInstance().CurrencySymbol}
                        {this.state.valueInUSD}
                      </Text>

                      <Text
                        allowFontScaling={false}
                        style={[
                          styles.TextStyle,
                          { color: ThemeManager.colors.grayTextColor },
                        ]}
                      >
                        {sendTrx.Balance}{" "}
                        <Text
                          style={[
                            styles.TextStyle,
                            { color: ThemeManager.colors.blackWhiteText },
                          ]}
                        >
                          {this.getValue(this.state.selectedCoin?.balance)}{" "}
                          {this.state.selectedCoin.coin_symbol.toUpperCase()}
                        </Text>

                      </Text>
                    </View>

                    {/* ------------------------------------------------------------------- */}

                    <View style={[styles.coinInfo,]}>
                      <View style={styles.ViewStyle6}>
                        <Text
                          allowFontScaling={false}
                          style={[
                            styles.TextStyle1,
                            { color: ThemeManager.colors.blackWhiteText },
                          ]}
                        >
                          {sendTrx.transactionFee} {"(TRX)"}
                        </Text>
                        <InputCustom
                          editable={false}
                          value={this.state.totalFee?.toString()}
                          placeHolder="0.00"
                          placeholderColor={Colors.placeholderColor}
                          keyboardType="decimal-pad"
                          customInputStyle={[
                            styles.ViewStyle7,
                            { color: ThemeManager.colors.settingsText, backgroundColor: "transparent" },
                          ]}

                          placeholderTextColor={
                            ThemeManager.colors.inputBorder
                          }
                        />
                      </View>
                    </View>

                    {/* ------------------------------------------------------------------- */}
                  </View>
                </View>
              </View>
            </KeyboardAwareScrollView>
            <View style={styles.ViewStyle8}>
              {/* {this.state.disabled ? (
              <View
                style={[
                  styles.sendBtnStyle,
                  { backgroundColor: ThemeManager.colors.settingBg },
                ]}
              >
                <Text
                  allowFontScaling={false}
                  style={[styles.sendBtnTextStyle, { color: "gray" }]}
                >
                  {sendTrx.SEND}
                </Text>
              </View>
            ) : ( */}
              <Button
                onPress={() => {
                  this.sendTransaction();
                }}
                myStyle={{ marginBottom: heightDimen(50) }}
                buttontext={sendTrx.SEND}
              />
              {/* )} */}
            </View>

            {/* --------------------------------ConfirmTxnModal----------------------------------- */}
            <ConfirmTxnModal
              handleBack={() => this.setState({ showConfirmModal: false })}
              showConfirmTxnModal={this.state.showConfirmModal}
              newObj={this.state.newObj}
              selectedCoin={this.state.selectedCoin}
              onPress={() => this.onPressConfirm()}
              from={this.props.from}
              currency={this.props.currency}
            />

            {this.state.showAddressBookModal && <ContactsBook
              handleBack={() => this.setState({ showAddressBookModal: false })}
              showAddressBookModal={this.state.showAddressBookModal}
              newObj={this.state.newObj}
              getAddress={this.getAddress}
              address={Singleton.getInstance().defaultEthAddress}
              coin_family={6}
              selectedCoin={this.state.selectedCoin}
              onPress={() => this.onPressConfirm()}
              onPressView={(item) => {
                this.setState({ showAddressBookModal: false, showContactlModal: true, selectedItem: item });
                consoleLogFunc('here==', item);
              }}
              addbook={() => {
                this.setState({ showAddressBookModal: false })
                Actions.currentScene != 'AddContact' && Actions.AddContact({ themeSelected: this.props.themeSelected, });
              }}
              navigation={this.props.navigation}
            />}
            
            {this.state.showContactlModal && <AddressModal
              selected_Index={this.state.selected_Index}
              onPressItem={(item, index) => this.onPressItem(item, index)}
              dismiss={() => this.setState({ showContactlModal: false })}
              item={this.state.selectedItem}
              openModel={this.state.showContactlModal}
            />}


            {/* --------------------------------Modal for Pin----------------------------------- */}
            <Modal
              statusBarTranslucent
              animationType="slide"
              transparent={true}
              visible={this.state.PinModal}
              onRequestClose={() => {
                this.setState({ PinModal: false });
              }}
            >
              <View style={{ flex: 1 }}>
                <EnterPinForTransaction
                  onBackClick={() => {
                    this.setState({ PinModal: false });
                  }}
                  closeEnterPin={(pin) => {
                    this.onPinSuccess(pin);
                  }}
                />
              </View>
            </Modal>

            {this.state.showAlertDialog && (
              <AppAlert
                alertTxt={this.state.alertTxt}
                hideAlertDialog={() => {
                  this.setState({ showAlertDialog: false });
                  if (this.state.isReqSent) {
                    Actions.TransactionHistory({
                      type: ActionConst.RESET,
                      selectedCoin: this.state.selectedCoin,
                    });
                  }
                }}
              />
            )}
            <LoaderView isLoading={this.state.isLoading} />
          </View>
        </ImageBackground>
      </KeyBoardAwareComp>
    );
  }
}

export default connect(null, {
  requestSendCoin,
  requestCoinBalance,
  addAddress,
  fetchNativePrice,
  requestGasEstimation,
  getFeeLimit,
  fetchNative_CoinPrice,
})(SendTrx);
