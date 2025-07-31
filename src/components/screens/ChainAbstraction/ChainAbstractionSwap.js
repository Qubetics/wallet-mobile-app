import React, { memo, useEffect, useRef, useState } from "react";
import {
  Image,
  Linking,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { EventRegister } from "react-native-event-listeners";
import { useDispatch } from "react-redux";
import { ThemeManager } from "../../../../ThemeManager";
import * as Constants from "../../../Constants";
import {
  chainAbstractionSave,
  fetchNativePrice,
  getChainAbstractionCoinList,
  requestBTCgasprice,
  requestGasEstimation,
  requestNonce,
  requestSendCoin,
  requestUnspent,
} from "../../../Redux/Actions";
import Singleton from "../../../Singleton";
import { Fonts, Images } from "../../../theme";
import { dimen, getGasLimitFromData, getGasPriceForWc, getSepoliaGasPrice, heightDimen } from "../../../Utils";
import {
  bigNumberSafeMath,
  consoleLogFunc,
  exponentialToDecimal,
  getData,
  getEncryptedData,
  toFixed,
  toFixedExp,
} from "../../../Utils/MethodsUtils";
import { AppAlert, Button, LoaderView } from "../../common";
import ChainSelectorModal from "../../common/ChainSelectorModal";
import ConfirmAbstraction from "../../common/ConfirmAbstraction";
import { SelectCurrencyAbstract } from "../../common/SelectCurrencyAbstract";
import SuccessAbstraction from "../../common/SuccessAbstraction";
import {
  btcToSatoshi,
  depositIntent,
  getTicsTransactionCount,
  sendTokenTics,
  ticsDataEncode,
} from "../../../Utils/TicsUtils";
import { LanguageManager } from "../../../../LanguageManager";
import EnterPinForTransaction from "../EnterPinForTransaction/EnterPinForTransaction";
import { Actions } from "react-native-router-flux";
import { getMaticRaw } from "../../../Utils/MaticUtils";
import ProcessingTransaction from "../../common/ProcessingTransaction";
import { parseEther, parseUnits } from "ethers/lib/utils";
import { bnbDataEncode } from "../../../Utils/BscUtils";
import { ethers } from "ethers";
const ABI = require("../../../chainAbstractionAbi.json");

const ChainAbstractionSwap = ({ themeSelected, navigation, isVisible }) => {
  const bitcore = require("bitcore-lib");
  const { detailTrx, alertMessages, swapText, browser } = LanguageManager;
  let fee = 0;
  let inputCount = 0;
  let outputCount = 2;
  let totalAmountAvailable = 0;
  let inputs = [];
  let transactionSize = 0;
  let btcTosatoshi = 100000000;
  let btcTosatoshiMultiplier = 0.00000001;
  const gasFeeMultiplier = 0.000000000000000001;

  const dispatch = useDispatch();
  const scrollRef = useRef(null);
  const [isLoading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedFrom, setSelectedFrom] = useState("");
  const [selectedTo, setSelectedTo] = useState("");
  const [isSelectingFrom, setIsSelectingFrom] = useState(true);
  const [toAddress, setToAddress] = useState(
    "0x3c9CA0Efc5FAE7825ee69B95E78719a07C75FDE0"
  );
  const [fromValue, setFromValue] = useState("");
  const [toValue, setToValue] = useState("");
  const [fromToken, setFromToken] = useState("");
  const [toToken, setToToken] = useState("");
  const [confirmAbstractionVisible, setConfirmAbstractionVisible] =
    useState(false);
  const [successAbstractionVisible, setSuccessAbstractionVisible] =
    useState(false);
  const [btcFeeObj, setBtcFeeObj] = useState(null);
  const [btcfeesResponse, setBtcfeesResponse] = useState(true);
  const [SliderValuemin, setSliderValuemin] = useState(0);
  const [SliderValuemax, setSliderValuemax] = useState(0);
  const [myAddress, setMyAddress] = useState(
    Singleton.getInstance().defaultBtcAddress
  );
  const [coinList, setCoinList] = useState([]);
  const [userBal, setUserBal] = useState(0);
  const [fromTokenBal, setFromTokenBal] = useState("0");
  const [toTokenBal, setToTokenBal] = useState("0");
  const [nonce, setNonce] = useState(0);
  const [nativeFaitValue, setNativeFaitValue] = useState(0);
  const [gasEstimate, setGasEstimate] = useState(0);
  const [gasPrice, setGasPrice] = useState(0);
  const [totalFee, setTotalFee] = useState(0);
  const [depositGasEstimate, setDepositGasEstimate] = useState(0);
  const [depositGasPrice, setDepositGasPrice] = useState(0);
  const [depositTotalFee, setDepositTotalFee] = useState(0);
  const [SliderValue, setSliderValue] = useState("");
  const [txnSize, setTxnSize] = useState(0);
  const [totalAvlAmnt, setTotalAvlAmnt] = useState(0);
  const [input, setInput] = useState([]);
  const [AlertDialogNew, showAlertDialogNew] = useState(false);
  const [alertTxt, setAlertTxt] = useState("");
  const [ticsBalance, setTicsBalance] = useState("");
  const [showPinModal, setShowPinModal] = useState(false);
  const [intentTxHash, setIntentTxHash] = useState("");
  const [recipient, setRecipient] = useState("");
  const [sendDisabled, setSendDisabled] = useState(true);
  const [buttonText, setButtonText] = useState("Enter Amount");
  const [nativeFiatValFrom, setNativeFiatValFrom] = useState(0);
  const [nativeFiatValTo, setNativeFiatValTo] = useState(0);
  const [processingTransaction, setProcessingTransaction] = useState(false);
  const [nativeBtcValue, setNativeBtcValue] = useState(0);
  const [nativeTicsValue, setNativeTicsValue] = useState(0);

  const [selectIndex, setSelectIndex] = useState(null);
  const [selectIndexOne, setSelectIndexOne] = useState(null);

  const debounceTimeout = useRef(null);

  /******************************************************************************************/

  useEffect(() => {
    focus();
    EventRegister.addEventListener("getThemeChanged", (data) => {});
    navigation.addListener("didFocus", () => {
      focus();
    });
    navigation.addListener("didBlur", () => {
      setFromValue("");
      setToValue("");
      // setToAddress('')
      setButtonText("Enter Amount");
      setSendDisabled(true);
      setSelectIndex(null);
      setSelectIndexOne(null);
    });

    EventRegister.addEventListener(Constants.DOWN_MODAL, () => {
      setModalVisible(false);
      setProcessingTransaction(false);
    });
    return () => {};
  }, []);

  useEffect(() => {
    updateSendButtonState();
  }, [fromValue, toValue, toAddress]);
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

  const focus = () => {
    getCoinList();
    platFormFee();
    fetchNativeFunction();
  };
  /******************************************************************************************/

  const dynamicApiEndPoint = () => {
    return selectedFrom?.coin_family == 1
      ? "binancesmartchain"
      : selectedFrom?.coin_family == 4
      ? "polygon"
      : selectedFrom?.coin_family == 2
      ? "ethereum"
      : "qubetics";
  };
  const dynamicSymbolApiEndPoint = () => {
    return selectedFrom?.coin_family == 1
      ? "bnb"
      : selectedFrom?.coin_family == 4
      ? "pol"
      : selectedFrom?.coin_family == 2
      ? "eth"
      : "tics";
  };
  /******************************************************************************************/

  const fetchNativeFunction = async () => {
    try {
      const currency = Singleton.getInstance().CurrencySelected;

      const data = {
        fiat_currency: currency,
        coin_family: 3,
      };

      const data_2 = {
        fiat_currency: currency,
        coin_family: 7,
      };

      // consoleLogFunc("DATA>>>>>>>", data);

      const [res, res1] = await Promise.all([
        dispatch(fetchNativePrice({ data })),
        dispatch(fetchNativePrice({ data: data_2 })),
      ]);

      // consoleLogFunc("chk res native price:::::", res);
      // consoleLogFunc("chk res native price:::2::", res1);

      setNativeBtcValue(res?.fiatCoinPrice?.value);
      setNativeTicsValue(res1?.fiatCoinPrice?.value);
      setNativeFaitValue(toFixedExp(res?.fiatCoinPrice?.value, 2));
      // setNativeFiatValTo(toFixedExp(res1?.fiatCoinPrice?.value, 2));
    } catch (err) {
      consoleLogFunc("chk err native price:::::", err);
    }
  };

  /******************************************************************************************/
  const getCoinList = () => {
    let data = {
      coinFamilies: [3, 7, 2],
      addrsList: [
        Singleton.getInstance().defaultBtcAddress,
        Singleton.getInstance().defaultTicsAddress,
        Singleton.getInstance().defaultEthAddress
      ],
    };
    setLoading(true);
    dispatch(getChainAbstractionCoinList(data))
      .then((res) => {
        consoleLogFunc("getChainAbstractionCoinList>>>>res", res?.data);
        let response = res?.data;
        const ticsBalance =
          response?.find((item) => item.coin_symbol === "tics")?.wallet_data
            ?.balance ?? 0;
        const fromIndex = response?.findIndex(
          (item) => item.coin_symbol === response[0]?.coin_symbol
        );
        const toIndex = response?.findIndex(
          (item) => item.coin_symbol === response[1]?.coin_symbol
        );
        // consoleLogFunc("ticsBalance>>>>res", ticsBalance);
        setCoinList(response);
        setSelectedFrom(response[0]);
        setSelectedTo(response[1]);
        setSelectIndex(fromIndex);
        setSelectIndexOne(toIndex);
        setTicsBalance(ticsBalance);
        setLoading(false);
      })
      .catch((e) => {
        consoleLogFunc("getChainAbstractionCoinList>>>>error", e);
        setLoading(false);
      });
  };
  /******************************************************************************************/
  const getbtcFeesAndUnspentTransaction = () => {
    inputCount = 0;
    inputs = [];

    setLoading(true);
    /******************************get btc fees****************************** */
    dispatch(requestBTCgasprice())
      .then((gasRes) => {
        // consoleLogFunc("requestBTCgasprice>>>>res", gasRes);

        if (gasRes?.regular) {
          setSliderValue(gasRes?.priority);
        } else {
          setSliderValue(50);
        }
        // /******************************get unspent transaction****************************** */
        getData(Constants.ACCESS_TOKEN).then((token) => {
          dispatch(requestUnspent(myAddress, token, "btc"))
            .then((res) => {
              consoleLogFunc("response unspent>>>>>>swap", res);
              totalAmountAvailable = 0;

              res.data.forEach(async (element) => {
                let utxo = {};
                utxo.satoshis = Math.floor(Number(element.satoshis));
                utxo.script = element.scriptPubKey;
                utxo.address = element.address;
                utxo.txId = element.txid;
                utxo.outputIndex = element.vout;
                utxo.tx_raw = element.tx_raw;
                totalAmountAvailable += utxo.satoshis;
                inputCount += 1;
                inputs.push(utxo);
              });
              // consoleLogFunc("------input", JSON.stringify(inputs));
              // consoleLogFunc("------inputCount", inputCount);
              // consoleLogFunc("------outputCount", outputCount);
              transactionSize =
                inputCount * 146 + outputCount * 34 + 10 - inputCount;
              // consoleLogFunc("------transactionSize", transactionSize);
              // consoleLogFunc(
              //   "------totalAmountAvailable",
              //   totalAmountAvailable
              // );

              setTotalFee(
                transactionSize * gasRes.priority * btcTosatoshiMultiplier
              );
              setTxnSize(transactionSize);
              setTotalAvlAmnt(totalAmountAvailable);
              setInput(inputs);
              setLoading(false);
            })
            .catch((e) => {
              consoleLogFunc("response unspent>>>>>>error", e);
              setLoading(false);
            });
        });
      })
      .catch((e) => {
        consoleLogFunc("requestBTCgasprice>>>>error", e);
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
          // console.log("getFee>>>>res", res);
          if (res?.status) {
            // let gasEstimate = res?.gas_estimate;
            // if (
            //   selectedFrom?.coin_family == 7 ||
            //   selectedFrom?.coin_family == 4
            // ) {
            //   gasEstimate = gasEstimate + 10000;
            // }
            let gasEstimate = 12000;
            // consoleLogFunc("gasEstimate>>platform", gasEstimate);

            if (res?.resultList == undefined && res?.gas_price != undefined) {
              // consoleLogFunc("res1>>>>>platforn", "HAS VLAUE");
              res = {
                ...res,
                resultList: {
                  safe_gas_price: res.gas_price,
                  propose_gas_price: res.gas_price,
                  fast_gas_price: res.gas_price,
                },
              };
            }
            const mediumGasPrice =
              parseFloat(
                res.resultList?.propose_gas_price < 3
                  ? 3
                  : res.resultList?.propose_gas_price
              ) *
              10 ** 9;
            const feeIs = toFixedExp(
              mediumGasPrice * gasEstimate * gasFeeMultiplier,
              8
            );

            setDepositGasEstimate(gasEstimate);
            setDepositTotalFee(feeIs);
            setDepositGasPrice(mediumGasPrice);
            // consoleLogFunc("mediumGasPrice>>>platform",feeIs, res, mediumGasPrice);
            setLoading(false);
          } else {
            setLoading(false);
            showAlertDialogNew(true);
            setAlertTxt(res?.message);
            return;
          }
        })
        .catch((e) => {
          console.log("getFee>>>>error", e);
        });
    });
  };

  /******************************************************************************************/
  const getFee = () => {
    let gasEstimationReq = {
      from: Singleton.getInstance().defaultTicsAddress,
      to: Singleton.getInstance().defaultTicsAddress,
      amount: "",
    };
    setLoading(true);
    let nonceReq = { amount: "" };
    getData(Constants.ACCESS_TOKEN).then((token) => {
      console.log("token>>", token);

      dispatch(
        requestGasEstimation({
          url: `${dynamicApiEndPoint()}/${dynamicSymbolApiEndPoint()}/gas_estimation`,
          coinSymbol: dynamicSymbolApiEndPoint(),
          gasEstimationReq,
          token,
        })
      )
        .then(async (res) => {
          console.log("getFee>>>>res", res);
          if (res?.status) {
            let gasEstimate = res?.gas_estimate;
            if (
              selectedFrom?.coin_family == 7 ||
              selectedFrom?.coin_family == 4
            ) {
              gasEstimate = gasEstimate + 10000;
            }
            consoleLogFunc("gasEstimate>>", gasEstimate);

            if (res?.resultList == undefined && res?.gas_price != undefined) {
              const gasPrice = res.gas_price
              res = {
                ...res,
                resultList: {
                  safe_gas_price: gasPrice,
                  propose_gas_price: gasPrice,
                  fast_gas_price: gasPrice
                },
              };
            } else{
              const gasPrice = await getSepoliaGasPrice(selectedFrom?.coin_family);
              console.log("gasPrice>>>>", gasPrice);
              res = {
                ...res,
                resultList: {
                  safe_gas_price: gasPrice,
                  propose_gas_price: gasPrice,
                  fast_gas_price: gasPrice
                },
              };
            }
            const mediumGasPrice =
            selectedFrom?.coin_family == 2 ? 
            res.resultList?.propose_gas_price
            : (parseFloat(
                res.resultList?.propose_gas_price < 3
                  ? 3
                  : res.resultList?.propose_gas_price
              ) *
              10 ** 9);
            const feeIs = toFixedExp(
              mediumGasPrice * gasEstimate * gasFeeMultiplier,
              8
            );
            // consoleLogFunc("feeIs>>>", feeIs);
            consoleLogFunc("mediumGasPrice>>>", res, mediumGasPrice);

            dispatch(
              requestNonce({
                url: `${dynamicApiEndPoint()}/${
                  selectedFrom.is_token == 0
                    ? dynamicSymbolApiEndPoint()
                    : selectedFrom.token_address
                }/nonce`,
                coinSymbol: dynamicSymbolApiEndPoint(),
                nonceReq,
                token,
              })
            )
              .then((res2) => {
                // consoleLogFunc("nonce>>>", res2?.data?.nonce);
                setGasEstimate(gasEstimate);
                setTotalFee(feeIs);
                setGasPrice(mediumGasPrice);
                setNonce(res2?.data?.nonce);
                setLoading(false);
              })
              .catch((e) => {
                console.log("e--->>", e);
                setLoading(false);
                showAlertDialogNew(true);
                setAlertTxt(e);
              });
          } else {
            setLoading(false);
            showAlertDialogNew(true);
            setAlertTxt(res?.message);
            return;
          }
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

    const newFromToken = toToken;
    const newToToken = fromToken;
    setFromToken(newFromToken);
    setToToken(newToToken);

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
        ? Singleton.getInstance().defaultBtcAddress
        : Singleton.getInstance().defaultTicsAddress
    );
  };
  /******************************************************************************************/

  const onPressMax = () => {
    const balance = selectedFrom?.wallet_data?.balance || 0;
    const maxValue = balance.toString();
    setFromValue(maxValue);
  };
  /******************************************************************************************/

  const onChangeFromValue = (val) => {
    setFromValue(val);
    if (debounceTimeout.current) {
      clearTimeout(debounceTimeout.current);
    }
    debounceTimeout.current = setTimeout(() => {
      const fromFiatValue = selectedFrom?.fiat_price_data?.value;
      console.log("fromFiatValue>>>", fromFiatValue);

      console.log("selectedTo>>>", selectedTo);
      const toFiatValue = selectedTo?.fiat_price_data?.value;
      console.log("toFiatValue>>>", toFiatValue);

      const toValue = bigNumberSafeMath(
        bigNumberSafeMath(val, "*", fromFiatValue),
        "/",
        toFiatValue
      );
      let decimal = selectedTo?.decimals?.toString()?.length - 1
      decimal =  decimal > 8 ? 8 : decimal
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
    const walletData = data?.firstCoin;
    setConfirmAbstractionVisible(true);
    if (
      walletData?.coin_family == 1 ||
      walletData?.coin_family == 2 ||
      walletData?.coin_family == 4 ||
      walletData?.coin_family == 7
    ) {
      setTimeout(() => {
        getFee();
      }, 200);
    }
    if (walletData?.coin_family == 3) {
      setTimeout(() => {
        getbtcFeesAndUnspentTransaction();
      }, 200);
    }
  };
  /******************************************************************************************/

  const onSwapConfirmed = (pin) => {
    const walletData = selectedFrom;
    if (
      (walletData?.coin_family == 1 ||
        walletData?.coin_family == 4 ||
        walletData?.coin_family == 2 ||
        walletData?.coin_family == 7) &&
      walletData?.is_token == 0
    ) {
      sendTics(pin);
    } else if (
      (walletData?.coin_family == 1 ||
        walletData?.coin_family == 4 ||
        walletData?.coin_family == 2 ||
        walletData?.coin_family == 7) &&
      walletData?.is_token == 1
    ) {
      sendTicsToken(pin, walletData.coin_family);
    } else if (walletData?.coin_family == 3) {
      sendBtc(pin);
    }
  };

  /******************************BTC RAW GENERATION****************************** */
  const sendBtc = async (pin) => {
    let privateKey = await getEncryptedData(
      `${Singleton.getInstance().defaultBtcAddress}_pk`,
      pin
    );
    let fee = txnSize * SliderValue;
    // consoleLogFunc("----fee", fee, txnSize, SliderValue, "--", transactionSize);
    // consoleLogFunc(
    //   totalAvlAmnt,
    //   "----totalAmountAvailable",
    //   totalAmountAvailable
    // );
    // consoleLogFunc("----eee", Math.round(fromValue * btcTosatoshi));
    // consoleLogFunc("input--", input);

    if (totalAvlAmnt - Math.round(fromValue * btcTosatoshi) - fee < 0) {
      setLoading(false);
      showAlertDialogNew(true);
      setAlertTxt(alertMessages?.balancetooLowforThisTransaction);
      return;
    }

    let platformAddress = "tb1qe6hf4x7qark8cg0kcm9z7rhdgmtkwwppst006v";
    // let platformAddress = Singleton.getInstance().defaultBtcAddress;
    setLoading(true);
    setTimeout(async () => {
      let serializedTransaction;
      try {
        const transaction = new bitcore.Transaction();
        transaction.from(input);
        transaction.to(platformAddress, Math.round(fromValue * btcTosatoshi));
        transaction.change(Singleton.getInstance().defaultBtcAddress);
        transaction.fee(fee);
        transaction.sign(privateKey);
        serializedTransaction = transaction.serialize();

        // consoleLogFunc("----transaction", transaction);
      } catch (e) {
        consoleLogFunc("----e111", e);

        consoleLogFunc(e);
        setLoading(false);
        showAlertDialogNew(true);
        setAlertTxt(`${e}` || alertMessages?.failedtoInitiateTransaction);
        return;
      }
      getData(Constants.ACCESS_TOKEN)
        .then((token) => {
          // consoleLogFunc("----token", token);

          sendSerializedTxnBTC(
            0,
            serializedTransaction,
            Singleton.getInstance().defaultBtcAddress,
            platformAddress,
            fromValue,
            gasEstimate,
            gasPrice,
            selectedFrom?.coin_symbol,
            token,
            pin
          );
          privateKey = "";
        })
        .catch((err) => {
          consoleLogFunc("----e222", err);

          privateKey = "";
          setLoading(false);
          showAlertDialogNew(true);
          setAlertTxt(`${err}` || alertMessages?.failedtoInitiateTransaction);
        });
    }, 200);
  };

  /******************************BTC send api call****************************** */
  const sendSerializedTxnBTC = (
    nonce,
    tx_raw,
    myAddress,
    toAddress,
    amount,
    gasEstimate,
    gas_gwei_price,
    coin_symbol,
    userToken,
    pin
  ) => {
    const sendCoinReq = {
      nonce: nonce,
      tx_raw: `${tx_raw}`,
      from: myAddress,
      to: toAddress,
      amount: amount,
      gas_estimate: gasEstimate,
      eth_gas_price: gas_gwei_price,
      tx_type: "chain_abstraction",
    };
    consoleLogFunc("sendCoinReq:::::>>>>>", sendCoinReq);
    dispatch(
      requestSendCoin({
        url: `bitcoin/${coin_symbol}/send`,
        coinSymbol: coin_symbol,
        sendCoinReq,
        token: userToken,
      })
    )
      .then((res) => {
        consoleLogFunc("sendSerializedTxnBTC:::::>>>>>res", res);

        depositChainAbstraction(pin, res?.data);
        // Actions.pop();
        // Actions.currentScene != "TransactionHistory" &&
        //   Actions.TransactionHistory({
        //     selectedCoin: {
        //       ...itemWallet,
        //       wallet_address: itemWallet?.wallet_data?.wallet_address,
        //       currentPriceInMarket: itemWallet?.fiat_price_data?.value,
        //       price_change_percentage_24h: itemWallet?.fiat_price_data?.price_change_percentage_24h,
        //     },
        //   });
      })
      .catch((e) => {
        consoleLogFunc("sendSerializedTxnBTC:::::>>>>>error", e);

        setLoading(false);
        showAlertDialogNew(true);
        setAlertTxt(e || alertMessages.failedtoInitiateTransaction);
      });
  };
  /******************************************************************************************/

  const depositChainAbstraction = async (pin, hash) => {
    setLoading(true);
    try {
      const privateKey = await getEncryptedData(
        `${Singleton.getInstance().defaultEthAddress}_pk`,
        pin
      );
      const fromAddress =
        selectedFrom?.coin_family == 3
          ? Singleton.getInstance().defaultBtcAddress
          : selectedFrom?.coin_family == 2
          ? Singleton.getInstance().defaultEthAddress
          : Singleton.getInstance().defaultTicsAddress;

      console.log("fromAddress>>", fromAddress);
      console.log("toAddress>>", toAddress);
      const fromDecimal = selectedFrom?.decimals?.toString()?.length - 1
      const toDecimal = selectedTo?.decimals?.toString()?.length - 1
      const fromAmount = selectedFrom?.coin_family == 3 ? 
      btcToSatoshi(fromValue)
     : parseUnits(fromValue, fromDecimal);

      const  toAmount =
        selectedTo?.coin_family == 3
          ? btcToSatoshi(toValue)
          : parseUnits(fromValue, toDecimal);

   
      const intentTxId = await depositIntent(
        privateKey,
        fromAddress,
        toAddress,
        fromAmount,
        toAmount,
        hash,
        selectedFrom,
        selectedTo
      );
      setIntentTxHash(intentTxId);
      submitIntentHash(intentTxId, hash);
      setLoading(false);
    } catch (err) {
      console.log("depositChainAbstraction---err", err);
      setLoading(false);
    } finally {
      setLoading(false);
    }
  };
  /******************************************************************************************/

  const submitIntentHash = async (signedTx, hash) => {
    setLoading(true);
    const data = {
      intentHash: signedTx,
      hash: hash,
      fees: totalFee ? toFixedExp(totalFee, 8) : 0.0,
    };
    console.log("data---submitIntentHash", data);
    dispatch(chainAbstractionSave(data))
      .then((res) => {
        consoleLogFunc("submitIntentHash:::::>>>>>res", res);
        setLoading(false);

        setProcessingTransaction(true);
      })
      .catch((e) => {
        consoleLogFunc("submitIntentHash:::::>>>>>error", e);
        setLoading(false);
        showAlertDialogNew(true);
        setAlertTxt(e || alertMessages.failedtoInitiateTransaction);
      });
  };
  //******************************************************************************************/
  const sendTics = (pin) => {
    setLoading(true);
    setTimeout(async () => {
      try {
        let privateKey = await getEncryptedData(
          `${Singleton.getInstance().defaultTicsAddress}_pk`,
          pin
        );
        console.log("privateKey>>", privateKey);

        let txn_raw = "";
        const chainId = 9029;
        const toAddress = "0xa0687e6fc0275dfd27b81d8182ca36a5b4882f97";
        const nonce_new = await getTicsTransactionCount(
          Singleton.getInstance().defaultTicsAddress
        );
        txn_raw = await getMaticRaw(
          fromValue,
          toAddress,
          nonce_new,
          gasPrice,
          gasEstimate,
          chainId,
          privateKey
        );
        console.log("txn_raw---", txn_raw);
        privateKey = "";
        sendSerializedTxn(txn_raw, pin, nonce);
      } catch (err) {
        setLoading(false);
        showAlertDialogNew(true);
        setAlertTxt(`${err}` || alertMessages.failedtoInitiateTransaction);
      }
    }, 200);
  };

  /******************************************************************************************/
  const sendSerializedTxn = (tx_raw, pin, nonce) => {
    setLoading(true);
    const toAddress = "0xa0687e6fc0275dfd27b81d8182ca36a5b4882f97";
    let sendCoinReq = {
      nonce: nonce,
      tx_raw: tx_raw,
      from: Singleton.getInstance().defaultTicsAddress,
      to: toAddress,
      amount: fromValue,
      gas_estimate: gasEstimate,
      gas_price: gasPrice,
      tx_type: "chain_abstraction",
    };
    consoleLogFunc("sendCoinReq:::1:", sendCoinReq);
    dispatch(
      requestSendCoin({
        // url: `${dynamicApiEndPoint()}/${selectedFrom.is_token == 0
        //   ? dynamicSymbolApiEndPoint()
        //   : selectedFrom.token_address
        //   }/nonce`,
        url: `${dynamicApiEndPoint()}/${
          selectedFrom.is_token == 0
            ? dynamicSymbolApiEndPoint()
            : selectedFrom.token_address
        }/send`,
        coinSymbol: dynamicSymbolApiEndPoint(),
        sendCoinReq,
      })
    )
      .then((res) => {
        consoleLogFunc("sendSerializedTxn-----sendSerializedTxn", res);
        setIntentTxHash(res?.data);
        depositChainAbstraction(pin, res?.tx_hash);
      })
      .catch((e) => {
        setLoading(false);
        showAlertDialogNew(true);
        setAlertTxt(e || alertMessages.failedtoInitiateTransaction);
      });
  };

  /********************************************** TOKEN ****************************************************/
  const sendTicsToken = (pin, coinFamily) => {
    setLoading(true);
    setTimeout(async () => {
      let privateKey = await getEncryptedData(
        `${Singleton.getInstance().defaultTicsAddress}_pk`,
        pin
      );
      // const chainID = coinFamily == 1 ? 56 : 137;
      const chainId = selectedFrom?.coin_family == 7 ? 9029 : 11155111;
      consoleLogFunc("fdefd>>>>>>", fromValue, selectedFrom);

      const BigNumber = require("bignumber.js");

      let a = new BigNumber(fromValue);
      let b = new BigNumber(selectedFrom?.decimals);
      console.log("A>>>>", a, "B>>",b);
      
      const amountToSend = a.multipliedBy(b).toString();
      consoleLogFunc("amountToSend>>>>>>", amountToSend);

      const platformAddress = "0xa0687e6fc0275dfd27b81d8182ca36a5b4882f97";

      // const nonce = await getTicsTransactionCount(
      //   Singleton.getInstance().defaultTicsAddress
      // );
      consoleLogFunc(
        "selectedFrom?.token_address::::",
        selectedFrom?.token_address,
        nonce,
        gasPrice,
        gasEstimate,
        chainId
      );

      ticsDataEncode(selectedFrom?.token_address, platformAddress, amountToSend)
        .then(async (encodedData) => {
          let calculatedGasEst = gasEstimate * 4
          // try {
          //   calculatedGasEst = await getGasLimitFromData(
          //     Singleton.getInstance().defaultTicsAddress,
          //     Singleton.getInstance().defaultTicsAddress,
          //     encodedData,
          //     selectedFrom?.coin_family

              
          // );
          // } catch (error) {
            
          // }
    
        consoleLogFunc("chk TICS encoded Data::::::", calculatedGasEst, encodedData);

          sendTokenTics(
            selectedFrom?.token_address,
            encodedData,
            nonce,
            gasPrice,
            calculatedGasEst || gasEstimate,
            chainId,
            privateKey
          )
            .then((signedRaw) => {
              consoleLogFunc("chk tics signedRaw::::::", signedRaw);
              sendSerializedTxn(signedRaw, pin, nonce);
              privateKey = "";
            })
            .catch((err) => {
              privateKey = "";
              setLoading(false);
              showAlertDialogNew(true);
              setAlertTxt(err?.message);
            });
        })
        .catch((err) => {
          setLoading(false);
          showAlertDialogNew(true);
          setAlertTxt(err?.message);
        });
    }, 200);
  };

  /******************************************************************************************/

  return (
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
            value={fromValue}
            onChangeNumber={onChangeFromValue}
            balance={selectedFrom?.balance}
            onPressMax={onPressMax}
            fromAddress={
              selectedFrom?.coin_family == 3 && selectedTo?.coin_family == 7
                ? Singleton.getInstance().defaultBtcAddress
                : Singleton.getInstance().defaultTicsAddress
            }
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
            onChangeNumber={() => {}}
            balance={selectedTo?.balance}
            editable={true}
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
      
          if (isSelectingFrom) {
            setSelectedFrom(chain);
            setFromToken(chain);
          } else {
            setSelectedTo(chain);
            setToToken(chain);
          }
          setToAddress(address);
          setModalVisible(false);
          // Recalculate toValue if needed
          // if (fromValue) {
          //   const updatedToValue = (
          //     parseFloat(fromValue) *
          //     (isSelectingFrom ? chain.usdRate : fromToken.usdRate) /
          //     (isSelectingFrom ? toToken.usdRate : chain.usdRate)
          //   ).toFixed(6);
          //   setToValue(updatedToValue);
          // }
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
        platFormFee={depositTotalFee ? toFixedExp(depositTotalFee, 8) : 0.0}
        fiatValTics={
          "(~" +
          Singleton.getInstance().CurrencySymbol +
          " " +
          toFixedExp(
            parseFloat(depositTotalFee ? toFixedExp(depositTotalFee, 8) : 0.0) *
              parseFloat(nativeTicsValue),
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
          setProcessingTransaction(false);
          Actions.jump("WalletMain");
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
      <LoaderView isSwap isLoading={isLoading} />
    </View>
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
