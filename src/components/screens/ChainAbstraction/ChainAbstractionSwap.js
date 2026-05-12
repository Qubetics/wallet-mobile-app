import React, { memo, useEffect, useRef, useState } from "react";
import { useFocusEffect } from '@react-navigation/native';

import {
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  unstable_batchedUpdates,
  View
} from "react-native";
import { EventRegister } from "react-native-event-listeners";
import { Actions } from '../../../navigation/RootNavigation';
import { useDispatch } from "react-redux";
import { LanguageManager } from "../../../../LanguageManager";
import { ThemeManager } from "../../../../ThemeManager";
import * as Constants from "../../../Constants";
import {
  getChainAbstractionCoinList,
  requestGasEstimation,
  requestBTCgasprice,
  requestUnspent,
  saveMpcWallets,
  getMpcWalletBalance,
  saveChainAbstractionTrxId
} from "../../../Redux/Actions";
import Singleton from "../../../Singleton";
import { Fonts, Images } from "../../../theme";
import { dimen, heightDimen, widthDimen } from "../../../Utils";
import {
  bigNumberFormat,
  bigNumberSafeMath,
  consoleLogFunc,
  exponentialToDecimal,
  getData,
  getEncryptedData,
  saveData,
  toFixedExp,
  toFixedExpCA
} from "../../../Utils/MethodsUtils";
import { pinnedFetch } from "../../../Utils/pinnedFetch";
import { getTicsProvider } from "../../../Utils/TicsUtils";
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
  extractDerivedAddresses,
  getPlatformFeeFunction,
  resolveIntent,
  getNetworkAddresses,
  getNetworkAddressEthBalance,
  btcBalanceFromUnspentResponse
} from "../../../Utils/chainAbstractionUtils";
import { CHAIN_ABSTRACTION_PRICE_URL } from "../../../EndPoint";
import Clipboard from "@react-native-clipboard/clipboard";
const ABI = require("../../../chainAbstractionAbi.json");

let isRefreshCoinList = false;
const ChainAbstractionSwap = ({ themeSelected, navigation, isVisible }) => {
  const { detailTrx, alertMessages, swapText, browser } = LanguageManager;
  const dispatch = useDispatch();
  const scrollRef = useRef(null);

  const SATOSHI_600_IN_BTC = 0.000006;
  const BTC_SATOSHI_MULTIPLIER = 0.00000001; // 1 sat = 1e-8 BTC
  const [minMaxSwapAmount, setMinMaxSwapAmount] = useState({
    7: { min: 25, max: 1000 },
    3: { min: SATOSHI_600_IN_BTC, max: 0.001 },
  });

  const [isLoading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedFrom, setSelectedFrom] = useState("");
  const [selectedTo, setSelectedTo] = useState("");
  const [isSelectingFrom, setIsSelectingFrom] = useState(true);
  const [toAddress, setToAddress] = useState("");
  const [fromValue, setFromValue] = useState("");
  const [fromValueUSD, setFromValueUSD] = useState("");
  const [toValue, setToValue] = useState("");
  const [confirmAbstractionVisible, setConfirmAbstractionVisible] = useState(false);
  const [coinList, setCoinList] = useState([]);
  const [chainAbstractionFee, setChainAbstractionFee] = useState({
    solver: 1.5,
    platform: 1.5,
  });
  const [depositTotalFee, setDepositTotalFee] = useState({
    tics: 0,
    btc: 0,
  });

  const [AlertDialogNew, showAlertDialogNew] = useState(false);
  const [alertTxt, setAlertTxt] = useState("");
  const [showPinModal, setShowPinModal] = useState(false);
  const [isGenerateMpcAddress, setIsGenerateMpcAddress] = useState(false);
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
  const [poolLiquidity, setPoolLiquidity] = useState({ eth: 0, btc: 0, isFailed: false });
  const oldStateRef = useRef(false);
  const debounceTimeout = useRef(null);
  const timeoutRef = useRef(null);

  /******************************************************************************************/

  useEffect(() => {
    getFiatValueForCoin()
    getPlatformFee()
    EventRegister.addEventListener("getThemeChanged", (data) => { });
    EventRegister.addEventListener('REFRESH_PAGE_STATE', () => { // event listener triggered in CustomTabBar.js
      unstable_batchedUpdates(() => {
        setToValue('');
        setFromValue('');
        setFromValue('');
        setFromValueUSD('');
        setToAddress("")
        Singleton.getInstance().defaultMpcBtcAddress = ""
        Singleton.getInstance().defaultMpcEthAddress  = ""
        isRefreshCoinList = true;
        setSelectedFrom(null);
        setSelectedTo(null);
      });
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
      EventRegister.removeEventListener('REFRESH_PAGE_STATE');
      EventRegister.removeEventListener('getThemeChanged');
      EventRegister.removeEventListener(Constants.DOWN_MODAL);
    };
  }, []);


  useEffect(() => {
    updateSendButtonState();
  }, [fromValue, toValue, toAddress]);


  useEffect(() => {
    if(selectedFrom && coinList?.length > 0 && !isRefreshCoinList){
        const updatedFromItem = coinList.find((item) => item.coin_symbol === selectedFrom?.coin_symbol);
        setSelectedFrom(updatedFromItem || selectedFrom);
    }
    if(isRefreshCoinList){
      setTimeout(() => {
        isRefreshCoinList = false;
      }, 200);
    }
  }, [coinList]);

  useFocusEffect(
    React.useCallback(() => {
      focus(isRefreshCoinList);
      
      const updateToAddress = async () => {
        consoleLogFunc("selectedTo>>>", selectedTo, toAddress,  Singleton.getInstance().defaultMpcEthAddress);
        if(selectedTo?.coin_family && toAddress == ""){
          const mpcData = await getData(Constants.MPC_ADDRESS + Singleton.getInstance().defaultTicsAddress);
          const response = JSON.parse(mpcData);
          if(selectedTo?.coin_family == 7 && response?.derived_eth_address){
            setToAddress(response?.derived_eth_address);
          } else if (selectedTo?.coin_family == 3 && response?.derived_btc_address){
            setToAddress(response?.derived_btc_address);
          }
        }
      };
      
      updateToAddress();

      return () => {
        // Cleanup if needed
      };
    }, [selectedTo, toAddress])
  );


  const getFiatValueForCoin = async () => {
    const response = await pinnedFetch(CHAIN_ABSTRACTION_PRICE_URL);
    const data = await response.json();
    const prices = data?.data;
    setFiatValueForCoin(prices ?? {});

    if (prices?.BTC != null && prices?.TICS != null && Number(prices.TICS) > 0) {
      const btcPrice = Number(prices.BTC);
      const ticsPrice = Number(prices.TICS);
      const ticsEquivalentTo600Satoshi = (SATOSHI_600_IN_BTC * btcPrice) / ticsPrice;
      const minTics = Math.ceil(Number(toFixedExp(ticsEquivalentTo600Satoshi, 8)) || 25);
      setMinMaxSwapAmount((prev) => ({
        ...prev,
        7: { ...prev[7], min: minTics },
      }));
    }
  };

  const getPlatformFee = async () => {
    try {
      const data = await getPlatformFeeFunction()
      setChainAbstractionFee(data);
    } catch (error) {
      consoleLogFunc("getPlatformFee>>>>error", error);
    }
  };

  const fetchPoolLiquidity = async () => {
    try {
      const data = await getNetworkAddresses();
      const { network_addresses, vault_address } = data || {};
      if (!network_addresses?.btc_address || !vault_address) {
        consoleLogFunc("fetchPoolLiquidity: missing network_addresses", data);
        return;
      }
      const [ethBalance, unspentRes] = await Promise.all([
        getNetworkAddressEthBalance(vault_address),
        getData(Constants.ACCESS_TOKEN).then((token) =>
          dispatch(
            requestUnspent(network_addresses.btc_address, token, "btc")
          )
        ),
      ]);
      const btcBalance = btcBalanceFromUnspentResponse(unspentRes);
      consoleLogFunc("fetchPoolLiquidity>>>",network_addresses.btc_address, { ethBalance, btcBalance });
      setPoolLiquidity({ eth: ethBalance ?? 0, btc: btcBalance ?? 0, isFailed: false });
    } catch (error) {
      consoleLogFunc("fetchPoolLiquidity>>>>error", error);
      setPoolLiquidity({ eth: 0, btc: 0, isFailed: true });
    }
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
    setIntentTxHash("");
    platFormFee();
    fetchPoolLiquidity();
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

        const toToken = coinList[1]

        setCoinList(coinList);

        consoleLogFunc("getCoinList>>11", isFirstTime, toToken);
        if (isFirstTime) {
          consoleLogFunc("getCoinList>>22", coinList[0], toToken);
          setSelectedFrom(coinList[0]);
          setSelectedTo(toToken);
          setToAddress(toToken?.coin_family == 3 ? Singleton.getInstance().defaultMpcBtcAddress : Singleton.getInstance().defaultMpcEthAddress);

          setSelectIndex(coinList[0]?.coin_id);
          setSelectIndexOne(toToken?.coin_id);
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
    const gasEstimationReq = {
      from: Singleton.getInstance().defaultTicsAddress,
      to: Singleton.getInstance().defaultTicsAddress,
      amount: "",
    };
    setLoading(true);
    getData(Constants.ACCESS_TOKEN).then((token) => {
      const ticsFeePromise = dispatch(
        requestGasEstimation({
          url: "qubetics/tics/gas_estimation",
          coinSymbol: "tics",
          gasEstimationReq,
          token,
        })
      ).then((res) => {
        const gasEstimate = res?.gas_estimate || 23000;
        const mediumGasPrice = res?.gas_price;
        return toFixedExp((mediumGasPrice * (gasEstimate * 2)) / 10 ** 8, 8);
      }).catch((e) => {
        consoleLogFunc("getFee>>>>error", e);
        return "0";
      });

      const btcFeePromise = dispatch(requestBTCgasprice())
        .then((feeRes) => {
          consoleLogFunc("feeRes>>>", feeRes);
          let feeRateSatPerByte = feeRes?.priority ?? feeRes?.regular ?? 5;
          if(feeRateSatPerByte < 2){
            feeRateSatPerByte = 2;
          }
          return dispatch(
            requestUnspent(
              Singleton.getInstance().defaultMpcBtcAddress,
              token,
              "btc"
            )
          ).then((unspentRes) => {
            consoleLogFunc("unspentRes>>>", unspentRes);
            const utxos = unspentRes?.data ?? [];
            const inputCount = Math.max(utxos.length, 1);
            const outputCount = 1;
            const transactionSize =
              inputCount * 146 + outputCount * 34 + 10 - inputCount;
            const feeBtc =
              transactionSize * feeRateSatPerByte * BTC_SATOSHI_MULTIPLIER;
            return toFixedExp(feeBtc, 8);
          });
        })
        .catch((e) => {
          consoleLogFunc("getBtcFee>>>>error", e);
          return "0.0000015";
        });

      Promise.all([ticsFeePromise, btcFeePromise])
        .then(([ticsFee, btcFee]) => {
          setDepositTotalFee({
            tics: ticsFee,
            btc: btcFee,
          });
        })
        .finally(() => {
          setLoading(false);
        });
    });
  };

  /******************************************************************************************/
  const openSelector = (type) => {
    setIsSelectingFrom(type === "from");
    setModalVisible(true);
  };
  /******************************************************************************************/
  const onPressPaste = () => {
    Clipboard.getString().then((address) => {
      setToAddress(address);
    })
  }

  /******************************************************************************************/
  const onPressToggle = () => {
    // Swap token logic
    const tempSelectedFrom = selectedTo;
    const tempSelectedTo = selectedFrom;

    setSelectedFrom(tempSelectedFrom);
    setSelectedTo(tempSelectedTo);

    setSelectIndex(tempSelectedFrom?.coin_id);
    setSelectIndexOne(tempSelectedTo?.coin_id);

    const tempFromValue = toValue;
    const tempToValue = fromValue;
    if (bigNumberFormat(tempSelectedFrom.balance).isGreaterThan(tempFromValue)) {
      setFromValue(tempFromValue);
      setToValue(tempToValue);
    } else {
      setFromValueUSD("");
      setFromValue("");
      setToValue("");
    }

    setToAddress(
      selectedTo?.coin_family == 7 && selectedFrom?.coin_family == 3
        ? Singleton.getInstance().defaultMpcBtcAddress
        : Singleton.getInstance().defaultMpcEthAddress
    );

  };
  /******************************************************************************************/

  const onPressMax = () => {
    const platformFee = exponentialToDecimal(selectedFrom?.coin_family == 3 ? depositTotalFee?.btc : depositTotalFee?.tics)
    let enteredAmount = selectedFrom?.balance;    
    const balance =  enteredAmount;
    let totalFee = (chainAbstractionFee.platform / 100) * (enteredAmount) + (chainAbstractionFee.solver / 100) * (enteredAmount);
    totalFee = bigNumberSafeMath(totalFee, "+", (platformFee ? toFixedExp(platformFee, 8) : 0.0));
    const totalAmount = bigNumberSafeMath(balance, "+", totalFee);
    if(bigNumberFormat(totalAmount).isGreaterThan(minMaxSwapAmount[selectedFrom?.coin_family]?.max)) {
      enteredAmount = minMaxSwapAmount[selectedFrom?.coin_family]?.max;
    }else{
      enteredAmount = bigNumberFormat(balance).minus(totalFee);
    }    
   
    let totalCost = enteredAmount//bigNumberSafeMath(enteredAmount, "-", totalFee);
    if(isFaitOnFrom) {
     totalCost = bigNumberSafeMath(totalCost, "*", selectedFrom?.fiat_price_data?.value);
    }
    onChangeFromValue(toFixedExp(totalCost, isFaitOnFrom ? 2 : 8));
  };
  /******************************************************************************************/

  const onChangeFromValue = (val) => {
    const expression = new RegExp("^\\d*\\.?\\d{0," + (isFaitOnFrom ? 2 : 8) + "}$");
    if (expression.test(val)) {
      isFaitOnFrom ? setFromValueUSD(toFixedExpCA(val, 2)) : setFromValue(val);
      if (isFaitOnFrom) {
        val = bigNumberSafeMath(val, "/", selectedFrom?.fiat_price_data?.value);
        setFromValue(toFixedExp(val, 8));
      } else {
        const fiatValue = bigNumberSafeMath(val, "*", selectedFrom?.fiat_price_data?.value);
        setFromValueUSD(toFixedExp(isNaN(fiatValue) ? "" : fiatValue, 2));
      }

      if (debounceTimeout.current) {
        clearTimeout(debounceTimeout.current);
      }
      debounceTimeout.current = setTimeout(() => {
        const fromFiatValue = selectedFrom?.coin_family == 3 ? fiatValueForCoin?.BTC : fiatValueForCoin?.TICS;
        const toFiatValue = selectedTo?.coin_family == 3 ? fiatValueForCoin?.BTC : fiatValueForCoin?.TICS;

        const toValue = bigNumberSafeMath(
          bigNumberSafeMath(val, "*", (fromFiatValue || selectedFrom?.fiat_price_data?.value)),
          "/",
          (toFiatValue || selectedTo?.fiat_price_data?.value)
        );
        let decimal = selectedTo?.decimals?.toString()?.length - 1
        decimal = decimal > 8 ? 8 : decimal

        // const slippage = 1;
        // if(selectedTo?.coin_family != selectedFrom?.coin_family){
        //   slippage = 0.995;
        // }

        setToValue(toFixedExp(toValue, decimal));
      }, 800);
    }
  };
  /******************************************************************************************/
  const onSwapClicked = () => {
    consoleLogFunc("fromValue>>>", fromValue);
    consoleLogFunc("depositTotalFee>>>", depositTotalFee);
    consoleLogFunc("selectedFrom?.balance>>>", selectedFrom?.balance);
    if (fromValue?.length == 0 || fromValue == 0) {
      showAlertDialog(alertMessages.pleaseEnterAmount);
      return;
    }

    if (Number(selectedFrom?.balance) < Number(fromValue)) {
      showAlertDialog(alertMessages.insufficientBalance);
      return;
    }
    if (toValue?.length == 0 || toValue == 0) {
      showAlertDialog(LanguageManager.chainAbstractionSwap.invalidToAmount);
      return;
    }
    const validToAddress = selectedTo?.coin_family == 3 ? validateBTCAddress(toAddress) : validateEthAddress(toAddress)
    if (!validToAddress) {
      showAlertDialog(`Please enter valid ${selectedTo?.coin_symbol?.toUpperCase()} address`);
      return;
    }
    if (Number(fromValue) < minMaxSwapAmount[selectedFrom?.coin_family]?.min) {
      showAlertDialog(`Minimum swap amount is ${minMaxSwapAmount[selectedFrom?.coin_family]?.min} ${selectedFrom?.coin_symbol?.toUpperCase()}`);
      return;
    }
    if (Number(fromValue) > minMaxSwapAmount[selectedFrom?.coin_family]?.max) {
      showAlertDialog(`Maximum swap amount is ${minMaxSwapAmount[selectedFrom?.coin_family]?.max} ${selectedFrom?.coin_symbol?.toUpperCase()}`);
      return;
    }
    if (Number(fromValue) + Number(selectedFrom?.coin_family == 3 ? depositTotalFee?.btc : depositTotalFee?.tics) > Number(selectedFrom?.balance)) {
      showAlertDialog(`Insufficient balance`);
      return;
    }
    const requiredPoolBalance = Number(toValue);
    if (selectedTo?.coin_family === 3 && requiredPoolBalance > Number(poolLiquidity?.btc ?? 0) && !poolLiquidity?.isFailed) {
      showAlertDialog(`Insufficient liquidity in pool. Available BTC in pool: ${(poolLiquidity?.btc ?? 0).toFixed(bigNumberFormat(poolLiquidity?.btc )?.isGreaterThan(0) ? 8 : 2)}`);
      return;
    }
    consoleLogFunc("requiredPoolBalance>>>", requiredPoolBalance);
    consoleLogFunc("poolLiquidity>>>", poolLiquidity);
    if (selectedTo?.coin_family === 7 && requiredPoolBalance > Number(poolLiquidity?.eth ?? 0) && !poolLiquidity?.isFailed) {
      showAlertDialog(`Insufficient liquidity in pool. Available TICS in pool: ${(poolLiquidity?.eth ?? 0).toFixed(bigNumberFormat(poolLiquidity?.eth )?.isGreaterThan(0) ? 6 : 2)}`);
      return;
    }

    const fromAddress = selectedFrom?.coin_family == 3 ? Singleton.getInstance().defaultMpcBtcAddress : Singleton.getInstance().defaultMpcEthAddress

    if (selectedFrom?.coin_family == selectedTo?.coin_family && toAddress?.toLowerCase() == fromAddress?.toLowerCase()) {
      showAlertDialog(`You cannot swap the same token to the same address`);
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
    try {
    const msg = {
      source_address: sourceAddress,
      target_address: toAddress,
      source_chain: selectedFrom?.coin_name?.toLowerCase(),
      target_chain: selectedTo?.coin_name?.toLowerCase(),
      amount: amount,
      source_token: selectedFrom?.coin_symbol?.toLowerCase(),
      target_token: selectedTo?.coin_symbol?.toLowerCase(),
      timestamp: new Date().getTime(),
    };

    const payloadStr = JSON.stringify(msg);

    const provider = getTicsProvider();
    const wallet = new ethers.Wallet(privateKey).connect(provider);
    // 4) Sign (EIP-191 personal_sign)
    const signature = await wallet.signMessage(payloadStr);

      const swapData = {
        signature: signature,
        msg: msg,
      };

      const response = await createMpcSwapOrder(swapData);

      if (validateApiResponse(response, "createSwapOrder")) {
        setProcessingTransaction(true);
        const intentHash = await addIntentHash(response?.intent_hash);
        consoleLogFunc("Swap order created successfully", response);
        consoleLogFunc("intentHash added successfully", intentHash);
        // Handle successful swap order creation
        let txId = response?.intent_hash
        // if(response?.status == 'timeout'){
        //   const parts = response?.error_message?.split("Intent hash: ");
        //   const hash = parts[1].split(".")[0];
        //   txId = "0x" + hash
        // }
        setIntentTxHash(txId);
        submitIntentHash(txId);
        // setProcessingTransaction(true);
      } else {
        clearTimeout(timeoutRef.current);
        consoleLogFunc("Failed to create swap order");
        // Handle swap order creation failure
        setProcessingTransaction(false);
        showAlertDialogNew(true);
        setAlertTxt(response?.message || alertMessages.failedtoInitiateTransaction);
      }
      setLoading(false);
    } catch (err) {
      clearTimeout(timeoutRef.current);
      setProcessingTransaction(false);
      setLoading(false);
      showAlertDialogNew(true);
      setAlertTxt(alertMessages.failedtoInitiateTransaction);
      consoleLogFunc("createSwapOrder error:", err);
      // Handle error appropriately
    }
  };

  const addIntentHash = async (intentHash) => {
    try {
      return await resolveIntent(intentHash);
    } catch (err) {
      consoleLogFunc("addIntentHash error:", err);
      throw err;
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
    dispatch(saveChainAbstractionTrxId(selectedFrom?.coin_symbol, data, selectedFrom?.coin_family == 3 ? "bitcoin/" : "qubetics/"))
      .then((res) => {
        setFromValue("");
        setToValue("");
        setFromValueUSD("");

      })
      .catch((e) => {
        consoleLogFunc("submitIntentHash:::::>>>>>error", e);
      });
  };


  const getMpcAddress = async (isFirstTime) => {
    if (!navigation.isFocused()) return;
    consoleLogFunc("getMpcAddress>>11", isFirstTime);
    const mpcData = await getData(Constants.MPC_ADDRESS + Singleton.getInstance().defaultTicsAddress);
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

  const mpcAddressApi = async (pin) => {
    try {
      const ethereumAddress = Singleton.getInstance().defaultTicsAddress;
      const userResponse = await getOrRegisterUser(ethereumAddress, pin);

      if (!validateApiResponse(userResponse, 'getOrRegisterUser')) {
        throw new Error('Failed to get valid user response');
      }

      // Extract derived addresses using utility method
      const derivedAddresses = extractDerivedAddresses(userResponse);

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
      getCoinList(true);

      // Show congratulation modal after successful generation
      setTimeout(() => {
        oldStateRef.current = true;
        setIsGenerateMpcAddress(false);
        setShowCongratulationModal(true);
      }, 500);

    } catch (err) {
      consoleLogFunc("mpcAddressApi error:", err);
      showAlertDialog("Failed to generate MPC address");
      // setIsMpcAddress(true); // Show error state
    }
  };

  const showAlertDialog = (message) => {
    showAlertDialogNew(true);
    setAlertTxt(message);
  }

  /******************************************************************************************/

  return (
    <View style={{ flex: 1 }}>
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
              maxLength={12}
              onChangeNumber={onChangeFromValue}
              balance={toFixedExp(selectedFrom?.balance, 8)}
              onPressMax={onPressMax}
              fromAddress={
                selectedFrom?.coin_family == 3 ? Singleton.getInstance().defaultMpcBtcAddress
                  : Singleton.getInstance().defaultMpcEthAddress
              }
              isUSD={isFaitOnFrom}
              onPressUSD={() => {
                setIsFaitOnFrom(!isFaitOnFrom);
                if(fromValue == ""){
                  setFromValueUSD("");
                }
              }}
            />

            {/* Swap Toggle */}
            <TouchableOpacity
              onPress={onPressToggle}
              disabled={selectedFrom?.coin_family === selectedTo?.coin_family}
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
              numberOfLines={1}
              // onChangeNumber={() => {}}
              // balance={toFixedExp(selectedTo?.balance, 8)}
              editable1={true}
              editable={false}
              onPressPaste={onPressPaste}
            />

            {/* Confirm Button */}
            <View style={{ marginVertical: heightDimen(30) }}>
              <Button
                disabled={sendDisabled}
                buttontext={buttonText}
                onPress={onSwapClicked}

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
              ? Singleton.getInstance().defaultMpcBtcAddress
              : Singleton.getInstance().defaultMpcEthAddress;

            unstable_batchedUpdates(() => {
              if (isSelectingFrom) {
                setSelectedFrom(chain);
              } else {
                setSelectedTo(chain);
                setToAddress(address)

              }
              setFromValue("");
              setToValue("");
              setFromValueUSD("");
              setModalVisible(false);
              // onChangeFromValue()
            })

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
                setIsMpcAddress(false);
                if(isGenerateMpcAddress){
                  Actions.pop();
                  setIsGenerateMpcAddress(false);
                }
              }}
              closeEnterPin={async (pin) => {
                setShowPinModal(false);
                if(isGenerateMpcAddress){
                  mpcAddressApi(pin);
                }else{
                  onSwapConfirmed(pin);
                }
                setIsMpcAddress(false);
              }}
              checkBiometric={true}
            />
          </View>
        </Modal>

        {confirmAbstractionVisible &&
          <ConfirmAbstraction
            visible={confirmAbstractionVisible}
            fromToken={selectedFrom}
            toToken={selectedTo}
            fromAmt={fromValue}
            toAmt={toValue}
            chainAbstractionFee={chainAbstractionFee}
            onClose={() => setConfirmAbstractionVisible(false)}
            isLoading={isLoading}
            onConfirm={() => {
              setConfirmAbstractionVisible(false)
              const platformFee = exponentialToDecimal(selectedFrom?.coin_family == 3 ? depositTotalFee?.btc : depositTotalFee?.tics)
              const totalFee = (chainAbstractionFee.platform / 100) * (fromValue) + (chainAbstractionFee.solver / 100) * (fromValue) + (platformFee ? toFixedExp(platformFee, 8) : 0.0);
              const totalCost = bigNumberSafeMath(fromValue, "+", totalFee);
              if (bigNumberFormat(totalCost).isGreaterThan(selectedFrom?.balance)) {
                showAlertDialog("Insufficient balance to cover the amount + transaction fee.");
                return;
              }
              setShowPinModal(true);
            }}
            platFormFee={exponentialToDecimal(selectedFrom?.coin_family == 3 ? depositTotalFee?.btc : depositTotalFee?.tics)}
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
          />}
        <ProcessingTransaction
          item={selectedFrom}
          fees={selectedFrom?.coin_family == 3 ? depositTotalFee?.btc : depositTotalFee?.tics}
          visible={processingTransaction}
          isFromSwap={true}
          intentHash={intentTxHash}
          onClose={() => {
            getCoinList(false);
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
              if(isGenerateMpcAddress){
                setIsGenerateMpcAddress(false);
                setIsMpcAddress(true);
              }
            }}
          />
        )}

        {isMpcAddress && (
          <MpcAlertModel
            visible={isMpcAddress}
            message={'MPC address is not set'}
            onContinue={() => {
              setIsMpcAddress(false);
              setTimeout(() => {
                setShowPinModal(true);
                setIsGenerateMpcAddress(true);         
              }, 1500);
            }}
            onClose={() => {
              setIsMpcAddress(false);
              setIsGenerateMpcAddress(false);
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
