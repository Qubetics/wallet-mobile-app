import { parseUnits } from "ethers/lib/utils";
import React, { memo, useEffect, useRef, useState } from "react";
import {
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View
} from "react-native";
import { EventRegister } from "react-native-event-listeners";
import { Actions } from "react-native-router-flux";
import { useDispatch } from "react-redux";
import { LanguageManager } from "../../../../LanguageManager";
import { ThemeManager } from "../../../../ThemeManager";
import * as Constants from "../../../Constants";
import {
  getChainAbstractionCoinList,
  requestGasEstimation,
  saveMpcWallets,
  getMpcWalletBalance,
  fetchNativePrice,
  saveChainAbstractionTrxId
} from "../../../Redux/Actions";
import Singleton from "../../../Singleton";
import { Fonts, Images } from "../../../theme";
import { dimen, getSepoliaGasPrice, heightDimen, widthDimen } from "../../../Utils";
import {
  bigNumberSafeMath,
  consoleLogFunc,
  exponentialToDecimal,
  getData,
  getEncryptedData,
  saveData,
  toFixedExp
} from "../../../Utils/MethodsUtils";
import {
  getTicsProvider,
} from "../../../Utils/TicsUtils";
import { AppAlert, Button, HeaderMain, LoaderView } from "../../common";
import ChainSelectorModal from "../../common/ChainSelectorModal";
import ConfirmAbstraction from "../../common/ConfirmAbstraction";
import ProcessingTransaction from "../../common/ProcessingTransaction";
import { SelectCurrencyAbstract } from "../../common/SelectCurrencyAbstract";
import EnterPinForTransaction from "../EnterPinForTransaction/EnterPinForTransaction";
import MpcAlertModel from "../../common/MpcAlertModel";
import CongratulationModal from "../../common/CongratulationModal";
import { validateBTCAddress } from "../../../Utils/BtcUtils";
import { validateEthAddress } from "../../../Utils/EthUtils";
import { ethers } from "ethers";
import {
  createMpcSwapOrder,
  getOrRegisterUser,
  validateApiResponse,
  extractDerivedAddresses
} from "../../../Utils/chainAbstractionUtils";
import { CHAIN_ABSTRACTION_PRICE_URL } from "../../../EndPoint";
const ABI = require("../../../chainAbstractionAbi.json");

const ChainAbstractionSwap = ({ themeSelected, navigation, isVisible }) => {
  const { detailTrx, alertMessages, swapText, browser } = LanguageManager;
  const dispatch = useDispatch();
  const scrollRef = useRef(null);
  const MIN_MAX_SWAP_AMOUNT = {
    7: {
      min: 25,
      max: 50,
    },
    3: {
      min: 0.000008,
      max: 0.1,
    }
  }
  const [isLoading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedFrom, setSelectedFrom] = useState("");
  const [selectedTo, setSelectedTo] = useState("");
  const [isSelectingFrom, setIsSelectingFrom] = useState(true);
  const [toAddress, setToAddress] = useState("");
  const [fromValue, setFromValue] = useState("");
  const [fromValueUSD, setFromValueUSD] = useState("0.00");
  const [toValue, setToValue] = useState("");
  const [confirmAbstractionVisible, setConfirmAbstractionVisible] = useState(false);
  const [coinList, setCoinList] = useState([]);
  const [totalFee, setTotalFee] = useState(0);

  const [depositTotalFee, setDepositTotalFee] = useState({
    tics: 0,
    btc: 0,
  });

  const [AlertDialogNew, showAlertDialogNew] = useState(false);
  const [alertTxt, setAlertTxt] = useState("");
  const [showPinModal, setShowPinModal] = useState(false);
  const [intentTxHash, setIntentTxHash] = useState("");
  const [sendDisabled, setSendDisabled] = useState(true);
  const [buttonText, setButtonText] = useState("Enter Amount");
  const [processingTransaction, setProcessingTransaction] = useState(false);
  const [nativeBtcValue, setNativeBtcValue] = useState(0);
  const [nativeTicsValue, setNativeTicsValue] = useState(0);

  const [selectIndex, setSelectIndex] = useState(null);
  const [selectIndexOne, setSelectIndexOne] = useState(null);
  const [isMpcAddress, setIsMpcAddress] = useState(false);
  const [showCongratulationModal, setShowCongratulationModal] = useState(false);
  const [isFaitOnFrom, setIsFaitOnFrom] = useState(false);

  const [fiatValueForCoin, setFiatValueForCoin] = useState({});
  const oldStateRef = useRef(false);
  const debounceTimeout = useRef(null);

  /******************************************************************************************/

  useEffect(() => {
    getFiatValueForCoin()
    focus(true);
    EventRegister.addEventListener("getThemeChanged", (data) => { });
    const focusListener = navigation.addListener("didFocus", () => {
      focus(false);
    });
    const blurListener = navigation.addListener("didBlur", () => {
      // setFromValue("");
      // setToValue("");
      // setToAddress('')
      // setButtonText("Enter Amount");
      // setSendDisabled(true);
      // setSelectIndex(null);
      // setSelectIndexOne(null);
    });

    EventRegister.addEventListener(Constants.DOWN_MODAL, () => {
      setModalVisible(false);
      setProcessingTransaction(false);
      setIsMpcAddress(false);
      setConfirmAbstractionVisible(false)
      setShowCongratulationModal(false);
      showAlertDialogNew(false);
    });
    return () => {
      focusListener?.remove();
      blurListener?.remove();
    };
  }, []);

  useEffect(() => {
    updateSendButtonState();
  }, [fromValue, toValue, toAddress]);

  const getFiatValueForCoin = async () => {
    const response = await fetch(CHAIN_ABSTRACTION_PRICE_URL)
    const data = await response.json()
    consoleLogFunc("getFiatValueForCoin>>>>", data?.data);
    setFiatValueForCoin(data?.data)
  }


  /******************************************************************************************/
  const updateSendButtonState = () => {
    if (fromValue?.length === 0 || fromValue === 0 || fromValue === "") {
      setButtonText("Enter Amount");
      setSendDisabled(true);
    } else if (toValue?.length === 0 || toValue === 0 || toValue === "") {
      setButtonText("Enter Amount");
      setSendDisabled(true);
    } else if (toAddress?.length === 0 || toAddress === "") {
      setButtonText("Enter Recipient Address");
      setSendDisabled(true);
    } else if (
      !/^(0x){1}[0-9a-fA-F]{40}$/i.test(toAddress) &&
      selectedTo?.coin_family != 3
    ) {
      setButtonText(alertMessages.pleaseEnterValidAddress);
      setSendDisabled(true);
    } else {
      setButtonText("Abstract");
      setSendDisabled(false);
    }
  };

  const focus = (isFirstTime) => {
    if (oldStateRef.current) {
      setShowCongratulationModal(true);

    }
    platFormFee();
    getMpcAddress(isFirstTime);
  };


  /******************************************************************************************/
  const getCoinList = (isFirstTime) => {
    let data = {
      coinFamilies: [3, 7],
      addrsList: [
        Singleton.getInstance().defaultMpcBtcAddress,
        Singleton.getInstance().defaultMpcEthAddress
      ],
    };
    setLoading(true);
    dispatch(getChainAbstractionCoinList(data))
      .then(async (res) => {
        consoleLogFunc("getChainAbstractionCoinList>>>>res", res);
        let balanceList = [];
        try {
          balanceList = await dispatch(getMpcWalletBalance({
            "wallet_address": Singleton.getInstance().defaultTicsAddress,
            "coin_family": 1
          }));
        } catch (error) {
          balanceList = [];
          consoleLogFunc("getChainAbstractionCoinList>>>>error", error);
        }
        consoleLogFunc("getChainAbstractionCoinList>>>>balanceList", balanceList);
        const balanceObj = balanceList?.reduce((acc, item) => { acc[item.coin_family] = item.balance; return acc; }, {});  // BALANCE IS NOT RETURNING FROM COIN LIST API
        let coinList = res?.data?.map((item) => {
          return { ...item, balance: balanceObj[item.coin_family] }
        });
        consoleLogFunc("getChainAbstractionCoinList>>>>res",isFirstTime, coinList);

        const fromIndex = coinList?.findIndex((item) => item.coin_symbol === coinList[0]?.coin_symbol);
        const toIndex = coinList?.findIndex((item) => item.coin_symbol === coinList[1]?.coin_symbol);

        const toToken = coinList[1]

        setCoinList(coinList);
        if (isFirstTime) {
          setSelectedFrom(coinList[0]);
          setSelectedTo(toToken);
          setToAddress(toToken?.coin_family == 3 ? Singleton.getInstance().defaultMpcBtcAddress : Singleton.getInstance().defaultMpcEthAddress);

          setSelectIndex(fromIndex);
          setSelectIndexOne(toIndex);
        }

        setTimeout(() => {
          setLoading(false);
        }, 1000);

      })
      .catch((e) => {
        consoleLogFunc("getChainAbstractionCoinList>>>>error", e);
        setLoading(false);
      });
  };

  /******************************************************************************************/
  const platFormFee = () => {
    let gasEstimationReq = {
      from: Singleton.getInstance().defaultTicsAddress,
      to: Singleton.getInstance().defaultTicsAddress,
      amount: "",
    };
    setLoading(true);
    getData(Constants.ACCESS_TOKEN).then((token) => {
      console.log("token>>", token);

      dispatch(
        requestGasEstimation({
          url: "qubetics/tics/gas_estimation",
          coinSymbol: "tics",
          gasEstimationReq,
          token,
        })
      )
        .then((res) => {
          consoleLogFunc("feeIs>>>>", res);

          let gasEstimate = 23000;
          const mediumGasPrice = res?.gas_price
          const feeIs = toFixedExp((mediumGasPrice * gasEstimate / 10 ** 9), 8);
          consoleLogFunc("feeIs>>>>", feeIs);
          setDepositTotalFee({
            tics: feeIs,
            btc: "0.000001",
          });
          setLoading(false);
        })
        .catch((e) => {
          console.log("getFee>>>>error", e);
        });
    });
  };

  /******************************************************************************************/
  const openSelector = (type) => {
    setIsSelectingFrom(type === "from");
    setModalVisible(true);
  };

  /******************************************************************************************/
  const onPressToggle = () => {
    // Swap token logic
    console.log("onPressToggle--", selectedTo, "---", selectedFrom);

    const tempSelectedFrom = selectedTo;
    const tempSelectedTo = selectedFrom;

    setSelectedFrom(tempSelectedFrom);
    setSelectedTo(tempSelectedTo);

    const tempFromValue = toValue;
    const tempToValue = fromValue;

    setFromValue(tempFromValue);
    setToValue(tempToValue);
    setToAddress(
      selectedTo?.coin_family == 7 && selectedFrom?.coin_family == 3
        ? Singleton.getInstance().defaultMpcBtcAddress
        : Singleton.getInstance().defaultMpcEthAddress
    );
  };
  /******************************************************************************************/

  const onPressMax = () => {
    console.log("onPressMax>>>>", selectedFrom);
    let tempTotalFee = "0.001";
    if (selectedFrom?.coin_family == 3) {
      tempTotalFee = "0.000001"; //BTC
    }
    const balance = selectedFrom?.balance || 0;
    let maxValue = Number(balance) - Number(tempTotalFee);
    if (isFaitOnFrom) {
      maxValue = bigNumberSafeMath(maxValue, "*", selectedFrom?.fiat_price_data?.value);
    }
    console.log("maxValue>>>>", maxValue);
    onChangeFromValue(toFixedExp(maxValue, isFaitOnFrom ? 2 : 8));
  };
  /******************************************************************************************/

  const onChangeFromValue = (val) => {
    const expression = new RegExp("^\\d*\\.?\\d{0," + (isFaitOnFrom ? 2 : 8) + "}$");
    if (expression.test(val)) {
      isFaitOnFrom ? setFromValueUSD(toFixedExp(val, 2)) : setFromValue(val);
      if (isFaitOnFrom) {
        val = bigNumberSafeMath(val, "/", selectedFrom?.fiat_price_data?.value);
        setFromValue(toFixedExp(val, 8));
      } else {
        const fiatValue = bigNumberSafeMath(val, "*", selectedFrom?.fiat_price_data?.value);
        setFromValueUSD(toFixedExp(isNaN(fiatValue) ? "0.00" : fiatValue, 2));
      }

      if (debounceTimeout.current) {
        clearTimeout(debounceTimeout.current);
      }
      debounceTimeout.current = setTimeout(() => {
        const fromFiatValue = selectedFrom?.coin_family == 3 ? fiatValueForCoin?.BTC : fiatValueForCoin?.TICS;
        console.log("fromFiatValue>>>", fromFiatValue);

        console.log("selectedTo>>>", selectedTo);
        const toFiatValue = selectedTo?.coin_family == 3 ? fiatValueForCoin?.BTC : fiatValueForCoin?.TICS;
        console.log("toFiatValue>>>", toFiatValue);

        const toValue = bigNumberSafeMath(
          bigNumberSafeMath(val, "*", (fromFiatValue || selectedFrom?.fiat_price_data?.value)),
          "/",
          (toFiatValue || selectedTo?.fiat_price_data?.value)
        );
        let decimal = selectedTo?.decimals?.toString()?.length - 1
        decimal = decimal > 8 ? 8 : decimal
        const toAmt = exponentialToDecimal(toValue, decimal > 8 ? 8 : decimal);
        console.log(">>>", decimal);

        const valueAfterSlippage = exponentialToDecimal(
          bigNumberSafeMath(toAmt, "*", 0.995),
          6
        );
        // const valueAfterSlippage = bigNumberSafeMath(toValue, "*", 0.995);
        console.log("valueAfterSlippage>>>", valueAfterSlippage);

        setToValue(toFixedExp(valueAfterSlippage, decimal));
      }, 800);
    }
  };
  /******************************************************************************************/
  const onSwapClicked = () => {
    if (fromValue?.length == 0 || fromValue == 0) {
      showAlertDialogNew(true);
      setAlertTxt(alertMessages.pleaseEnterAmount);
      return;
    }
    if (toValue?.length == 0 || toValue == 0) {
      showAlertDialogNew(true);
      setAlertTxt(alertMessages.cannotProceed);
      return;
    }
    console.log("fromValue>>", selectedFrom?.balance, fromValue, Number(selectedFrom?.balance) < Number(fromValue));
    if (Number(selectedFrom?.balance) < Number(fromValue)) {
      showAlertDialogNew(true);
      setAlertTxt(alertMessages.insufficientBalance);
      return;
    }
    const validToAddress = selectedTo?.coin_family == 3 ? validateBTCAddress(toAddress, 0) : validateEthAddress(toAddress)
    if (!validToAddress) {
      showAlertDialogNew(true);
      setAlertTxt(`Please enter valid ${selectedTo?.coin_symbol?.toUpperCase()} address`);
      return;
    }
    if (Number(fromValue) < MIN_MAX_SWAP_AMOUNT[selectedFrom?.coin_family]?.min) {
      showAlertDialogNew(true);
      setAlertTxt(`Minimum swap amount is ${MIN_MAX_SWAP_AMOUNT[selectedFrom?.coin_family]?.min} ${selectedFrom?.coin_symbol?.toUpperCase()}`);
      return;
    }
    if (Number(fromValue) > MIN_MAX_SWAP_AMOUNT[selectedFrom?.coin_family]?.max) {
      showAlertDialogNew(true);
      setAlertTxt(`Maximum swap amount is ${MIN_MAX_SWAP_AMOUNT[selectedFrom?.coin_family]?.max} ${selectedFrom?.coin_symbol?.toUpperCase()}`);
      return;
    }

    console.log('fromValue>>', fromValue);
    console.log('selectedFrom>>', selectedFrom);
    console.log('selectedFrom>>', depositTotalFee?.tics);
    console.log('selectedFrom>>', (Number(fromValue) + Number(selectedFrom?.coin_family == 3 ? depositTotalFee?.btc : depositTotalFee?.tics) > Number(selectedFrom?.balance)));

    if (Number(fromValue) + Number(selectedFrom?.coin_family == 3 ? depositTotalFee?.btc : depositTotalFee?.tics) > Number(selectedFrom?.balance)) {
      showAlertDialogNew(true);
      setAlertTxt(`Insufficient balance`);
      return;
    }
    let data = {
      firstCoin: selectedFrom,
      secondCoin: selectedTo,
      fromAmt: fromValue,
      toAmt: toValue,
    };
    createSwapOrder(data);
  };
  /******************************************************************************************/

  const createSwapOrder = (data) => {
    setConfirmAbstractionVisible(true);

  };
  /******************************************************************************************/

  const onSwapConfirmed = async (pin) => {
    setLoading(true);
    let privateKey = await getEncryptedData(`${Singleton.getInstance().defaultTicsAddress}_pk`, pin);
    const sourceAddress = selectedFrom?.coin_family == 3 ? Singleton.getInstance().defaultMpcBtcAddress : Singleton.getInstance().defaultMpcEthAddress
    let amount = fromValue * (selectedFrom?.decimals)
    amount = exponentialToDecimal(Number(amount).toFixed(0))
    const msg = {
      source_address: sourceAddress,
      target_address: toAddress,
      source_chain: selectedFrom?.coin_name?.toLowerCase(),
      target_chain: selectedTo?.coin_name?.toLowerCase(),
      amount: Number(amount),
      source_token: selectedFrom?.coin_symbol?.toLowerCase(),
      target_token: selectedTo?.coin_symbol?.toLowerCase(),
      timestamp: new Date().getTime(),
    };

    consoleLogFunc("msg::::::", msg);

    const payloadStr = JSON.stringify(msg);
    consoleLogFunc("payloadStr::::::", payloadStr);

    const provider = getTicsProvider();
    consoleLogFunc("provider::::::", provider);
    const wallet = new ethers.Wallet(privateKey).connect(provider);
    consoleLogFunc("wallet::::::", wallet);
    // 4) Sign (EIP-191 personal_sign)
    const signature = await wallet.signMessage(payloadStr);
    consoleLogFunc("signature::::::", signature);
    consoleLogFunc("msg::::::", msg);
    try {
      const swapData = {
        signature: signature,
        msg: msg,
      };

      setTimeout(() => {
        setLoading(false);
        setProcessingTransaction(true);
      }, 2000);

      const response = await createMpcSwapOrder(swapData);
      consoleLogFunc("createSwapOrder response:", response);

      if (validateApiResponse(response, 'createSwapOrder')) {
        consoleLogFunc("Swap order created successfully");
        // Handle successful swap order creation
        let txId = response?.user_to_network_tx_id
        // if(response?.status == 'timeout'){
        //   const parts = response?.error_message?.split("Intent hash: ");
        //   const hash = parts[1].split(".")[0];
        //   txId = "0x" + hash
        // }
        setIntentTxHash(txId);
        submitIntentHash(txId);
        // setProcessingTransaction(true);
      } else {
        consoleLogFunc("Failed to create swap order");
        // Handle swap order creation failure
        setProcessingTransaction(false);
        showAlertDialogNew(true);
        setAlertTxt(response?.message || alertMessages.failedtoInitiateTransaction);
      }
      setLoading(false);
    } catch (err) {
      setProcessingTransaction(false);
      setLoading(false);
      showAlertDialogNew(true);
      setAlertTxt(alertMessages.failedtoInitiateTransaction);
      consoleLogFunc("createSwapOrder error:", err);
      // Handle error appropriately
    }
  };

  /******************************************************************************************/

  const submitIntentHash = async (signedTx) => {
    let data = {
      amount: fromValue,
      gas_price: selectedFrom?.coin_family == 3 ? depositTotalFee?.btc : depositTotalFee?.tics,
      from: selectedFrom?.coin_family == 3 ? Singleton.getInstance().defaultBtcAddress : Singleton.getInstance().defaultTicsAddress,
      tx_hash: signedTx,
      to: toAddress,
      tx_type: "chain_abstraction",
      tx_status: "pending"
    }
    if (selectedFrom?.coin_family != 3) {
      data.gas_estimate = "30000"
    }
    consoleLogFunc("submitIntentHash:::::>>>>>data", data);
    dispatch(saveChainAbstractionTrxId(selectedFrom?.coin_symbol, data, selectedFrom?.coin_family == 3 ? "bitcoin/" : "qubetics/"))
      .then((res) => {
        consoleLogFunc("submitIntentHash:::::>>>>>res", res);

      })
      .catch((e) => {
        consoleLogFunc("submitIntentHash:::::>>>>>error", e);
      });
  };


  const getMpcAddress = async (isFirstTime) => {
    const mpcData = await getData(Constants.MPC_ADDRESS + Singleton.getInstance().defaultTicsAddress);
    console.log("mpcAddress>>", mpcData);
    if (mpcData == '' || mpcData == null || mpcData == undefined) {
      setIsMpcAddress(true);
    } else {
      const response = JSON.parse(mpcData);
      setIsMpcAddress(false);
      // setToAddress(response?.derived_eth_address);
      Singleton.getInstance().defaultMpcEthAddress = response?.derived_eth_address;
      Singleton.getInstance().defaultMpcBtcAddress = response?.derived_btc_address;
      getCoinList(isFirstTime);
    }
  }

  const mpcAddressApi = async () => {
    try {
      setIsMpcAddress(false);

      const ethereumAddress = Singleton.getInstance().defaultTicsAddress;
      const userResponse = await getOrRegisterUser(ethereumAddress);

      if (!validateApiResponse(userResponse, 'getOrRegisterUser')) {
        throw new Error('Failed to get valid user response');
      }

      // Extract derived addresses using utility method
      const derivedAddresses = extractDerivedAddresses(userResponse);
      consoleLogFunc("mpcAddressApi - Derived addresses:", derivedAddresses);

      // Update Singleton with derived addresses
      Singleton.getInstance().defaultMpcEthAddress = derivedAddresses.derived_eth_address;
      Singleton.getInstance().defaultMpcBtcAddress = derivedAddresses.derived_btc_address;
      setToAddress(derivedAddresses.derived_eth_address);

      // Save to local storage
      const mpcAddress = JSON.stringify(userResponse);
      saveData(Constants.MPC_ADDRESS + ethereumAddress, mpcAddress);

      // Save to Redux store
      const reqData = {
        "wallet_address": ethereumAddress,
        "btc_wallet_address": derivedAddresses.derived_btc_address,
        "tics_wallet_address": derivedAddresses.derived_eth_address,
      };
      dispatch(saveMpcWallets(reqData));

      // Refresh coin list
      getCoinList();

      // Show congratulation modal after successful generation
      setTimeout(() => {
        oldStateRef.current = true;
        setShowCongratulationModal(true);
      }, 500);

    } catch (err) {
      consoleLogFunc("mpcAddressApi error:", err);
      showAlertDialogNew(true);
      setAlertTxt("Failed to generate MPC address");
      // setIsMpcAddress(true); // Show error state
    }
  };


  /******************************************************************************************/

  return (
    <>
      <HeaderMain
        showBackBtn={true}
        BackButtonText={"Chain Abstraction"}
        beforeImport={true}
        imgSecondStyle={{
          width: heightDimen(30),
          height: widthDimen(30),
          tintColor: ThemeManager.colors.blackWhiteText,
          alignSelf: "center",
        }}
        imgSecondViewStyle={{
          width: heightDimen(35),
          height: widthDimen(35),
          alignSelf: "center",
        }}
        onPressIcon={() => {
          Singleton.isNotification = false;
          Actions.currentScene != "MpcWalletCoinList" &&
            Actions.MpcWalletCoinList({
              coinList: coinList,
            });
        }}
        // imgSecond={swapEnabled == "oc" ? Singleton.isNotification ? Images.notiDot : Images.noti : null}
        imgSecond={Images.activity_feed}
      />

      <View style={[styles.ViewStyle1]}>

        <ScrollView
          ref={scrollRef}
          bounces={false}
          showsVerticalScrollIndicator={false}
          style={{ flex: 1 }}
        >
          <View>
            {/* From Token Selector */}
            <SelectCurrencyAbstract
              isfrom
              isMax
              onPressCoin={() => openSelector("from")}
              item={selectedFrom}
              value={isFaitOnFrom ? fromValueUSD : fromValue}
              valueInFiat={isFaitOnFrom ? fromValue : fromValueUSD}
              maxLength={18}
              onChangeNumber={onChangeFromValue}
              balance={toFixedExp(selectedFrom?.balance, 8)}
              onPressMax={onPressMax}
              fromAddress={
                selectedFrom?.coin_family == 3 && selectedTo?.coin_family == 7
                  ? Singleton.getInstance().defaultMpcBtcAddress
                  : Singleton.getInstance().defaultMpcEthAddress
              }
              isUSD={isFaitOnFrom}
              onPressUSD={() => {
                setIsFaitOnFrom(!isFaitOnFrom);
              }}
            />

            {/* Swap Toggle */}
            <TouchableOpacity
              onPress={onPressToggle}
              style={{
                alignSelf: "center",
                marginVertical: heightDimen(20),
              }}
            >
              <Image
                source={ThemeManager.ImageIcons.toggle}
                style={{ alignSelf: "center", resizeMode: "contain" }}
              />
            </TouchableOpacity>

            {/* To Token Selector */}
            <SelectCurrencyAbstract
              onPressCoin={() => openSelector("to")}
              item={selectedTo}
              toAddress={toAddress}
              onChangeAddress={(text) => setToAddress(text)}
              value={toValue}
              // onChangeNumber={() => {}}
              balance={toFixedExp(selectedTo?.balance, 8)}
              editable={false}
            />

            {/* Confirm Button */}
            <View style={{ marginVertical: heightDimen(30) }}>
              <Button
                disabled={sendDisabled}
                buttontext={buttonText}
                // onPress={() => setSuccessAbstractionVisible(true)}
                onPress={onSwapClicked}

              // onPress={() => {
              //   console.log('kkkkk');

              //   setProcessingTransaction(true)}}
              />
            </View>
          </View>
        </ScrollView>

        {/* Token Selector Modal */}
        <ChainSelectorModal
          visible={modalVisible}
          chains={coinList}
          // selectedId={isSelectingFrom ? selectedFrom.id : selectedTo.id}
          selectedIdFrom={selectIndex}
          selectedIdTo={selectIndexOne}
          selectFrom={isSelectingFrom}
          onSelect={(chain) => {
            const isBTC = chain?.coin_family === 3;
            const address = isBTC
              ? Singleton.getInstance().defaultBtcAddress
              : Singleton.getInstance().defaultTicsAddress;

            let isAlreadySelected = false;
            if (isSelectingFrom) {
              isAlreadySelected = selectedTo?.coin_symbol === chain?.coin_symbol;
              if (!isAlreadySelected) {
                setSelectedFrom(chain);
              }
            } else {
              isAlreadySelected = selectedFrom?.coin_symbol === chain?.coin_symbol;
              if (!isAlreadySelected) {
                setSelectedTo(chain);
              }
            }

            setToAddress(address);
            setModalVisible(false);
            if (isAlreadySelected) {
              showAlertDialogNew(true);
              setAlertTxt("To and From token cannot be same");
            }

          }}
          onClose={() => setModalVisible(false)}
          onSelectIndexTo={(i) => {
            setSelectIndexOne(i);
          }}
          onSelectIndexFrom={(i) => {
            setSelectIndex(i);
          }}
        />
        {/* --------------------------------Modal for Pin----------------------------------- */}
        <Modal
          statusBarTranslucent
          animationType="slide"
          transparent={true}
          visible={showPinModal}
          onRequestClose={() => {
            setShowPinModal(false);
          }}
        >
          <View style={{ flex: 1 }}>
            <EnterPinForTransaction
              onBackClick={() => {
                setShowPinModal(false);
              }}
              closeEnterPin={async (pin) => {
                setShowPinModal(false);
                onSwapConfirmed(pin);
              }}
              checkBiometric={true}
            />
          </View>
        </Modal>

        <ConfirmAbstraction
          visible={confirmAbstractionVisible}
          fromToken={selectedFrom}
          toToken={selectedTo}
          fromAmt={fromValue}
          toAmt={toValue}
          gasFee={totalFee ? toFixedExp(totalFee, 8) : 0.0}
          fiatVal={
            "(~" +
            Singleton.getInstance().CurrencySymbol +
            " " +
            toFixedExp(
              parseFloat(totalFee ? toFixedExp(totalFee, 8) : 0.0) *
              parseFloat(
                selectedFrom?.coin_family == 3
                  ? nativeBtcValue
                  : nativeTicsValue
              ),
              6
            ) +
            ")"
          }
          onClose={() => setConfirmAbstractionVisible(false)}
          isLoading={isLoading}
          onConfirm={() => {
            setConfirmAbstractionVisible(false);
            setShowPinModal(true);
          }}
          platFormFee={toFixedExp(selectedFrom?.coin_family == 3 ? depositTotalFee?.btc : depositTotalFee?.tics, 8)}
          fiatValTics={
            "(~" +
            Singleton.getInstance().CurrencySymbol +
            " " +
            toFixedExp(
              parseFloat(selectedFrom?.coin_family == 3 ? depositTotalFee?.btc : depositTotalFee?.tics) *
              parseFloat(selectedFrom?.coin_family == 3 ? fiatValueForCoin?.BTC : fiatValueForCoin?.TICS),
              6
            ) +
            ")"
          }
        />
        <ProcessingTransaction
          item={selectedFrom}
          fees={totalFee ? toFixedExp(totalFee, 8) : 0.0}
          visible={processingTransaction}
          isFromSwap={true}
          intentHash={intentTxHash}
          onClose={() => {
            getCoinList();
            setProcessingTransaction(false);
            setIntentTxHash("");
            setFromValue("");
            setToValue("");
            setButtonText("Enter Amount");
          }}
        />

        {AlertDialogNew && (
          <AppAlert
            alertTxt={alertTxt}
            hideAlertDialog={() => {
              showAlertDialogNew(false);
            }}
          />
        )}

        {isMpcAddress && (
          <MpcAlertModel
            visible={isMpcAddress}
            message={'MPC address is not set'}
            onContinue={() => {
              mpcAddressApi()
            }}
            onClose={() => {
              setIsMpcAddress(false);
              Actions.pop();
            }}
          />
        )}

        <CongratulationModal
          visible={showCongratulationModal}
          onClose={() => {
            oldStateRef.current = false;
            setShowCongratulationModal(false)
          }}
          title="Congratulations!"
          message="Your MPC address has been generated successfully and is ready for use. You can now perform seamless cross-chain transactions with enhanced security."
          buttonText="Continue"
        />

        <LoaderView isSwap isLoading={isLoading} />
      </View>
    </>
  );
};

const styles = StyleSheet.create({
  ViewStyle1: {
    flex: 1,
    paddingTop: 8,
    paddingHorizontal: 16,
  },
  feeBox: {
    borderRadius: 10,
    padding: dimen(12),
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: heightDimen(20),
  },
  feeLabelRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  feeLabel: {
    fontSize: dimen(14),
    fontFamily: Fonts.dmRegular,
  },
  feeValue: {
    fontSize: dimen(14),
    fontFamily: Fonts.dmRegular,
  },
  imgStyle: {
    width: dimen(14),
    height: dimen(14),
    resizeMode: "contain",
    marginLeft: dimen(5),
  },
});

export default memo(ChainAbstractionSwap);
