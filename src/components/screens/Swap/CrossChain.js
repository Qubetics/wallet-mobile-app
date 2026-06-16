import React, { memo, useEffect, useMemo, useRef, useState } from "react";
import {
  Dimensions,
  Image,
  Keyboard,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from "react-native";
import { EventRegister } from "react-native-event-listeners";
import LinearGradient from "react-native-linear-gradient";
import { Actions } from '../../../navigation/RootNavigation';
import { useDispatch } from "react-redux";
import Tooltip from "rn-tooltip";
import { LanguageManager } from "../../../../LanguageManager";
import { ThemeManager } from "../../../../ThemeManager";
import * as Constants from "../../../Constants";
import {
  accountExchange,
  fetchNativePrice,
  getCrossChainLastPair,
  getSwapCoinInfo,
  getUserBalance,
  requestBTCgasprice,
  requestGasEstimation,
  requestNonce,
  requestSendCoin,
  requestUnspent,
  saveSolTransactionId
} from "../../../Redux/Actions";
import Singleton from "../../../Singleton";
import { Colors, Fonts, Images } from "../../../theme";
import { roundToDecimal } from "../../../Utils";
import {
  bnbDataEncode,
  getBnbRaw,
  sendTokenBNB,
} from "../../../Utils/BscUtils";
import { getDappProvider } from "../../../Utils/etherProviderUtils";
import {
  CreateEthTokenRaw,
  EthDataEncode,
  createEthRaw,
} from "../../../Utils/EthUtils";
import { getMaticRaw } from "../../../Utils/MaticUtils";
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
import { sendSOLANA, sendTokenSOLANA } from "../../../Utils/SolUtils";
import { createTrxRaw, createTrxTokenRaw } from "../../../Utils/TronUtils";
import {
  AppAlert,
  Button,
  ConfirmSwapCrosschain,
  GradientBorderView,
  SelectCurrencyNew
} from "../../common";
import { ChangellyCoinList } from "../../common/ChangellyCoinList";
import { LoaderView } from "../../common/LoaderView";
import PriceImpactModal from "../../common/PriceImpactModal";
import EnterPinForTransaction from "../EnterPinForTransaction/EnterPinForTransaction";


const CrossChain = ({
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
      navigation.addListener('focus', () => {
        getDataWallet();
      });
    }
  }, [isVisible])
  useEffect(() => {
    if (isVisible) {
      navigation.addListener('focus', () => {
        setShowtooltip(true);
      });

      navigation.addListener('blur', () => {
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
      setToAmt("");
      setButtonTxt("Enter Amount");
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
    // Check if both amounts are 0 or empty
    if (convertedAmount <= 0 || convertedAmount === "" || parseFloat(fromAmt) <= 0) {
      setButtonTxt("Enter Amount");
    } else {
      setButtonTxt("Swap");
    }
    // setButtonTxt("Swap");
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
    consoleLogFunc("chk itemWallet.balance::::::", parseFloat(fromAmt), parseFloat(firstItemWallet.balance), parseFloat(fromAmt) > parseFloat(firstItemWallet.balance));
    consoleLogFunc("chk 111::::::", parseFloat(fromAmt));
    consoleLogFunc("chk 2222::::::", parseFloat(coinInfoSwap.depositMin));
    if (fromAmt?.length == 0 || fromAmt == 0) {
      showAlertDialogNew(true);
      setAlertTxt(alertMessages.pleaseEnterAmount);
      return;
    }
    if (!firstItemWallet.balance || parseFloat(firstItemWallet.balance) <= 0) {
      showAlertDialogNew(true);
      setAlertTxt(alertMessages.insufficientBalance);
      setButtonTxt(alertMessages.insufficientBalance);
      return;
    }
    if (parseFloat(fromAmt) > parseFloat(firstItemWallet.balance)) {
      showAlertDialogNew(true);
      setAlertTxt(alertMessages.insufficientBalance);
      setButtonTxt(alertMessages.insufficientBalance);
      return;
    }
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
    consoleLogFunc("SWAP   data===> ", data);
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
          consoleLogFunc("payload ----- TRANSACTION", payload);


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
            if (coinFamily == 7 || coinFamily == 4) {
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
                consoleLogFunc('e---', e);

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
          consoleLogFunc('e--1-', e);

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
    // setInput([]);
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
                consoleLogFunc("----element", element);
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
    consoleLogFunc("----input", input, '----platformAddress', platformAddress);

    if (totalAvlAmnt - Math.round(fromAmt * btcTosatoshi) - fee < 0) {
      consoleLogFunc('>>>>>>>>>>>');
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
        // transaction.addData(exchangeRes?.data?.btcMemo)
        transaction.sign(privateKey);
        serializedTransaction = transaction.serialize();

      } catch (e) {
        consoleLogFunc('ERROR === >>>', e);

        consoleLogFunc(e);
        setLoading(false);
        showAlertDialogNew(true);
        setAlertTxt(alertMessages?.failedtoInitiateTransaction);
        return;
      }
      consoleLogFunc('serializedTransaction---', serializedTransaction);
      consoleLogFunc('Singleton.getInstance().defaultBtcAddress---', Singleton.getInstance().defaultBtcAddress);
      consoleLogFunc('platformAddress---', platformAddress);
      consoleLogFunc('fromAmt---', fromAmt);
      consoleLogFunc('gasEstimate---', gasEstimate);
      consoleLogFunc('gasPrice---', gasPrice);
      consoleLogFunc('itemWallet?.coin_symbol---', itemWallet?.coin_symbol);

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
          consoleLogFunc('err--1-', err);

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

        consoleLogFunc("amount>>>>>>", amount);
        consoleLogFunc("itemWallet?.token_address>>>>>>", itemWallet?.token_address);
        consoleLogFunc("itemWallet?.decimals>>>>>>", itemWallet?.decimals);
        consoleLogFunc("platformAddress>>>>>>", platformAddress);

        sendTokenSOLANA(platformAddress, exponentialToDecimal(amount), mnemonics, itemWallet?.token_address, itemWallet?.decimals)
          .then((res) => {
            // mnemonics = ""
            consoleLogFunc("res sendSOLANA", res);
            saveSolTransaction(itemWallet?.token_address, res)
          })
          .catch((err) => {
            // mnemonics = ""
            setLoading(false);
            consoleLogFunc("err sendSOLANA", err);
            showErrorDialog(err);
            showErrorDialog("Unable to swap, Please try again.");
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
            showErrorDialog("Unable to swap SOLANA, Please try again.");
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
        showErrorDialog(err);

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
        consoleLogFunc('e--2-', e);

        setLoading(false);
        showErrorDialog(e);
      });
  };

  const showErrorDialog = (error) => {
    showAlertDialogNew(true);
    setAlertTxt(error);
  }

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
    consoleLogFunc('INSIDE__SEND__TICS');

    setLoading(true);
    setTimeout(async () => {
      let privateKey = await getEncryptedData(`${Singleton.getInstance().defaultBnbAddress}_pk`, pin);

      const chainId = 9030
      consoleLogFunc('INSIDE__SEND__TICS');

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
          consoleLogFunc('INSIDE__SEND__TICS', txn_raw);

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
        consoleLogFunc('e--3-', e);

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
        <View style={{ paddingVertical: 15, paddingHorizontal: 5 }}>
          <SelectCurrencyNew
            showRange={true}
            maxLength={15}
            item={firstItemWallet?.coin_data}
            tokenOneAmount={fromAmt}
            themeSelected={themeSelected}
            currency={
              firstCoinSelected
                ? firstCoinSelected?.coin_data?.coin_symbol?.toUpperCase()
                : ""
            }
            label=""
            placeholder="0.00"
            custStyle={{ textAlign: "right" }}
            balance={`${firstItemWallet?.balance
              ? toFixedExp(firstItemWallet?.balance, 6)
              : "0.00"
              } ${firstCoinSelected
                ? firstCoinSelected?.coin_data?.coin_symbol?.toUpperCase()
                : ""
              }`}
            min={
              coinInfoSwap ? roundToDecimal(coinInfoSwap?.depositMin) : "0.00"
            }
            max={
              coinInfoSwap ? roundToDecimal(coinInfoSwap?.depositMax) : "0.00"
            }
            onPressCoin={() => {
              openFirstCoinList();
            }}
            value={fromAmt}
            onChangeNumber={(value) => {
              const onlyNumberRegex = /^\d*\.?\d*$/;
              if (onlyNumberRegex.test(value)) {
                onChangeNo(value);
              }
            }}
          />

          <View style={{ marginTop: (16) }}>
            <TouchableOpacity
              onPress={onPressToggle}
              style={[{
                alignSelf: "center"
              }
              ]}
            >
              <Image
                source={ThemeManager.ImageIcons.toggle}
                style={{ alignSelf: "center", resizeMode: "contain" }}
              />
            </TouchableOpacity>
            <SelectCurrencyNew
              inputandselectStyle={{ marginTop: (13) }}
              item={secondCoinSelected?.coin_data}
              tokenOneAmount={roundToDecimal(toAmt, 10)}
              styleImg={{ height: 28, width: 28 }}
              themeSelected={themeSelected}
              currency={
                secondCoinSelected
                  ? secondCoinSelected?.coin_data?.coin_symbol?.toUpperCase()
                  : ""
              }
              balance={`${seconditemWallet?.balance
                ? toFixedExp(seconditemWallet?.balance, 6)
                : "0.00"
                } ${secondCoinSelected
                  ? secondCoinSelected?.coin_data?.coin_symbol?.toUpperCase()
                  : ""
                }`}
              label={browser.to}
              placeholder="0.00"
              editable={false}
              onPressCoin={onSecondCoinPress}
              value={toAmt == "" ? toAmt : roundToDecimal(toAmt, 10).toString()}
            />


          </View>
          <View style={styles.sliderView}>
            {tabData.map((item, index) => (
              <TouchableOpacity
                key={index + ""}
                style={[styles.tabsView, { marginTop: 20 }]}
                onPress={onPressSlider(item, index)}
              >
                {selectedIndex == index ? <LinearGradient
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  colors={
                    selectedIndex == index ? ["#73C9E2", "#6C8DC5", "#6456B2", "#6145EA"] : [ThemeManager.colors.mnemonicsBg, ThemeManager.colors.mnemonicsBg]
                  }

                  style={styles.tabsView}
                >
                    <Text
                      allowFontScaling={false}
                      style={{
                        color:
                          selectedIndex == index
                            ? ThemeManager.colors.Mainbg
                            : ThemeManager.colors.TextColor,
                        fontSize: 16,
                        fontFamily: Fonts.dmSemiBold,
                      }}
                    >
                      {item.title}
                    </Text>
                </LinearGradient> :
                  <GradientBorderView
                    mainStyle={[styles.tabsView]}
                  >
                    <Text
                      allowFontScaling={false}
                      style={{
                        color: selectedIndex === index
                          ? ThemeManager.colors.blackWhiteText
                          : ThemeManager.colors.TextColor,
                        fontSize: 16,
                        fontFamily: Fonts.dmSemiBold,
                      }}
                    >
                      {item.title}
                    </Text>
                  </GradientBorderView>
                }
              </TouchableOpacity>
            ))}
          </View>
          {isRelayerFeeGreater && (
            <Text
              allowFontScaling={false}
              style={[
                styles.textStyle1,
                { color: Colors.lossColor, width: "100%" },
              ]}
            >
              {swapText.convertedAmountIsLesserThanRelayerFee}
            </Text>
          )}
        </View>

        {coinInfoSwap && coinInfoSwap?.instantRate && toAmt != "" && (
          <View
            style={[styles.ViewStyle2, { backgroundColor: ThemeManager.colors.mnemonicsBg }]}
          >
            <Text
              allowFontScaling={false}
              style={[
                styles.textStyle,
                {
                  color: ThemeManager.colors.greenWhite,
                  borderBottomColor: ThemeManager.colors.underLineColor,
                },
              ]}
            >
              {detailTrx.transactionDetails}
            </Text>

            <View
              style={{ flexDirection: "row", justifyContent: "space-between" }}
            >
              <Text
                allowFontScaling={false}
                style={[
                  styles.textStyle1,
                  { color: ThemeManager.colors.lightGrayTextColor },
                ]}
              >
                {swapText.estimatedRate}
              </Text>
              <Text
                allowFontScaling={false}
                style={[
                  styles.textStyle1,
                  {
                    width: "60%",
                    textAlign: "right",
                    color: ThemeManager.colors.TextColor,
                  },
                ]}
              >
                1 {firstCoinSelected?.coin_data?.coin_symbol?.toUpperCase()} ≈{" "}
                {toFixedExp(coinInfoSwap?.instantRate, 6)}{" "}
                {secondCoinSelected?.coin_data?.coin_symbol?.toUpperCase()}
              </Text>
            </View>

            <View
              style={{ flexDirection: "row", justifyContent: "space-between" }}
            >
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  marginTop: 6,
                }}
              >
                <Text
                  allowFontScaling={false}
                  style={[
                    {
                      fontSize: 14,
                      // fontFamily: Fonts.dmRegular,
                      color: ThemeManager.colors.lightGrayTextColor,
                    },
                  ]}
                >
                  {swapText.serviceFee}
                </Text>
                {showtooltip ? (
                  <Tooltip
                    ref={tooltipRef}
                    overlayColor={"#00000077"}
                    backgroundColor={ThemeManager.colors.contactBg}
                    width={250}
                    height={65}
                    popover={
                      <Text
                        allowFontScaling={false}
                        style={{
                          fontSize: 14,
                          // fontFamily: Fonts.dmRegular,
                          color: ThemeManager.colors.lightText,
                        }}
                      >
                        {swapText.swapFeeTokenTransferFee}
                      </Text>
                    }
                  >
                    <View style={{ padding: 8 }}>
                      <Image
                        style={{
                          resizeMode: "contain",
                          height: 12,
                          width: 12,
                          // tintColor: ThemeManager.colors.colorVariationBorder,
                        }}
                        source={Images.infoGradient}
                      />
                    </View>
                  </Tooltip>
                ) : (
                  <View style={{ padding: 8 }}>
                    <Image
                      style={{
                        resizeMode: "contain",
                        height: 12,
                        width: 12,
                        // tintColor: ThemeManager.colors.colorVariationBorder,
                      }}
                      source={Images.infoGradient}
                    />
                  </View>
                )}
              </View>

              <Text
                allowFontScaling={false}
                style={[
                  styles.textStyle1,
                  {
                    width: "55%",
                    textAlign: "right",
                    color: ThemeManager.colors.TextColor,
                  },
                ]}
              >
                {serviceFee} %
              </Text>
            </View>

            <View
              style={{ flexDirection: "row", justifyContent: "space-between" }}
            >
              <Text
                allowFontScaling={false}
                style={[
                  styles.textStyle1,
                  {
                    width: "40%",
                    color: ThemeManager.colors.lightGrayTextColor,
                  },
                ]}
              >
                {swapText.relayerServiceFee}
              </Text>
              <Text
                allowFontScaling={false}
                style={[
                  styles.textStyle1,
                  {
                    width: "55%",
                    textAlign: "right",
                    color: ThemeManager.colors.TextColor,
                  },
                ]}
              >
                {toFixedExp(coinInfoSwap?.receiveCoinFee, 6)}{" "}
                {secondCoinSelected?.coin_data?.coin_symbol?.toUpperCase()}
              </Text>
            </View>

            <View
              style={{ flexDirection: "row", justifyContent: "space-between" }}
            >
              <Text
                allowFontScaling={false}
                style={[
                  styles.textStyle1,
                  { color: ThemeManager.colors.lightGrayTextColor },
                ]}
              >
                {swapText.youWillReceive}
              </Text>
              <Text
                allowFontScaling={false}
                style={[
                  styles.textStyle1,
                  {
                    width: "60%",
                    textAlign: "right",
                    color: ThemeManager.colors.TextColor,
                  },
                ]}
              >
                {toAmt ? toAmt : "0"}{" "}
                {secondCoinSelected?.coin_data?.coin_symbol?.toUpperCase()}
              </Text>
            </View>


            <View
              style={{ flexDirection: "row", justifyContent: "space-between" }}
            >
              <Text
                allowFontScaling={false}
                style={[
                  styles.textStyle1,
                  { color: ThemeManager.colors.lightGrayTextColor },
                ]}
              >
                {swapText.estimatedTime}
              </Text>
              <Text
                allowFontScaling={false}
                style={[
                  styles.textStyle1,
                  {
                    width: "60%",
                    textAlign: "right",
                    color: ThemeManager.colors.TextColor,
                  },
                ]}
              >1 ~ 20 minutes</Text>
            </View>
          </View>
        )}
      </ScrollView>
      <View style={styles.ViewStyle}>
        <Button
          // disabled={
          //   buttonTxt.toLowerCase() == alertMessages.insufficientBalance
          //     ? true
          //     : false
          // }
          buttontext={buttonTxt}
          themeSelected={themeSelected}
          onPress={onSwapClicked}
        />
      </View>

      {/* ***********************FIRST MODAL FOR SELECTION OF COIN******************************* */}
      <ChangellyCoinList
        noStyle={{ marginTop: Dimensions.get("screen").height / 3.5 }}
        isFrom={true}
        selectedCoin={secondCoinSelected}
        title={swapText.chain}
        openModel={firstModal}
        handleBack={() => {
          setFirstModal(false);
        }}
        onPress={onFirstListItemSelected}
        onSamePair={onSamePair}
      />

      {/* ***********************SECOND MODAL FOR SELECTION OF TOKEN******************************* */}
      <ChangellyCoinList
        noStyle={{ marginTop: Dimensions.get("screen").height / 3.5 }}
        selectedCoin={firstCoinSelected}
        title={swapText.chain}
        isFrom={false}
        openModel={secondModal}
        handleBack={() => {
          setSecondModal(false);
        }}
        onSamePair={onSamePair}
        onPress={onSecondListItemSelected}
      />

      {ConfirmTxnModal && (
        <ConfirmSwapCrosschain
          AlertDialogNew={AlertDialogNew}
          alertTxt={alertTxt}
          hideAlertDialog={() => {
            showAlertDialogNew(false);
          }}
          isLoading={isLoading}
          from={firstCoinSelected}
          to={secondCoinSelected}
          itemWallet={firstItemWallet}
          seconditemWallet={{
            ...seconditemWallet,
            ...secondCoinSelected,
          }}
          sendAmount={fromAmt}
          getAmount={toAmt} // check number conversion if get any error
          swapData={crossSwapData}
          totalFee={totalFee ? toFixedExp(totalFee, 8) : 0.0}
          handleBack={() => {
            showConfirmTxnModal(false);
            setLoading(false);
          }}
          showConfirmTxnModal={ConfirmTxnModal}
          onPress={() => {
            showConfirmTxnModal(false);
            setTimeout(() => {
              setShowPinModal(true);
            }, 200);
          }}
          nativePrice={toFixedExp(parseFloat(totalFee ? toFixedExp(totalFee, 8) : 0.0) * parseFloat(nativeFaitValue), 2)}
        // onPress={onSwapConfirmed}
        />
      )}

      <AppAlert
        visible={AlertDialogNew}
        alertTxt={alertTxt}
        hideAlertDialog={() => {
          showAlertDialogNew(false);
        }}
      />
      <LoaderView isSwap={true} isLoading={isLoading} />
      <PriceImpactModal
        visible={pairModalAlert}
        onPress={async () => {
          await setPriceImpactState(false);
          await setPairModalAlert(false);
          if (!isLoading) {
            onSwapClicked(true);
          }
        }}
        onRequestClose={() => {
          setPairModalAlert(false);
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
    justifyContent: "center",
    width: Dimensions.get("screen").width / 5.8,
    height: 40,
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
export default memo(CrossChain);

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