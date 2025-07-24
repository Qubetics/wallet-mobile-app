import React, { useState, useEffect, useRef, memo, useMemo } from "react";
import {
  StyleSheet,
  View,
  Image,
  Text,
  TouchableOpacity,
  Dimensions,
  Platform,
  ScrollView,
  ImageBackground,
  Keyboard,
  Modal,
} from "react-native";
import {
  SelectCurrency,
  Button,
  AppAlert,
  ConfirmSwapCrosschain,
  SelectCurrencyNew,
  GradientBorderView,
} from "../../common";
import {
  CreateEthTokenRaw,
  EthDataEncode,
  createEthRaw,
} from "../../../Utils/EthUtils";
import {
  getSwapCoinInfo,
  coinDetail,
  accountExchange,
  requestGasEstimation,
  requestSendCoin,
  requestNonce,
  requestBTCgasprice,
  requestUnspent,
  requestLtcUnspent,
  getFiatValue,
  getFeeLimit,
  getCoinMinAmnt,
  createChangellyTransaction,
  getSwapPriceDiff,
  getCrossChainCoinList,
  getUserBalance,
  fetchNativePrice,
  saveSolTransactionId,
  getCrossChainLastPair,
} from "../../../Redux/Actions";
import {
  consoleLogFunc,
  currencyFormat,
  exponentialToDecimal,
  getData,
  getData as getDataFromStorage,
  getEncryptedData,
  saveData,
  toFixedExp,
} from "../../../Utils/MethodsUtils";
import { Images, Fonts, Colors } from "../../../theme";
import { ThemeManager } from "../../../../ThemeManager";
import Singleton from "../../../Singleton";
import * as constants from "../../../Constants";
import { useDispatch } from "react-redux";
import { LoaderView } from "../../common/LoaderView";
import Web3 from "web3";
import { Actions } from "react-native-router-flux";
import {
  bnbDataEncode,
  getBnbRaw,
  sendTokenBNB,
} from "../../../Utils/BscUtils";
import * as Constants from "../../../Constants";
import { EventRegister } from "react-native-event-listeners";
import { createTrxRaw, createTrxTokenRaw } from "../../../Utils/TronUtils";
import { LanguageManager } from "../../../../LanguageManager";
import { roundToDecimal } from "../../../Utils";
import { ChangellyCoinList } from "../../common/ChangellyCoinList";
import EnterPinForTransaction from "../EnterPinForTransaction/EnterPinForTransaction";
import PriceImpactModal from "../../common/PriceImpactModal";
import LinearGradient from "react-native-linear-gradient";
import Tooltip from "rn-tooltip";
import { sendSOLANA, sendTokenSOLANA } from "../../../Utils/SolUtils";
import { ethers } from "ethers";
import { getDappProvider } from "../../../Utils/etherProviderUtils";
import { getMaticRaw } from "../../../Utils/MaticUtils";
import { SelectCurrencyAbstract } from "../../common/SelectCurrencyAbstract";


const ChainAbstractionSwap = ({
  themeSelected,
  navigation,
  isVisible,
  firstCoinSelectedData,
  ...props
}) => {
  const { detailTrx, alertMessages, swapText, browser } = LanguageManager;
  const tabData = [
    { title: "25%", key: "1", selected: false },
    { title: "50%", key: "2", selected: false },
    { title: "75%", key: "3", selected: false },
    { title: "100%", key: "4", selected: false },
  ];

  const testnetUrlEth = Singleton.getInstance().ETH_RPC_URL; // Constants.network == 'testnet' ? Constants.ETH_TESTNET_URL : Constants.ETH_MAINNET_URL;
  // const provider =  new ethers.providers.JsonRpcProvider(testnetUrlEth);
  const provider = getDappProvider(testnetUrlEth);
  const gasFeeMultiplier = 0.000000000000000001;

  // BTC
  const bitcore = require('bitcore-lib');
  let inputCount = 0;
  let outputCount = 2;
  let inputs = [];
  let totalAmountAvailable = 0;
  let transactionSize = 0;
  let btcTosatoshi = 100000000;
  let btcTosatoshiMultiplier = 0.00000001;

  const dispatch = useDispatch();
  const tooltipRef = useRef(null);
  const scrollRef = useRef(null);

  const [firstCoinSelected, setFirstCoinSelected] = useState(null);
  // selected first coin wallet
  const [coinInfoSwap, setCoinInfoSwap] = useState({});
  const [fromAmt, setFromAmt] = useState("");

  const [firstCoinList, setFirstCoinList] = useState([]);
  const [firstCoinFilteredList, setFirstCoinFilteredList] = useState([]);

  const [secondCoinSelected, setSecondCoinSelected] = useState(null);

  const [toAmt, setToAmt] = useState("");
  const [secondCoinList, setSecondCoinList] = useState([]);
  const [secondCoinFilteredList, setSecondCoinFilteredList] = useState([]);

  const [isRelayerFeeGreater, setIsRelayerFeeGreater] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(null);
  const [showtooltip, setShowtooltip] = useState(true);
  const [serviceFee, setServiceFee] = useState("0.5");
  const [buttonTxt, setButtonTxt] = useState("Swap");

  const [firstModal, setFirstModal] = useState(false);
  const [secondModal, setSecondModal] = useState(false);
  const [search, setSearch] = useState("");
  const [ConfirmTxnModal, showConfirmTxnModal] = useState(false);
  const [AlertDialogNew, showAlertDialogNew] = useState(false);
  const [alertTxt, setAlertTxt] = useState("");
  const [isLoading, setLoading] = useState(true);
  const [gasEstimate, setGasEstimate] = useState(0);
  const [gasPrice, setGasPrice] = useState(0);
  const [totalFee, setTotalFee] = useState(0);
  const [nonce, setNonce] = useState(0);
  const [crossSwapData, setCrossSwapData] = useState("");
  const [sendCoinPayload, setSendCoinPayload] = useState(null);
  const [fromToAmtDiff, setFromToAmtDiff] = useState(0);
  const [pairModalAlert, setPairModalAlert] = useState(false);
  const [priceImpactState, setPriceImpactState] = useState(true);
  const [userBal, setUserBal] = useState(0);
  // BTC
  const [SliderValue, setSliderValue] = useState("");
  const [txnSize, setTxnSize] = useState(0);
  const [totalAvlAmnt, setTotalAvlAmnt] = useState(0);
  const [input, setInput] = useState([]);

  // TRON
  const [feeLimit, setFeeLimit] = useState("40000000");

  const [showPinModal, setShowPinModal] = useState(false)

  const [nativeFaitValue, setNativeFaitValue] = useState(0);

  const seconditemWallet = useMemo(() => {
    if (secondCoinSelected) {
      return {
        ...secondCoinSelected.wallet_data,
        is_token: secondCoinSelected.is_token,
      };
    }
    return {};
  }, [secondCoinSelected]);

  const platformAddress = useMemo(
    () => sendCoinPayload?.to, // payinAddress from changelly
    [sendCoinPayload]
  );


  const firstItemWallet = useMemo(() => {
    if (firstCoinSelected) {
      return {
        ...firstCoinSelected,
        coin_data: {
          ...firstCoinSelected?.coin_data,
          wallet_data: {
            ...firstCoinSelected?.coin_data?.wallet_data,
            balance: userBal,
          }
        },
        balance: userBal,
        is_token: firstCoinSelected?.coin_data?.is_token,
      };
    }
    return {};
  }, [firstCoinSelected, userBal]);
  // from selected coin or token wallet data
  const itemWallet = useMemo(() => {
    return { ...firstItemWallet?.coin_data };
  }, [firstItemWallet]);



  useEffect(() => {
    if (isVisible) {
      getDataWallet();
      navigation.addListener("didFocus", () => {
        getDataWallet();
      });
    }
  }, [isVisible])
  useEffect(() => {
    if (isVisible) {
      navigation.addListener("didFocus", () => {
        setShowtooltip(true);
      });

      navigation.addListener("didBlur", () => {
        _scrollToTop();
        setShowtooltip(false);
        resetAllStates();
      });

      // this event is handled when user moves the app to background
      EventRegister.addEventListener(Constants.DOWN_MODAL, () => {
        setShowtooltip(false);
        setFirstModal(false);
        setSecondModal(false);
        setTimeout(() => {
          setShowtooltip(true)
        }, 100);

      });
    }

  }, [isVisible]);

  const getCoinsApiData = async (ids) => {


    const apiData = {
      "addresses": [
        Singleton.getInstance().defaultEthAddress,
        Singleton.getInstance().defaultBtcAddress,
        Singleton.getInstance().defaultTrxAddress,
        Singleton.getInstance().defaultSolAddress,
      ],
      "id": ids,
      "is_wallet": false,
      "fiat_type": Singleton.getInstance().CurrencySelected
    };
    // consoleLogFunc("getData apiData ----", apiData);
    return apiData;
  };


  const getDataWallet = async () => {
    try {
      setLoading(true);
      const lastSelectedCoins = await getLastSelectedCoins()
      consoleLogFunc("lastSelectedCoins>>>>", lastSelectedCoins);

      const apiData = await getCoinsApiData([lastSelectedCoins?.from, lastSelectedCoins?.to]);

      dispatch(getCrossChainLastPair(apiData))
        .then(res => {
          const firstToken = res?.find(item => item?.coin_data?.coin_id == lastSelectedCoins?.from)
          const secondToken = res?.find(item => item?.coin_data?.coin_id == lastSelectedCoins?.to)
          setFirstCoinSelected(firstToken);
          setSecondCoinSelected(secondToken);
          getSwapInfo(firstToken, secondToken);
          getUserBalanceFunction(firstToken?.coin_data)
          fetchNativeFunction(firstToken?.coin_data?.coin_family)


        })
        .catch(err => {
          setLoading(false);
        })
    } catch (error) {
      consoleLogFunc("getData error ----", error);
      setLoading(false);
    } finally {
      // setLoading(false);
    }
  };

  const getLastSelectedCoins = async () => {
    try {
      const address = Singleton.getInstance().defaultEthAddress || Singleton.getInstance().defaultBnbAddress
      const result = await getData(Constants.CROSS_CHAIN_LAST_PAIRS)
      const data = JSON.parse(result)
      return { from: data?.[address]?.from || "1", to: data?.[address]?.to || "2" }
    } catch (error) {
      return { from: "1", to: "2" }
    }
  }

  const saveLastSelectedCoins = async (from, to) => {
    const address = Singleton.getInstance().defaultEthAddress || Singleton.getInstance().defaultBnbAddress
    let data = await getData(Constants.CROSS_CHAIN_LAST_PAIRS)
    data = data ? JSON.parse(data) : {}
    const savedCoin = JSON.stringify({ ...data, [address]: { from, to } })
    consoleLogFunc("savedCoin>>>>", savedCoin);
    saveData(Constants.CROSS_CHAIN_LAST_PAIRS, savedCoin)
  }

  const getUserBalanceFunction = (item) => {
    return new Promise((resolve, reject) => {
      const data = {
        wallet_address: getAddress(item?.coin_family),
        coin_id: item?.coin_id,
      };
      consoleLogFunc("data>>>>", data);

      dispatch(getUserBalance({ data }))
        .then((res) => {
          consoleLogFunc("BALANCE>>>>", res);
          setUserBal(res);
        }).catch(err => {
        })
    })
  }


  const fetchNativeFunction = (coinFamily) => {
    let data = {
      fiat_currency: Singleton.getInstance().CurrencySelected,
      coin_family: coinFamily,
    };

    consoleLogFunc("DATA>>>>>>>", data);

    dispatch(fetchNativePrice({ data }))
      .then((res) => {
        setNativeFaitValue(toFixedExp(res?.fiatCoinPrice?.value, 2))
        consoleLogFunc("chk res native price:::::", res);
      })
      .catch((err) => {
        consoleLogFunc("chk err native price:::::", err);
      });
  }



  const getSwapInfo = (tokenFirst, tokenSecond) => {
    setLoading(true);
    dispatch(getSwapCoinInfo({ depositCoinCode: tokenFirst?.coinCode, receiveCoinCode: tokenSecond?.coinCode }))
      .then(res => {
        setCoinInfoSwap(res?.data);
        setLoading(false);
        saveLastSelectedCoins(tokenFirst?.coin_data?.coin_id, tokenSecond?.coin_data?.coin_id)
      })
      .catch(err => {
        setLoading(false);
      });
  }



  const resetAllStates = (isResetSwapInfo = true) => {
    consoleLogFunc("resetAllStates ------");
    Keyboard.dismiss();
    setFromAmt("");
    setToAmt("");
    setButtonTxt("Swap");
    setSelectedIndex(null);
    showConfirmTxnModal(false);
    showAlertDialogNew(false)
    if (isResetSwapInfo) {
      setCoinInfoSwap({});
    }
  };

  /******************************************************************************************/
  const _scrollToTop = () => {
    if (scrollRef !== null) {
      if (scrollRef.current !== null) {
        scrollRef.current?.scrollTo({ x: 0, y: 0, animated: true });
      }
    }
  };

  const openFirstCoinList = () => {
    setFirstModal(true);
  };

  const onFirstListItemSelected = async (item, index) => {
    setFirstModal(false);
    resetAllStates()
    setFirstCoinSelected(item)
    getSwapInfo(item, secondCoinSelected);
    getUserBalanceFunction(item?.coin_data)
    fetchNativeFunction(item?.coin_data?.coin_family)
  };

  const onSamePair = () => {
    setFirstModal(false);
    setSecondModal(false);
    onError("From and To coin can't be same.")
  }

  const onError = (err) => {
    if (err == "Please check your network connection") {
      setAlertTxt(alertMessages.pleaseCheckYourNetworkConnection);
      showAlert ? showAlertDialogNew(true) : showAlertDialogNew(false);
    }
    const errorMsg =
      typeof err == "string" ? err : err?.message || err?.data?.message;
    showAlertDialogNew(true);
    setAlertTxt(errorMsg);
  };

  /****************************** update First List ****************************** */

  const changeTimer = useRef(null);
  const onChangeNo = (val) => {
    setFromAmt(val);
    // clearing the selected options
    setSelectedIndex(null);

    if (val.length == 0) {
      // reset values
      return;
    }

    if (changeTimer.current) {
      clearTimeout(changeTimer.current);
      changeTimer.current = null;
    }

    changeTimer.current = setTimeout(() => {
      Keyboard.dismiss();
      setFromAmt(val);
      getExchangeVals({ fromAmt: val, });
    }, 1000);
  };

  const getExchangeVals = async ({ fromAmt }) => {
    setToAmt("");
    const tempCoinInfo = coinInfoSwap;
    let instantRate = tempCoinInfo?.instantRate;
    let receiveCoinFee = tempCoinInfo?.receiveCoinFee;
    let convertedAmount = fromAmt * instantRate;
    convertedAmount = (convertedAmount * 99.7) / 100;
    consoleLogFunc("convertedAmount111>>>", convertedAmount,);
    // convertedAmount = convertedAmount - receiveCoinFee;
    consoleLogFunc("convertedAmount111>>>", convertedAmount,);
    convertedAmount = convertedAmount <= 0 ? "" : toFixedExp(convertedAmount, 6);
    consoleLogFunc("convertedAmount>>>", convertedAmount);
    setToAmt(`${convertedAmount}`);
    setButtonTxt("Swap");
  };

  const onPressToggle = async () => {
    try {
      if (secondCoinSelected?.coin_data?.wallet_data) {
        setLoading(true);
        resetAllStates();
        const tempFirst = {
          ...secondCoinSelected,
        };
        const tempSecond = {
          ...firstCoinSelected,
        };
        setFirstCoinSelected(tempFirst);
        setSecondCoinSelected(tempSecond);



        getSwapInfo(tempFirst, tempSecond);
        getUserBalanceFunction(tempFirst?.coin_data)
        fetchNativeFunction(tempFirst?.coin_data?.coin_family)
      } else {
        showAlertDialogNew(true);
        setAlertTxt("Please enable this token in your wallet.");
      }

    } catch (error) {
      consoleLogFunc("onPressToggle onPressToggle ======",);
    }
  };

  const onSecondCoinPress = () => {
    setSecondModal(true);
  };

  const onSecondListItemSelected = async (item, index) => {
    setSecondModal(false);
    resetAllStates()
    setSecondCoinSelected(item)
    getSwapInfo(firstCoinSelected, item);
  };

  const onPressSlider = (item, index) => () => {
    setSelectedIndex(index);
    var percentVal = 0;
    setLoading(true);
    const data = {
      wallet_address: getAddress(firstCoinSelected?.coin_data?.coin_family),
      coin_id: firstCoinSelected?.coin_data?.coin_id,
    };
    consoleLogFunc("data-----", data);
    dispatch(getUserBalance({ data }))
      .then((res) => {
        consoleLogFunc(res, "datadatadatadata");
        const balance = res;
        setLoading(false);
        if (Number(balance) <= 0) {
          setAlertTxt(alertMessages.insufficientBalance);
          showAlertDialogNew(true);
          return;
        }
        if (item.key == 1) {
          percentVal = 0.25 * balance;
        } else if (item.key == 2) {
          percentVal = 0.5 * balance;
        } else if (item.key == 3) {
          percentVal = 0.75 * balance;
        } else if (item.key == 4) {
          consoleLogFunc("chkitemWallet::::::", firstItemWallet);
          if (firstItemWallet.is_token != 0) {
            percentVal = balance;
          } else {
            if (balance > 0) {
              consoleLogFunc("itemWallet -----", balance);
              percentVal = 0.9 * balance;
              consoleLogFunc("percentVal -----", percentVal);

              percentVal =
                percentVal > 0 ? toFixedExp(percentVal, 8).toString() : "0.00";
            } else {
              percentVal = "0.00";
            }
          }
        }
        if (
          parseFloat(toFixedExp(percentVal, 8)) >
          parseFloat(toFixedExp(balance, 8))
        ) {
          setButtonTxt(alertMessages.insufficientBalance);
        } else {
          setButtonTxt(swapText.swap);
        }
        consoleLogFunc("percentVal>>>", percentVal);

        const finalFromAmt = toFixedExp(percentVal, 8);
        setFromAmt(finalFromAmt);
        Keyboard.dismiss();
        getExchangeVals({ fromAmt: finalFromAmt });
      })
      .catch((err) => {
        consoleLogFunc("err-----", err);
        showAlertDialogNew(true);
        const errMsg =
        err?.message || (typeof err === 'string' ? err : JSON.stringify(err));
        setAlertTxt(errMsg);
        setLoading(false);
      });
  };

  /******************************************************************************************/
  const getAddress = (coinFamily) => {
    const address =
      coinFamily == 6
        ? Singleton.getInstance().defaultTrxAddress
        : coinFamily == 3
          ? Singleton.getInstance().defaultBtcAddress
          : coinFamily == 5
            ? Singleton.getInstance().defaultSolAddress
            : Singleton.getInstance().defaultEthAddress;
    return address;
  };


  const onSwapClicked = (hideModal) => {

    consoleLogFunc("chk itemWallet.balance::::::", firstItemWallet.balance);
    if (fromAmt?.length == 0 || fromAmt == 0) {
      showAlertDialogNew(true);
      setAlertTxt(alertMessages.pleaseEnterAmount);
      return;
    }
    // if (!firstItemWallet.balance || parseFloat(firstItemWallet.balance) <= 0) {
    //   showAlertDialogNew(true);
    //   setAlertTxt(alertMessages.insufficientBalance);
    //   setButtonTxt(alertMessages.insufficientBalance);
    //   return;
    // }
    // if (parseFloat(fromAmt) > parseFloat(firstItemWallet.balance)) {
    //   showAlertDialogNew(true);
    //   setAlertTxt(alertMessages.insufficientBalance);
    //   setButtonTxt(alertMessages.insufficientBalance);
    //   return;
    // }
    if (parseFloat(fromAmt) < parseFloat(coinInfoSwap.depositMin)) {
      showAlertDialogNew(true);
      setAlertTxt(alertMessages.minimumSwapAmount + roundToDecimal(coinInfoSwap.depositMin));
      return;
    }
    if (parseFloat(fromAmt) > parseFloat(coinInfoSwap.depositMax)) {
      showAlertDialogNew(true);
      setAlertTxt(alertMessages.maximumSwapAmount + roundToDecimal(coinInfoSwap.depositMax));
      return;
    }
    if (toAmt?.length == 0 || toAmt == 0) {
      showAlertDialogNew(true);
      setAlertTxt(alertMessages.cannotProceed);
      return;
    }

    const fromAmount =
      firstCoinSelected?.fiat_price_data?.value != undefined &&
      currencyFormat(
        firstCoinSelected?.fiat_price_data?.value * fromAmt,
        Constants.FIAT_DECIMALS
      );
    const receivedAmount =
      secondCoinSelected?.fiat_price_data?.value != undefined &&
      currencyFormat(
        secondCoinSelected?.fiat_price_data?.value * toAmt,
        Constants.FIAT_DECIMALS
      );
    const percVal = (parseFloat(receivedAmount) / parseFloat(fromAmount)) * 100;
    const diffVal = parseFloat(fromToAmtDiff) > 0 ? fromToAmtDiff : 0;
    if (
      parseFloat(percVal || 0) < parseFloat(diffVal) &&
      (!!hideModal ? false : priceImpactState)
    ) {
      setPairModalAlert(true);
      setLoading(false);
      return;
    }
    const data = {
      firstCoin: firstCoinSelected,
      depositAmt: fromAmt,
      receiveAmt: toAmt,
      userGets: toAmt,
      depositCoin: firstCoinSelected.coinCode,
      receiveCoin: secondCoinSelected.coinCode,
      refundAddress: getAddress(firstCoinSelected?.coin_data?.coin_family),
      destinationAddr: getAddress(secondCoinSelected?.coin_data?.coin_family),
    };
    consoleLogFunc("data===> ", data);
    setLoading(true);
    createSwapOrder(data);
  };

  const createSwapOrder = async (data) => {
    try {
      dispatch(accountExchange({
        depositCoinCode: data?.depositCoin,
        receiveCoinCode: data.receiveCoin,
        depositCoinAmt: data?.depositAmt,
        receiveCoinAmt: data?.receiveAmt,
        destinationAddr: data?.destinationAddr,
        refundAddr: data?.refundAddress
      }))
        .then((transactionRes) => {

          consoleLogFunc("createSwapOrder transactionRes --------", transactionRes);
          const result = transactionRes?.data;
          if (!result) {
            setLoading(false);
            // show error
            return;
          }

          const payload = {
            order_id: result?.orderId,
            to: result?.platformAddr,
            amount: result?.receiveCoinAmt,
            gas_price: result?.chainFee,
            swap_fee: result?.depositCoinFeeAmt,
          };


          const walletData = firstItemWallet?.coin_data
          consoleLogFunc("walletData -----", walletData);

          setCrossSwapData(data);
          setSendCoinPayload(payload);


          /******************************************************************************************/
          if (walletData.coin_family == 1 || walletData.coin_family == 4 || walletData?.coin_family == 7) {
            setTimeout(() => {
              generateFeesAndNonceBnb(walletData, walletData.coin_family);
            }, 200);
          }
          /******************************************************************************************/
          if (walletData.coin_family == 2) {
            setTimeout(() => {
              getGasLimit(walletData)
            }, 200);
          }
          /******************************************************************************************/
          if (walletData.coin_family == 3) {
            setTimeout(() => {
              getbtcFeesAndUnspentTransaction(walletData);
            }, 200);
          }

          /******************************************************************************************/
          if (walletData.coin_family == 5) {
            setTimeout(() => {
              getSolanaFees(walletData,);
            }, 200);
          }
          /******************************************************************************************/
          if (walletData.coin_family == 6) {
            setTimeout(() => {
              getTronFees(walletData)
            }, 200);
          }


        }).catch((err) => {

        });


    } catch (error) {
      setLoading(false);
      consoleLogFunc("createSwapOrder error =======", error);
      onError(error?.data?.error || error)
    }
  };

  ///*****************************ETH GAS ESTIMATION AND PRICE*************************************////
  const getGasLimit = (walletData) => {
    let gasEstimationReq = {
      from: Singleton.getInstance().defaultEthAddress,
      to: Singleton.getInstance().defaultEthAddress,
      amount: "",
    };
    getDataFromStorage(Constants.ACCESS_TOKEN).then((token) => {
      dispatch(
        requestGasEstimation({
          url: `ethereum/${walletData.is_token == 0
            ? walletData.coin_symbol
            : walletData.token_address
            }/gas_estimation`,
          coinSymbol: walletData.coin_symbol,
          gasEstimationReq,
          token,
        })
      )
        .then((res1) => {
          consoleLogFunc("chk gasEstimate res:::::", res1);
          getTotalFee(res1?.gas_estimate);
        })
        .catch((e) => {
          setLoading(false);
          showAlertDialogNew(true);
          setAlertTxt(e);
        });
    });
  };

  /******************************************************************************************/
  const getTotalFee = (gasLimit = 23000) => {
    setLoading(true);
    setTimeout(async () => {
      const Totalfee = await getTotalGasFee();
      const value = exponentialToDecimal(
        Totalfee * gasFeeMultiplier * gasLimit
      );
      consoleLogFunc(" value:::::", value);
      const fee =
        Constants.network == "testnet"
          ? parseFloat(value).toFixed(8)
          : parseFloat(value).toFixed(8);
      setGasEstimate(gasLimit);
      setGasPrice(Totalfee?.toString());
      setTotalFee(fee);
      consoleLogFunc("curr scene:::::", Actions.currentScene);
      (Actions.currentScene == "_Swap" || Actions.currentScene == "Swap") &&
        showConfirmTxnModal(true);
      setLoading(false);
    }, 100);
  };

  /************************************** Get ETH Fee *****************************************/
  const getTotalGasFee = async () => {
    // const totalgasPrice = await web3Eth.eth.getGasPrice();
    const totalgasPrice = await provider.getGasPrice();
    consoleLogFunc("chk totalgasPrice::::::", totalgasPrice);
    return totalgasPrice;
  };
  ///*****************************SOL GAS ESTIMATION AND PRICE*************************************////
  const getSolanaFees = (walletData) => {
    setTotalFee("0.000005");
    setLoading(false);
    (Actions.currentScene == "_Swap" || Actions.currentScene == "Swap") && showConfirmTxnModal(true);
  };
  ///*****************************TRX GAS ESTIMATION AND PRICE*************************************////
  const getTronFees = (walletData) => {
    getData(Constants.ACCESS_TOKEN).then((token) => {
      const gasEstimationReq = {
        to_address: platformAddress,
        from_address: Singleton.getInstance().defaultTrxAddress,
        amount: fromAmt
      };
      dispatch(requestGasEstimation({
        url: `tron/${walletData?.is_token == 0 ? walletData?.coin_symbol?.toLowerCase() : walletData?.token_address
          }/gas_estimation`,
        gasEstimationReq,
        token,
      }))
        .then((res) => {
          setTotalFee(res?.data?.trx);
          (Actions.currentScene == "_Swap" || Actions.currentScene == "Swap") && showConfirmTxnModal(true);
          setLoading(false);
        })
        .catch((e) => {
          consoleLogFunc("ERR>>", e);
          setLoading(false);
          showAlertDialogNew(true);
          setAlertTxt(e);
        });
    });
  };


  ///*****************************BNB GAS ESTIMATION AND PRICE*************************************////
  const generateFeesAndNonceBnb = (walletData, coinFamily) => {
    let gasEstimationReq = {
      from: Singleton.getInstance().defaultBnbAddress,
      to: Singleton.getInstance().defaultBnbAddress,
      amount: "",
    };
    let nonceReq = { amount: "" };
    const endpoint = coinFamily == 1 ? "binancesmartchain" : coinFamily == 7 ? "qubetics" : "polygon";
    getDataFromStorage(Constants.ACCESS_TOKEN).then((token) => {
      dispatch(
        requestGasEstimation({
          url: `${endpoint}/${walletData.is_token == 0
            ? walletData.coin_symbol
            : walletData.token_address
            }/gas_estimation`,
          coinSymbol: walletData.coin_symbol,
          gasEstimationReq,
          token,
        })
      )
        .then((res1) => {
          consoleLogFunc("chk gasEstimate res:::::", res1);
          if (res1?.status) {
            let gasEstimate = res1?.gas_estimate;
            if (coinFamily == 7 || coinFamily == 4 ) {
              gasEstimate = gasEstimate + 10000;
            }
            if (res1?.resultList == undefined && res1?.gas_price != undefined) {
              consoleLogFunc("res1>>>>>", 'HAS VLAUE');
              res1 = {
                ...res1,
                resultList: {
                  safe_gas_price: res1.gas_price,
                  propose_gas_price: res1.gas_price,
                  fast_gas_price: res1.gas_price,
                },
              };
            }
            const mediumGasPrice =
              Constants.network == "testnet"
                ? 10 * 10 ** 9
                : parseFloat(res1?.resultList?.propose_gas_price) * 10 ** 9;
            const feeIs = toFixedExp(
              mediumGasPrice * res1?.gas_estimate * gasFeeMultiplier,
              8
            );
            consoleLogFunc("mediumGasPrice>>>", res1, mediumGasPrice);

            //  ---------------------------------------------- nonce APi -------------------------------------------------------
            dispatch(
              requestNonce({
                url: `${endpoint}/${walletData.is_token == 0
                  ? walletData.coin_symbol
                  : walletData.token_address
                  }/nonce`,
                coinSymbol: walletData.coin_symbol,
                nonceReq,
                token,
              })
            )
              .then((res2) => {
            consoleLogFunc("nonce>>>", res2?.data?.nonce);

                // setGasEstimate(res1?.gas_estimate);
                setGasEstimate(gasEstimate);

                setTotalFee(feeIs);
                setGasPrice(mediumGasPrice);
                setNonce(res2?.data?.nonce);
                (Actions.currentScene == "_Swap" ||
                  Actions.currentScene == "Swap") &&
                  showConfirmTxnModal(true);
                setLoading(false);
              })
              .catch((e) => {
                console.log('e---', e);

                setLoading(false);
                showAlertDialogNew(true);
                setAlertTxt(e);
              });
          } else {
            setLoading(false);
            showAlertDialogNew(true);
            setAlertTxt(res1?.message);
            return;
          }
        })
        .catch((e) => {
          console.log('e--1-', e);

          setLoading(false);
          showAlertDialogNew(true);
          setAlertTxt(e);
        });
    });
  };

  //*****************************BITCOIN GAS ESTIMATION AND PRICE*************************************//
  const getbtcFeesAndUnspentTransaction = (walletData) => {
    inputCount = 0;
    inputs = [];
    /******************************get btc fees****************************** */
    dispatch(requestBTCgasprice())
      .then((gasRes) => {
        consoleLogFunc("chk btc gas price res::::", gasRes);
        if (gasRes.regular) {
          setSliderValue(gasRes.priority);
        } else {
          setSliderValue(50);
        }
        /******************************get unspent transaction****************************** */
        getDataFromStorage(Constants.ACCESS_TOKEN).then((token) => {
          dispatch(
            requestUnspent(
              Singleton.getInstance().defaultBtcAddress,
              token,
              walletData.coin_symbol
            )
          )
            .then((res) => {
              consoleLogFunc("-----res");
              totalAmountAvailable = 0;
              res.data.forEach(async (element) => {
                let utxo = {};
                utxo.satoshis = Math.floor(Number(element.satoshis));
                utxo.script = element.scriptPubKey;
                utxo.address = element.address;
                utxo.txId = element.txid;
                utxo.outputIndex = element.vout;
                totalAmountAvailable += utxo.satoshis;
                inputCount += 1;
                inputs.push(utxo);
              });
              consoleLogFunc("------input", JSON.stringify(inputs));
              consoleLogFunc("------inputCount", inputCount);
              consoleLogFunc("------outputCount", outputCount);
              transactionSize =
                inputCount * 146 + outputCount * 34 + 10 - inputCount;

              setTotalFee(
                transactionSize * gasRes.priority * btcTosatoshiMultiplier
              );
              setTxnSize(transactionSize);
              setTotalAvlAmnt(totalAmountAvailable);
              setInput(inputs);
              (Actions.currentScene == "_Swap" ||
                Actions.currentScene == "Swap") &&
                showConfirmTxnModal(true);
              setLoading(false);
            })
            .catch((e) => {
              consoleLogFunc("-----e btc", e);
              setLoading(false);
            });
        });
      })
      .catch((e) => {
        setLoading(false);
      });
  };

  /**************************************************** generate Tron Raw ****************************************************/
  const SendTron = (address, pin) => {
    setLoading(true);
    setTimeout(async () => {
      try {
        let privateKey = await getEncryptedData(`${Singleton.getInstance().defaultTrxAddress}_pk`, pin);
        createTrxRaw(
          Singleton.getInstance().defaultTrxAddress,
          address,
          exponentialToDecimal(fromAmt),
          privateKey
        )
          .then((trxSignedRaw) => {
            privateKey = ""
            sendSerializedTxnTron(trxSignedRaw);
          })
          .catch((err) => {
            privateKey = ""
            consoleLogFunc("chk signed raw err::::::::::::trx", err);
            setLoading(false);
            showAlertDialogNew(true);
            const errMsg =
            err?.message || (typeof err === 'string' ? err : JSON.stringify(err));
            setAlertTxt(errMsg);
            // setAlertTxt(err);
          });


      } catch (error) {
        consoleLogFunc("chk signed raw error::::::::::::", error);
        setLoading(false);
      }
    }, 200);
  };

  /**************************************************** generate Trx Token Raw ****************************************************/
  const SendTRC20 = (address, pin) => {
    setLoading(true);
    setTimeout(async () => {
      const { decimals, token_address } = itemWallet;
      let privateKey = await getEncryptedData(`${Singleton.getInstance().defaultTrxAddress}_pk`, pin);
      createTrxTokenRaw(
        Singleton.getInstance().defaultTrxAddress,
        address,
        exponentialToDecimal(fromAmt * decimals),
        token_address,
        privateKey,
        feeLimit
      )
        .then((tokenRaw) => {
          privateKey = ""
          sendSerializedTxnTron(tokenRaw);
        })
        .catch((err) => {
          privateKey = ""
          consoleLogFunc("chk signed raw err::::::::::::trx20", err);
          showAlertDialogNew(true);
          const errMsg =
          err?.message || (typeof err === 'string' ? err : JSON.stringify(err));
          setAlertTxt(errMsg);
          // setAlertTxt(err);
          setLoading(false);
        });

    }, 200);
  };

  /**************************************************** sendSerializedTxnTron ****************************************************/
  const sendSerializedTxnTron = (tx_raw) => {
    setLoading(true);
    const { is_token, token_address, coin_symbol, coin_id } = itemWallet;
    setTimeout(() => {
      const sendCoinReq = {
        nonce: 0,
        tx_raw: tx_raw,
        from: Singleton.getInstance().defaultTrxAddress,
        to: platformAddress,
        amount: fromAmt,
        gas_estimate: "",
        gas_price: "",
        tx_type: "cross_chain",
        coin_id: coin_id,
        order_id: sendCoinPayload?.order_id, // additional params
        swap_fee: sendCoinPayload?.swap_fee, // additional params
      };
      consoleLogFunc("sendCoinReq::::", sendCoinReq);
      dispatch(
        requestSendCoin({
          url: `tron/${is_token == 0 ? coin_symbol?.toLowerCase() : token_address}/send`,
          coinSymbol: coin_symbol,
          sendCoinReq,
        })
      )
        .then((res) => {
          Actions.pop();
          Actions.currentScene != "TransactionHistory" &&
            Actions.TransactionHistory({
              selectedCoin: {
                ...itemWallet,
                wallet_address: itemWallet?.wallet_data?.wallet_address,
                currentPriceInMarket: itemWallet?.fiat_price_data?.value,
                price_change_percentage_24h: itemWallet?.fiat_price_data?.price_change_percentage_24h,
              },
            });
          setLoading(false);
        })
        .catch((e) => {
          setLoading(false);
          showAlertDialogNew(true);
          setAlertTxt(e);
        });
    }, 100);
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
    userToken
  ) => {
    const sendCoinReq = {
      nonce: nonce,
      tx_raw: `${tx_raw}`,
      from: myAddress,
      to: toAddress,
      amount: amount,
      gas_estimate: gasEstimate,
      eth_gas_price: gas_gwei_price,
      tx_type: "cross_chain",
      order_id: sendCoinPayload?.order_id, // additional params
      swap_fee: sendCoinPayload?.swap_fee, // additional params
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
        setLoading(false);
        Actions.pop();
        Actions.currentScene != "TransactionHistory" &&
          Actions.TransactionHistory({
            selectedCoin: {
              ...itemWallet,
              wallet_address: itemWallet?.wallet_data?.wallet_address,
              currentPriceInMarket: itemWallet?.fiat_price_data?.value,
              price_change_percentage_24h: itemWallet?.fiat_price_data?.price_change_percentage_24h,
            },
          });
      })
      .catch((e) => {
        setLoading(false);
        showAlertDialogNew(true);
        setAlertTxt(e || alertMessages.failedtoInitiateTransaction);
      });
  };

  /******************************BTC RAW GENERATION****************************** */
  const sendBtc = async (pin) => {
    let privateKey = await getEncryptedData(`${Singleton.getInstance().defaultBtcAddress}_pk`, pin);
    let fee = txnSize * SliderValue;
    consoleLogFunc("----fee", fee);
    consoleLogFunc(txnSize, "----transactionSize", transactionSize);
    consoleLogFunc("----SliderValue", SliderValue);
    consoleLogFunc(totalAvlAmnt, "----totalAmountAvailable", totalAmountAvailable);
    consoleLogFunc("----eee", Math.round(fromAmt * btcTosatoshi));
    if (totalAvlAmnt - Math.round(fromAmt * btcTosatoshi) - fee < 0) {
      setLoading(false);
      showAlertDialogNew(true);
      setAlertTxt(alertMessages?.balancetooLowforThisTransaction);
      return;
    }
    setLoading(true);
    setTimeout(async () => {
      let serializedTransaction;
      try {
        const transaction = new bitcore.Transaction();
        transaction.from(input);
        transaction.to(platformAddress, Math.round(fromAmt * btcTosatoshi));
        transaction.change(Singleton.getInstance().defaultBtcAddress);
        transaction.fee(fee);
        transaction.sign(privateKey);
        serializedTransaction = transaction.serialize();

      } catch (e) {
        consoleLogFunc(e);
        setLoading(false);
        showAlertDialogNew(true);
        setAlertTxt(alertMessages?.failedtoInitiateTransaction);
        return;
      }
      getDataFromStorage(Constants.ACCESS_TOKEN)
        .then((token) => {
          sendSerializedTxnBTC(
            0,
            serializedTransaction,
            Singleton.getInstance().defaultBtcAddress,
            platformAddress,
            fromAmt,
            gasEstimate,
            gasPrice,
            itemWallet?.coin_symbol,
            token
          );
          privateKey = ""
        })
        .catch((err) => {
          privateKey = ""
          setLoading(false);
          showAlertDialogNew(true);
          setAlertTxt(alertMessages?.failedtoInitiateTransaction);
        });
    }, 200);
  };

  /**************************************************** send  SOLA  ****************************************************/

  const sendSol = async (pin, isToken) => {

    getEncryptedData(Singleton.getInstance().defaultSolAddress, pin).then((res) => {
      let mnemonics = res
      setLoading(true);
      if (isToken) {
        //itemWallet.token_address

        let amount = fromAmt * itemWallet?.decimals
        if (amount.toString().includes(".")) {
          amount = amount.toString().split(".")[0]
        }
        sendTokenSOLANA(platformAddress, amount, mnemonics, itemWallet?.token_address, itemWallet?.decimals)
          .then((res) => {
            // mnemonics = ""
            consoleLogFunc("res sendSOLANA", res);
            saveSolTransaction(itemWallet?.token_address, res)
          })
          .catch((err) => {
            // mnemonics = ""
            setLoading(false);
            consoleLogFunc("err sendSOLANA", err);
          })
      } else {
        sendSOLANA(platformAddress, fromAmt, mnemonics)
          .then((res) => {
            // mnemonics = ""
            consoleLogFunc("res sendSOLANA", res);
            saveSolTransaction("sol", res)
          })
          .catch((err) => {
            // mnemonics = ""
            setLoading(false);
            consoleLogFunc("err sendSOLANA", err);
          })
      }
    })
  }

  const saveSolTransaction = (coin, transactionId) => {
    let data = {
      amount: fromAmt,
      gas_price: 0.000005,
      from: Singleton.getInstance().defaultSolAddress,
      txid: transactionId,
      to: platformAddress,
      tx_type: "cross_chain",
      tx_status: "Complete",
      order_id: sendCoinPayload?.order_id, // additional params
    }
    dispatch(saveSolTransactionId(coin, data))
      .then((res) => {
        consoleLogFunc("res saveSolTransactionId", res);
        setLoading(false);
        Actions.currentScene != "TransactionHistory" &&
          Actions.TransactionHistory({
            selectedCoin: {
              ...itemWallet,
              wallet_address: itemWallet?.wallet_data?.wallet_address,
              currentPriceInMarket: itemWallet?.fiat_price_data?.value,
              price_change_percentage_24h: itemWallet?.fiat_price_data?.price_change_percentage_24h,
            },
          });
      })
      .catch((err) => {
        consoleLogFunc("err saveSolTransactionId", err);
        setLoading(false);


      })
  }


  /**************************************************** send  BNB APi  ****************************************************/
  const sendSerializedTxnBNB = (tx_raw, coinFamily) => {
    let sendCoinReq = {
      nonce: nonce,
      tx_raw: tx_raw,
      from: Singleton.getInstance().defaultBnbAddress,
      to: platformAddress,
      amount: fromAmt,
      gas_estimate: gasEstimate,
      gas_price: gasPrice,
      tx_type: "cross_chain",
      order_id: sendCoinPayload?.order_id, // additional params
      swap_fee: sendCoinPayload?.swap_fee, // additional params
    };
    consoleLogFunc("sendCoinReq::::", sendCoinReq);
    const endpoint = coinFamily == 1 ? "binancesmartchain" : coinFamily == 7 ? "qubetics" : "polygon";

    dispatch(
      requestSendCoin({
        url: `${endpoint}/${itemWallet?.is_token == 0 ? itemWallet?.coin_symbol : itemWallet?.token_address}/send`,
        coinSymbol: itemWallet?.coin_symbol,
        sendCoinReq,
      })
    )
      .then((res) => {
        setLoading(false);
        Actions.pop();
        Actions.currentScene != "TransactionHistory" &&
          Actions.TransactionHistory({
            selectedCoin: {
              ...itemWallet,
              wallet_address: itemWallet?.wallet_data?.wallet_address,
              currentPriceInMarket: itemWallet?.fiat_price_data?.value,
              price_change_percentage_24h: itemWallet?.fiat_price_data?.price_change_percentage_24h,
            }
          });
      })
      .catch((e) => {
        console.log('e--2-', e);

        setLoading(false);
        showAlertDialogNew(true);
        setAlertTxt(e);
      });
  };

  /********************************************** generate Bnb Raw ****************************************************/
  const sendBscPol = (pin, coinFamily) => {
    setLoading(true);
    setTimeout(async () => {
      let privateKey = await getEncryptedData(`${Singleton.getInstance().defaultBnbAddress}_pk`, pin);

      const chainId = coinFamily == 1 ? 56 : 137;
      getBnbRaw(
        fromAmt,
        platformAddress,
        nonce,
        gasPrice,
        gasEstimate,
        chainId,
        privateKey
      )
        .then((txn_raw) => {
          privateKey = ""
          sendSerializedTxnBNB(txn_raw, coinFamily);
        })
        .catch((err) => {
          privateKey = ""
          setLoading(false);
          showAlertDialogNew(true);
          const errMsg =
          err?.message || (typeof err === 'string' ? err : JSON.stringify(err));
          setAlertTxt(errMsg);
          // setAlertTxt(err);
        });
    }, 200);
  };



  /********************************************** generate Bnb Token Raw  ****************************************************/
  const sendBscPolToken = (pin, coinFamily) => {
    setLoading(true);
    setTimeout(async () => {
      let privateKey = await getEncryptedData(`${Singleton.getInstance().defaultBnbAddress}_pk`, pin);
      const chainID = coinFamily == 1 ? 56 : 137;
      consoleLogFunc('fdefd>>>>>>', fromAmt, itemWallet);

      const BigNumber = require("bignumber.js")

      let a = new BigNumber(fromAmt);
      let b = new BigNumber(itemWallet.decimals);
      const amountToSend = a.multipliedBy(b).toString();
      bnbDataEncode(itemWallet?.token_address, platformAddress, amountToSend)
        .then((encodedData) => {
          consoleLogFunc("chk bep encoded Data::::::", encodedData);
          sendTokenBNB(
            itemWallet?.token_address,
            encodedData,
            nonce,
            gasPrice,
            gasEstimate,
            chainID,
            privateKey
          )
            .then((signedRaw) => {
              consoleLogFunc("chk bep signedRaw::::::", signedRaw);
              sendSerializedTxnBNB(signedRaw, coinFamily);
              privateKey = ""
            })
            .catch((err) => {
              privateKey = ""
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
  /********************************************** generate Tics Raw ****************************************************/
  const sendTics = (pin, coinFamily) => {
    console.log('INSIDE__SEND__TICS');

    setLoading(true);
    setTimeout(async () => {
      let privateKey = await getEncryptedData(`${Singleton.getInstance().defaultBnbAddress}_pk`, pin);

      const chainId = 9030
      console.log('INSIDE__SEND__TICS');

      getMaticRaw(
        fromAmt,
        platformAddress,
        nonce,
        gasPrice,
        gasEstimate,
        chainId,
        privateKey
      )
        .then((txn_raw) => {
          console.log('INSIDE__SEND__TICS', txn_raw);

          privateKey = ""
          sendSerializedTxnBNB(txn_raw, coinFamily);
        })
        .catch((err) => {
          privateKey = ""
          setLoading(false);
          showAlertDialogNew(true);
          const errMsg =
          err?.message || (typeof err === 'string' ? err : JSON.stringify(err));
          setAlertTxt(errMsg);
          // setAlertTxt(err);
        });
    }, 200);
  };

  /******************************************** Send ETH **********************************************/
  const sendSerializedTxn = (tx_raw, nonce) => {
    let sendCoinReq = {
      nonce: nonce,
      tx_raw: tx_raw,
      from: Singleton.getInstance().defaultEthAddress,
      to: platformAddress,
      amount: fromAmt,
      gas_estimate: gasEstimate,
      gas_price: gasPrice,
      tx_type: "cross_chain",
      order_id: sendCoinPayload?.order_id, // additional params
      swap_fee: sendCoinPayload?.swap_fee, // additional params
    };
    consoleLogFunc("sendCoinReq::::", sendCoinReq);
    dispatch(
      requestSendCoin({
        url: `ethereum/${itemWallet.is_token == 0
          ? itemWallet?.coin_symbol
          : itemWallet?.token_address
          }/send`,
        coinSymbol: itemWallet?.coin_symbol,
        sendCoinReq,
      })
    )
      .then((res) => {
        setLoading(false);
        Actions.pop();
        Actions.currentScene != "TransactionHistory" &&
          Actions.TransactionHistory({
            selectedCoin: {
              ...itemWallet,
              wallet_address: itemWallet?.wallet_data?.wallet_address,
              currentPriceInMarket: itemWallet?.fiat_price_data?.value,
              price_change_percentage_24h: itemWallet?.fiat_price_data?.price_change_percentage_24h,
            },
          });
      })
      .catch((e) => {
        console.log('e--3-', e);

        setLoading(false);
        showAlertDialogNew(true);
        setAlertTxt(e);
      });
  };

  /************************************** create RAW for eth family *****************************************/
  const sendEth = (pin) => {
    setLoading(true);
    setTimeout(async () => {
      let privateKey = await getEncryptedData(`${Singleton.getInstance().defaultEthAddress}_pk`, pin);

      createEthRaw(
        Singleton.getInstance().defaultEthAddress,
        platformAddress,
        privateKey,
        fromAmt,
        true
      )
        .then((ethSignedRaw) => {
          consoleLogFunc("ethSignedRaw:::::: ", ethSignedRaw);
          sendSerializedTxn(ethSignedRaw?.txn_hash, ethSignedRaw?.nonce);
          privateKey = ""
        })
        .catch((err) => {
          consoleLogFunc("chk signed raw err::::::::::::", err);
          privateKey = ""
          showAlertDialogNew(true);
          const errMsg =
          err?.message || (typeof err === 'string' ? err : JSON.stringify(err));
          setAlertTxt(errMsg);
          // setAlertTxt(err);
          setLoading(false);
        });
    }, 200);
  };

  /****************************************** generate Eth Token Raw ************************************************************/
  const sendERC20 = (pin) => {
    setLoading(true);
    setTimeout(async () => {
      let privateKey = await getEncryptedData(`${Singleton.getInstance().defaultEthAddress}_pk`, pin);

      const BigNumber = require("bignumber.js");
      let a = new BigNumber(fromAmt);
      let b = new BigNumber(itemWallet?.decimals);
      const amountToSend = a.multipliedBy(b).toString();
      EthDataEncode(itemWallet?.token_address, platformAddress, amountToSend)
        .then((encodedData) => {
          consoleLogFunc("chk encodedData::::", encodedData);
          CreateEthTokenRaw(
            Singleton.getInstance()?.defaultEthAddress,
            itemWallet?.token_address,
            privateKey,
            gasEstimate,
            encodedData
          )
            .then((tokenRaw) => {
              sendSerializedTxn(tokenRaw?.txn_hash, tokenRaw?.nonce);
              privateKey = ""
            })
            .catch((err) => {
              consoleLogFunc("chk signed raw err::::::::::::", err);
              privateKey = ""
              showAlertDialogNew(true);
              const errMsg =
              err?.message || (typeof err === 'string' ? err : JSON.stringify(err));
              setAlertTxt(errMsg);
              // setAlertTxt(err);
              setLoading(false);
            });
        })
        .catch((err) => {
          setLoading(false);
        });
    }, 200);
  };

  const onSwapConfirmed = (pin) => {
    consoleLogFunc('onSwapConfirmed =====',
      JSON.stringify(itemWallet),
      platformAddress,
      fromAmt,
      toAmt,
      sendCoinPayload ? JSON.stringify(sendCoinPayload) : sendCoinPayload
    )
    showConfirmTxnModal(false);
    if ((itemWallet?.coin_family == 1 || itemWallet?.coin_family == 4) && itemWallet?.is_token == 0) {
      sendBscPol(pin, itemWallet.coin_family);
    } else if ((itemWallet?.coin_family == 1 || itemWallet?.coin_family == 4) && itemWallet?.is_token == 1) {
      sendBscPolToken(pin, itemWallet.coin_family);
    }
    if (itemWallet?.coin_family == 2 && itemWallet?.is_token == 0) {
      consoleLogFunc("------------call ETH-------------");
      sendEth(pin);
    } else if (itemWallet?.coin_family == 2 && itemWallet?.is_token == 1) {
      consoleLogFunc("------------call ETH token-------------");
      sendERC20(pin, itemWallet?.coin_family);
    } else if (itemWallet?.coin_family == 3) {
      consoleLogFunc("------------call BTC-------------");
      sendBtc(pin);
    } else if (itemWallet?.coin_family == 5) {
      sendSol(pin, itemWallet?.is_token == 1);
    } else if (itemWallet?.coin_family == 6) {
      consoleLogFunc("------------call TRON-------------");
      itemWallet?.is_token == 0
        ? SendTron(platformAddress, pin)
        : SendTRC20(platformAddress, pin);
    }
    else if (itemWallet?.coin_family == 7) {
      sendTics(pin, itemWallet?.coin_family);
    }
  };

  if (!isVisible) {
    return <View />;
  }

  /******************************************************************************************/
  return (
    <View style={[styles.ViewStyle1]}>
      <ScrollView
        ref={scrollRef}
        bounces={false}
        showsVerticalScrollIndicator={false}
        style={{ flex: 1 }}
      >
        <View style={{ paddingVertical: 15, paddingHorizontal: 5 , backgroundColor:'red'}}>
          <SelectCurrencyAbstract/>

        </View>

      </ScrollView>


      {AlertDialogNew && (
        <AppAlert
          alertTxt={alertTxt}
          hideAlertDialog={() => {
            showAlertDialogNew(false);
          }}
        />
      )}
      <LoaderView isSwap={true} isLoading={isLoading} />
    </View>
  );
};

const styles = StyleSheet.create({
  imgStyle1: {
    alignSelf: "center",
    height: 39,
    width: 39,
  },
  ViewStyle2: {
    borderRadius: 12,
    paddingHorizontal: 15,
    paddingVertical: 15,
    marginTop: 10,
  },
  cardBgImg: {
    position: "absolute",
    width: "100%",
    height: "100%",
    borderRadius: 12,
  },
  textStyle: {
    fontSize: 16,
    // fontFamily: Fonts.dmMedium,
    borderBottomWidth: 1,
    paddingBottom: 5,
  },
  textStyle1: {
    fontSize: 14,
    // fontFamily: Fonts.dmRegular,
    marginTop: 10,
    width: "35%",
  },
  imgStyle: {
    height: 33,
    width: 33,
    borderRadius: 70,
    backgroundColor: "white",
  },
  absolute: {
    zIndex: 16,
    position: "absolute",
    elevation: 3,
    borderWidth: 2,
    borderRadius: 39,
    zIndex: 1,
    top: 130,
    alignSelf: "center",
  },
  ViewStyle1: {
    flex: 1,
    paddingTop: 8,
    paddingHorizontal: 16,
  },
  ViewStyle: {
    justifyContent: "flex-end",
    marginTop: (10),
    marginBottom: (30),
  },
  btnStyle: {
    paddingHorizontal: 20,
    position: "absolute",
    bottom: 0,
    width: "100%",
  },
  tokenItem: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  chip: {
    borderRadius: 20,
    paddingHorizontal: 25,
    paddingVertical: 6,
    borderWidth: 1,
    marginHorizontal: 4,
  },
  centeredView2: {
    flex: 1,
    backgroundColor: "white",
    justifyContent: "center",
    minHeight: "10%",
  },
  tokenImage_stylee: {
    alignSelf: "center",
    width: 35,
    height: 35,
    marginRight: 15,
    borderRadius: 25,
    alignSelf: "center",
    justifyContent: "center",
    alignItems: "center",
    textAlign: "center",
  },
  tokenAbr_stylee: {
    // fontFamily: Fonts.dmRegular,
    fontSize: 14,
  },
  tokenAbr_style: {
    // fontFamily: Fonts.dmRegular,
    fontSize: 14,
  },
  txtTitle: {
    fontSize: 14,
    // fontFamily: Fonts.dmRegular,
    marginTop: 5,
    marginBottom: 10,
  },

  txtView: {
    fontSize: 12,
    // fontFamily: Fonts.dmRegular,
    alignSelf: "center",
    textAlign: "center",
  },
  sliderView: {
    marginTop: (8),
    width: "100%",
    flexDirection: "row",
    justifyContent: "space-around",
  },
  tabsView: {
    justifyContent: "space-between",
    width: Dimensions.get("screen").width / 5.8,
    paddingVertical: 10,
    borderRadius: 14,
    alignItems: "center",
  },
  tabsViewNew: {
    // justifyContent: "space-between",
    // paddingHorizontal: 35,
    paddingVertical: 10,
    width: 80,
    borderRadius: 14,
  },
  tabViewNew1: {
    borderRadius: 14,
    height: 40,
    alignItems: "center",
    justifyContent: "center",

  },
  header: {
    paddingHorizontal: 20,
    marginTop: 20,
    marginBottom: 10,
    marginHorizontal: 20,
    padding: Platform.OS == "ios" ? 15 : 0,
    borderWidth: 1,
    borderRadius: 100,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  np_active_wallet_text: {
    textAlign: "center",
    letterSpacing: 0,
    fontSize: 12,
    // fontFamily: Fonts.dmMedium,
  },
  ViewStyle4: {
    flex: 1,
    marginBottom: 0,
  },
});
export default memo(ChainAbstractionSwap);

// import { View, Text } from 'react-native'
// import React from 'react'

// const CrossChain = () => {
//   return (
//     <View>
//       <Text>CrossChain</Text>
//     </View>
//   )
// }

// export default CrossChain