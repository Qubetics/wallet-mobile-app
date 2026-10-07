import {
    Dimensions,
    Image,
    Modal,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { Component } from "react";
import { BlurView } from "@react-native-community/blur";
import { Fonts, Images } from "../../../../theme";
import {
    getDimensionPercentage,
    getGasLimitFromData,
    getGasPriceForWc,
    getNonceForWc,
    hasNotchWithIOS,
    signPersonalMessage,
} from "../../../../Utils";
import { ThemeManager } from "../../../../../ThemeManager";
import { LanguageManager } from "../../../../../LanguageManager";
import {
    bigNumberSafeMath,
    consoleLogFunc,
    getData,
    getEncryptedData,
    toFixed,
    toFixedExp,
} from "../../../../Utils/MethodsUtils";
import { AppAlert, Button, LoaderView } from "../../../common";
import Singleton from "../../../../Singleton";
import WalletConnectInstance from "../../../../Utils/WalletConnectInstance";
import {
    fetchNativePrice,
    requestSendCoin,
    saveSolTransactionId,
    requestGasEstimation,
} from "../../../../Redux/Actions";
import { store } from "../../../../Redux/Reducers";
import EnterPinForTransaction from "../../EnterPinForTransaction/EnterPinForTransaction";
import { ACCESS_TOKEN } from "../../../../Constants";
import { sendSOLANAFromJupiterSwapLegacyTxn, resolveActualTxHash } from "../../../../Utils/SolUtils";
import { EventRegister } from "react-native-event-listeners";
import * as Constants from "../../../../Constants";
import { ethers } from "ethers";
import { base58 } from "ethers/lib/utils";

class TransactionRequest extends Component {
    /** Initializes the TransactionRequest component. */
    constructor(props) {
        super(props);
        this.state = {
            isShowReq: false,
            pinModal: false,
            showAlertDialog: false,
            showConfirmDialog: false,
            alertTxt: "",
            signingData: "",
            selectedNetwork: "Ethereum",
            coinFamily: 2,
            isLoading: true,
            calculatedFee: 0,
            fiatPrice: 0,
            gasPrice: 0,
            gasLimit: 0,
            transactionData: null,
            hideFees: false,
        };
    }
    componentDidMount() {
        EventRegister.addEventListener(Constants.DOWN_MODAL, () => {
            this.setState({
                showAlertDialog: false,
                showConfirmDialog: false,
                isLoading: false,
            });
            this.closeModal();
        });
    }

    showTransactionRequest(isShow, signingData) {
        consoleLogFunc("signingData>>>>>", JSON.stringify(signingData));
        this.setState({
            isLoading: true,
        });
        let dataIndex = 0;
        try {
            dataIndex = signingData.payload?.params?.request?.params?.findIndex(
                (ite) => {
                    return JSON.stringify(ite).length > 100;
                }
            );
            dataIndex = dataIndex == -1 ? 0 : dataIndex;
            this.setState({
                isLoading: false,
            });
        } catch (error) {
            consoleLogFunc("findIndex-error>>>>>", error);

            dataIndex = 0;
            this.setState({
                isLoading: false,
            });
        }
        consoleLogFunc(" index:::::", dataIndex);
        const isSolanaSign = signingData?.payload?.params?.request?.method === "solana_signTransaction";
        const data = isSolanaSign
            ? {
                to: Singleton.getInstance()?.defaultSolAddress,
                from: Singleton.getInstance()?.defaultSolAddress,
                data: signingData?.payload?.params?.request?.params?.transaction,
              }
            : signingData?.payload?.params?.request?.params?.[dataIndex];
        this.setState(
            {
                hideFees: false,
                isShowReq: isShow,
                signingData: signingData,
                coinFamily: signingData?.coinFamily,
                selectedNetwork:
                    signingData?.coinFamily == 1
                        ? "Binance"
                        : signingData?.coinFamily == 2
                            ? "Ethereum"
                            : signingData?.coinFamily == 5
                                ? "Solana"
                                : signingData?.coinFamily == 7
                                    ? "Qubetics"
                                : "Polygon",
                transactionData: data,
                calculatedFee: isSolanaSign ? "0.000005" : null,
            },
            async () => {
                if (signingData?.method == "eth_sendTransaction") {
                    if (isSolanaSign) {
                        this.fetchNativePriceFun(signingData?.coinFamily);
                    } else {
                        consoleLogFunc("data>>>", data);
                        let calculateGasEstimate = 0;
                        let gasPrice = 0;
                        if (!data?.gas) {
                            try {
                                const estimateResp = await getGasLimitFromData(
                                    data?.from,
                                    data?.to,
                                    data?.data,
                                    signingData?.coinFamily
                                );
                                calculateGasEstimate =
                                    estimateResp?.gas_estimate || estimateResp || 0;
                            } catch (e) {
                                consoleLogFunc("Gas Estimation Error:", e);
                                calculateGasEstimate = 0;
                            }

                            // calculateGasEstimate = await getGasLimitFromData(data?.from, data?.to, data?.data, signingData?.coinFamily);
                            // calculateGasEstimate = calculateGasEstimate?.gas_estimate || calculateGasEstimate
                        } else {
                            calculateGasEstimate = this.hex2dec(data?.gas);
                        }
                        if (!data?.gasPrice) {
                            try {
                                gasPrice = await getGasPriceForWc(signingData?.coinFamily);
                            } catch (e) {
                                consoleLogFunc("Gas Price Fetch Error:", e);
                                gasPrice = 0;
                            }
                            // gasPrice = await getGasPriceForWc(signingData?.coinFamily);
                            // consoleLogFunc("data>>>199", gasPrice);
                        } else {
                            gasPrice = this.hex2dec(data?.gasPrice);
                        }
                        // Ensure minimum gas price for Ethereum
                        if (signingData?.coinFamily === 1 && gasPrice / 10 ** 9 < 1) {
                            gasPrice = 1 * 10 ** 9;
                        }
                        // gasPrice = (signingData?.coinFamily == 1 && (gasPrice / 10 ** 9) < 1) ? (1 * 10 ** 9) : gasPrice
                        if (signingData?.coinFamily == 4) {
                            this.setState({ isLoading: true });
                            let gasEstimationReq = {
                                from: Singleton.getInstance().defaultMaticAddress,
                                to: Singleton.getInstance().defaultMaticAddress,
                                amount: "",
                            };
                            try {
                                const token = await getData(Constants.ACCESS_TOKEN);
                                const res = await store.dispatch(
                                    requestGasEstimation({
                                        url: `polygon/pol/gas_estimation`,
                                        coinSymbol: "pol",
                                        gasEstimationReq,
                                        token,
                                    })
                                );

                                consoleLogFunc("gasPriceDetail: pol", res);

                                //   if (res?.status && res?.gas_estimate) {
                                //     calculateGasEstimate = res.gas_estimate + 15000;
                                //     consoleLogFunc("data>>>1666 - Polygon gas estimate updated:", calculateGasEstimate);
                                //   }
                                if (!res?.resultList && res?.gas_price !== undefined) {
                                    res.resultList = {
                                        safe_gas_price: res.gas_price,
                                        propose_gas_price: res.gas_price,
                                        fast_gas_price: res.gas_price,
                                    };
                                }
                                gasPrice =
                                    parseFloat(
                                        res?.resultList?.propose_gas_price < 3
                                            ? 3
                                            : res.resultList.propose_gas_price
                                    ) *
                                    10 ** 9;
                                calculateGasEstimate = Math.ceil(calculateGasEstimate * 1.5);
                                this.setState({ isLoading: false });
                                 // Add 20% buffer
                            } catch (err) {
                                consoleLogFunc("Polygon Gas Estimation Error:", err);
                                this.setState({ isLoading: false });
                                return; // Exit early on error
                            }
                        }
                        // gasPrice = signingData?.coinFamily == 4 ?  gasPrice * 1.2: gasPrice;
                        gasPrice = gasPrice;
                        calculateGasEstimate = calculateGasEstimate;

                        const calculatedFee = toFixedExp(
                            bigNumberSafeMath(
                                bigNumberSafeMath(calculateGasEstimate, "*", gasPrice),
                                "/",
                                10 ** 18
                            ),
                            6
                        );
                        consoleLogFunc("data>>>mediumGasPrice11", gasPrice);
                        consoleLogFunc(
                            "data>>>mediumGasPrice--calculatedFee11",
                            calculatedFee,
                            "---",
                            calculateGasEstimate,
                        );

                        this.setState(
                            {
                                gasLimit: calculateGasEstimate,
                                gasPrice: gasPrice,
                                calculatedFee,
                                // calculatedFee: toFixedExp(bigNumberSafeMath(bigNumberSafeMath(calculateGasEstimate, '*', gasPrice), "/", 10 ** 18), 6),
                            },
                            () => {
                                this.fetchNativePriceFun(signingData?.coinFamily);
                            }
                        );
                    }
                } else if (signingData?.method == "solana_signMessage") {
                    consoleLogFunc("signingData?.coinFamily", signingData?.coinFamily, data);
                    let td = {
                        to: Singleton.getInstance()?.defaultSolAddress,
                        from: Singleton.getInstance()?.defaultSolAddress,
                        data: signingData?.payload?.params?.request?.params?.message,
                    };
                    this.setState({
                        transactionData: td,
                    });
                } else {
                    consoleLogFunc("signingData?.coinFamily", signingData?.coinFamily, data);
                    const index = signingData.payload?.params?.request?.params?.findIndex(
                        (ite) => {
                            return JSON.stringify(ite).length <= 100;
                        }
                    );
                    let td = {
                        to:
                            index != -1
                                ? signingData?.payload?.params?.request?.params?.[index]
                                : signingData?.payload?.params?.request?.params?.[1] ||
                                Singleton.getInstance()?.defaultEthAddress,
                        from: Singleton.getInstance()?.defaultEthAddress,
                        data: data,
                    };
                    this.setState({
                        hideFees: true,
                        transactionData: td,
                    });
                }
            }
        );
    }

    fetchNativePriceFun(coinFamily) {
        let data = {
            fiat_currency: Singleton.getInstance().CurrencySelected,
            coin_family: coinFamily,
        };
        store
            .dispatch(fetchNativePrice({ data }))
            .then((res) => {
                this.setState({
                    isLoading: false,
                    fiatPrice: toFixedExp(res?.fiatCoinPrice?.value, 2),
                });
                consoleLogFunc("chk res native price:::::", res);
            })
            .catch((err) => {
                this.setState({
                    isLoading: false,
                });
                consoleLogFunc("chk err native price:::::", err);
            });
    }

    closeModal() {
        this.setState({ signingData: "", isShowReq: false }, () => {
            global.wcTxnData = null;
            global.wcTxnPopup = false;
            let requests =
                WalletConnectInstance?.getInstance()?.web3Wallet?.getPendingSessionRequests();
            consoleLogFunc("requests:::S:S::::", requests);
            requests?.map(async (el) => {
                const response = {
                    id: el?.id,
                    jsonrpc: "2.0",
                    error: {
                        code: 5000,
                        message: "User rejected.",
                    },
                };
                try {
                    // consoleLogFunc("el?.topic::::::", el?.topic);
                    await WalletConnectInstance?.getInstance()?.web3Wallet?.respondSessionRequest(
                        {
                            topic: el?.topic,
                            response: response,
                        }
                    );
                } catch (e) {
                    consoleLogFunc("----------dapp request reject----error", e);
                }
            });
        });
    }

    ConvertBase(num) {
        return {
            from: function (baseFrom) {
                return {
                    to: function (baseTo) {
                        return parseInt(num, baseFrom).toString(baseTo);
                    },
                };
            },
        };
    }
    hex2dec(num) {
        return this.ConvertBase(num).from(16).to(10);
    }

    async prepareTransactionRaw(pin) {
        try {
            this.setState({ isLoading: true });
            if (this.state.selectedNetwork == "Solana") {
                const mnemonics = await getEncryptedData(
                    Singleton.getInstance().defaultSolAddress,
                    pin
                );
                sendSOLANAFromJupiterSwapLegacyTxn(
                    this.state.transactionData?.data,
                    mnemonics,
                    Singleton.getInstance().defaultSolAddress
                )
                    .then(({ signature, signedTransaction }) => {
                        this.saveSolTransaction(signature, signedTransaction);
                    })
                    .catch((err) => {
                        consoleLogFunc("ERR>>>", err);

                        this.setState({
                            isLoading: false,
                            showAlertDialog: true,
                            alertTxt: err,
                        });
                    });
            } else {
                let pKey = await getEncryptedData(
                    `${Singleton.getInstance().defaultEthAddress}_pk`,
                    pin
                );

                let amount = (
                    this.hex2dec(this.state.transactionData?.value || 0) /
                    10 ** 18
                ).toString();
                consoleLogFunc("amount11>>>", amount);

                // if (amount.includes(".")) {
                //     amount = amount.split(".")[0]
                // }
                const nonce = await getNonceForWc(Singleton.getInstance().defaultEthAddress, this.state.coinFamily);
                // let nonce = await getTransactionCount(
                //     Singleton.getInstance().defaultEthAddress,
                //     this.state.selectedNetwork?.toLowerCase()
                // );
                consoleLogFunc("amount>>>", amount);
                consoleLogFunc("gasLimit>>>", this.state.gasLimit);

                consoleLogFunc("nonce>>>", nonce);
                consoleLogFunc("transactionData>>>", this.state.transactionData);
                consoleLogFunc(
                    "selectedNetwork>>>",
                    this.state.selectedNetwork != "Ethereum"
                );
                let gasPrice = this.state.gasPrice;
                if (this.state.selectedNetwork != "Ethereum") {
                    gasPrice = bigNumberSafeMath(gasPrice, "/", 10 ** 9);
                    consoleLogFunc("gasPrice>>>111", gasPrice);
                    if (gasPrice?.toString().includes(".")) {
                        gasPrice = gasPrice.split(".")[0];
                    }
                }
                consoleLogFunc("gasPrice>>>", gasPrice);

                consoleLogFunc(
                    "nonce>>>",
                    nonce,
                    "---",
                    this.state.selectedNetwork?.toLowerCase()
                );

                Singleton.getInstance()
                    .getsignRawTxnDapp(
                        pKey,
                        amount,
                        gasPrice,
                        this.state.gasLimit,
                        nonce,
                        // nonce_new,
                        this.state.transactionData?.to,
                        this.state.transactionData?.from,
                        this.state.transactionData?.data,
                        this.state.selectedNetwork == "Ethereum"
                            ? "eth"
                            : this.state.selectedNetwork == "Binance"
                                ? "bnb"
                                : this.state.selectedNetwork == "Qubetics"
                                    ? "tics"
                                : "pol"
                    )
                    .then((serializedTx) => {
                        consoleLogFunc("res>>>", serializedTx);
                        pKey = "";
                        if (serializedTx != null) {
                            this.sendCoin(serializedTx, nonce);
                        }
                    })
                    .catch((err) => {
                        consoleLogFunc("ERR>>>", err);
                        pKey = "";
                        this.setState({ isLoading: false });
                    });
            }
        } catch (error) {
            this.setState({ isLoading: false });
        }
    }

    async saveSolTransaction(userSignature, signedTransaction) {
        // Step 1: Return signed tx to Jupiter first so they can co-sign slot 0 and submit.
        // The actual Solana tx hash (slot 0) is only known after Jupiter broadcasts.
        const responseVal = {
            id: parseInt(this.state.signingData?.payload?.id),
            result: { transaction: signedTransaction },
            jsonrpc: "2.0",
        };
        consoleLogFunc("RES>>>", responseVal, this.state.signingData?.payload?.topic);
        try {
            await WalletConnectInstance.getInstance().web3Wallet?.respondSessionRequest({
                topic: this.state.signingData?.payload?.topic?.toString(),
                response: responseVal,
            });
        } catch (e) {
            consoleLogFunc("WC respond error:", e?.message);
        }

        // Step 2: Poll Solana RPC until the submitted tx appears, then extract real txid.
        const actualTxHash = await resolveActualTxHash(
            userSignature,
            Singleton.getInstance().defaultSolAddress
        );
        consoleLogFunc("actualTxHash:", actualTxHash);

        // Step 3: Save to backend with the correct on-chain tx hash.
        const data = {
            amount: "0.0",
            gas_price: 0.000005,
            from: Singleton.getInstance().defaultSolAddress,
            txid: actualTxHash,
            to: Singleton.getInstance().defaultSolAddress,
            tx_type: "dapp",
            tx_status: "Complete",
        };
        store
            .dispatch(saveSolTransactionId("sol", data))
            .then((res) => {
                consoleLogFunc("res saveSolTransactionId", res);
                this.setState({
                    isLoading: false,
                    showConfirmDialog: true,
                    alertTxt: res?.message,
                });
            })
            .catch((err) => {
                consoleLogFunc("err saveSolTransactionId", err);
                this.setState({
                    isLoading: false,
                    alertTxt: err,
                    showAlertDialog: true,
                });
            });
    }

    async sendCoin(serializedTx, nonce) {
        const tx_raw = serializedTx;
        const from = this.state.transactionData?.from;
        const to = this.state.transactionData?.to;
        const amount = (
            this.hex2dec(this.state.transactionData?.value || 0) /
            10 ** 18
        ).toString();
        const gas_estimate = this.state.gasLimit;
        const eth_gas_price = this.state.gasPrice;
        const coinsym =
            this.state.selectedNetwork == "Ethereum"
                ? "eth"
                : this.state.selectedNetwork == "Binance"
                    ? "bnb"
                    : this.state.selectedNetwork == "Qubetics"
                        ? "tics"
                    : "pol";
        const coinType =
            this.state.selectedNetwork == "Ethereum"
                ? "ethereum"
                : this.state.selectedNetwork == "Binance"
                    ? "binancesmartchain"
                    : this.state.selectedNetwork == "Qubetics"
                        ? "qubetics"
                    : "polygon";
        const fee = toFixedExp(parseFloat(this.state.calculatedFee), 8);
        // let nonce_new = await getTransactionCount(
        //     this.state.transactionData?.from,
        //     this.state.selectedNetwork?.toLowerCase()
        // );
        // consoleLogFunc(
        //     "The sendCoinReq txn is nonce_new",
        //     nonce_new,
        //     "---",
        //     this.state.selectedNetwork?.toLowerCase(),
        //     '----', nonce
        // );

        const sendCoinReq = {
            nonce: nonce,
            // nonce: nonce_new,
            tx_raw: tx_raw,
            from: from,
            to: to,
            amount: this.hex2dec(this.state.transactionData) == 0 ? fee : amount,
            add_amount: this.hex2dec(this.state.transactionData) == 0 ? 1 : 0,
            gas_estimate: gas_estimate,
            gas_price: eth_gas_price,
            tx_type: "dapp",
        };
        consoleLogFunc("The sendCoinReq txn is ", sendCoinReq);
        consoleLogFunc("coinsym---- ", coinType, coinsym);

        getData(ACCESS_TOKEN).then((token) => {
            consoleLogFunc("The raw txn is " + tx_raw);
            store
                .dispatch(
                    requestSendCoin({
                        url: `${coinType}/${coinsym}/send`,
                        coinSymbol: coinsym,
                        sendCoinReq,
                        token,
                    })
                )
                .then(async (res) => {
                    consoleLogFunc(
                        "-----------------------Response------------",
                        res.tx_hash
                    );
                    const responseVal = {
                        id: parseInt(this.state.signingData?.payload?.id),
                        result: res?.tx_hash,
                        jsonrpc: "2.0",
                    };
                    await WalletConnectInstance.getInstance().web3Wallet?.respondSessionRequest(
                        {
                            topic: this.state.signingData?.payload?.topic?.toString(),
                            response: responseVal,
                        }
                    );

                    this.setState({
                        isLoading: false,
                        showConfirmDialog: true,
                        alertTxt: res?.message,
                    });
                })
                .catch((err) => {
                    this.setState({
                        isLoading: false,
                        alertTxt: typeof err == "object" ? err?.message : err,
                        showAlertDialog: true,
                    });
                });
        });
    }
    render() {
        if (!this.state.isShowReq) {
            return null;
        }
        const { sendTrx, browser, merchantCard } = LanguageManager;

        return (
            <View
                style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    zIndex: 10,
                }}
            >
                {this.state.signingData != "" && (
                    <>
                        <BlurView
                            style={styles.blurView}
                            blurType="dark"
                            blurAmount={4}
                            reducedTransparencyFallbackColor="rgba(0,0,0,0.85)"
                        />
                        <View
                            style={{
                                ...styles.modalView,
                            }}
                        >
                            <View
                                style={{
                                    ...styles.modalinner,
                                    borderColor: ThemeManager.colors.borderColor,
                                    backgroundColor: ThemeManager.colors.mnemonicsBg,
                                }}
                            >
                                <View style={styles.ViewStyle5}>
                                    <Text
                                        allowFontScaling={false}
                                        style={{
                                            ...styles.titleSign,
                                            color: ThemeManager.colors.blackWhiteText,
                                        }}
                                    >
                                        {browser.confirmTransaction}
                                    </Text>
                                    <TouchableOpacity
                                        style={styles.touchableStyle}
                                        onPress={() => {
                                            this.closeModal();
                                        }}
                                    >
                                        <Image
                                            style={{
                                                tintColor: ThemeManager.colors.blackWhiteText,
                                            }}
                                            source={Images.close_icon}
                                        />
                                    </TouchableOpacity>
                                </View>

                                <View style={styles.vwSignTransaction}>
                                    <Text
                                        allowFontScaling={false}
                                        style={[
                                            styles.textLbl,
                                            { color: ThemeManager.colors.blackWhiteText },
                                        ]}
                                    >
                                        {browser.to}
                                    </Text>
                                    <Text
                                        allowFontScaling={false}
                                        style={[
                                            styles.txtValue,
                                            { color: ThemeManager.colors.lightGreyText },
                                        ]}
                                    >
                                        {this.state.transactionData?.to}
                                    </Text>
                                </View>

                                <View style={styles.vwSignTransaction}>
                                    <Text
                                        allowFontScaling={false}
                                        style={[
                                            styles.textLbl,
                                            { color: ThemeManager.colors.blackWhiteText },
                                        ]}
                                    >
                                        {browser.From}
                                    </Text>
                                    <Text
                                        allowFontScaling={false}
                                        style={[
                                            styles.txtValue,
                                            { color: ThemeManager.colors.lightGreyText },
                                        ]}
                                    >
                                        {this.state.transactionData?.from}
                                    </Text>
                                </View>

                                {!this.state.hideFees && (
                                    <View style={[styles.vwSignTransaction]}>
                                        <Text
                                            allowFontScaling={false}
                                            style={[
                                                styles.textLbl,
                                                { color: ThemeManager.colors.blackWhiteText },
                                            ]}
                                        >
                                            {sendTrx.transactionFee}
                                        </Text>
                                        <Text
                                            allowFontScaling={false}
                                            style={[
                                                styles.txtValue,
                                                {
                                                    color: ThemeManager.colors.lightGreyText,
                                                },
                                            ]}
                                        >
                                            {" "}{this.state.calculatedFee}{" "}
                                            {this.state.selectedNetwork == "Ethereum"
                                                ? "ETH"
                                                : this.state.selectedNetwork == "Binance"
                                                    ? "BNB"
                                                    : this.state.selectedNetwork == "Solana"
                                                        ? "SOL"
                                                        : this.state.selectedNetwork == "Qubetics"
                                                            ? "TICS"
                                                        : "POL"}{" "}
                                            {this.state.selectedNetwork == "Solana" ? "" :`(${Singleton.getInstance().CurrencySymbol} ${toFixedExp(
                                                Number(this.state.calculatedFee) *
                                                Number(this.state.fiatPrice),
                                                4
                                            )})`}
                                        </Text>
                                    </View>
                                )}
                                {!this.state.hideFees && (
                                    <View style={styles.vwSignTransaction}>
                                        <Text
                                            allowFontScaling={false}
                                            style={[
                                                styles.textLbl,
                                                { color: ThemeManager.colors.blackWhiteText },
                                            ]}
                                        >
                                            {browser.total}
                                        </Text>
                                        <Text
                                            allowFontScaling={false}
                                            style={[
                                                styles.txtValue,
                                                { color: ThemeManager.colors.lightGreyText },
                                            ]}
                                        >
                                            {toFixed(
                                                this.state.selectedNetwork == "Solana"
                                                    ? this.state.calculatedFee
                                                    : bigNumberSafeMath(
                                                        this.hex2dec(
                                                            this.state?.transactionData?.value || 0
                                                        ) /
                                                        10 ** 18,
                                                        "+",
                                                        this.state.calculatedFee
                                                    ),
                                                8
                                            )}{" "}
                                            {this.state.selectedNetwork == "Ethereum"
                                                ? "ETH"
                                                : this.state.selectedNetwork == "Binance"
                                                    ? "BNB"
                                                    : this.state.selectedNetwork == "Solana"
                                                        ? "SOL"
                                                        : this.state.selectedNetwork == "Qubetics"
                                                            ? "TICS"
                                                        : "POL"}
                                        </Text>
                                    </View>
                                )}
                                <Button
                                    btnstyle={{ borderRadius: 6, marginBottom: 0 }}
                                    buttontext={merchantCard.submit}
                                    onPress={() => {
                                        // // this.setState({ isLoading: true });
                                        // // setTimeout(() => {
                                        // // this.signRawTxn();
                                        this.setState({ pinModal: true });
                                        // // }, 1000);
                                    }}
                                    isDisabled={this.state.calculatedFee == 0 || this.state.calculatedFee == null || this.state.calculatedFee == undefined ? true : false}
                                    disabled={this.state.calculatedFee == 0 || this.state.calculatedFee == null || this.state.calculatedFee == undefined ? true : false}
                                />
                            </View>
                        </View>
                        <LoaderView isLoading={this.state.isLoading} />
                    </>
                )}

                <AppAlert
                    visible={this.state.showAlertDialog}
                    alertTxt={this.state.alertTxt}
                    hideAlertDialog={() => {
                        this.setState({ showAlertDialog: false });
                    }}
                />
                <AppAlert
                    visible={this.state.showConfirmDialog}
                    showSuccess={true}
                    alertTxt={this.state.alertTxt}
                    hideAlertDialog={() => {
                        this.setState({
                            showConfirmDialog: false,
                            signingData: "",
                            isShowReq: false,
                        });
                    }}
                />

                <Modal
                    animationType="slide"
                    transparent={true}
                    visible={this.state.pinModal}
                    onRequestClose={() => {
                        this.setState({ pinModal: false });
                    }}
                >
                    <View style={{ flex: 1 }}>
                        <EnterPinForTransaction
                            onBackClick={() => {
                                this.setState({ pinModal: false });
                            }}
                            checkBiometric={true}
                            closeEnterPin={async (pin) => {
                                consoleLogFunc("INSIDE_____", this.state.signingData);

                                let pKey = await getEncryptedData(
                                    `${Singleton.getInstance().defaultEthAddress}_pk`,
                                    pin
                                );
                                this.setState({ pinModal: false }, () => {
                                    setTimeout(async () => {
                                        if (
                                            this.state.signingData?.method == "eth_sendTransaction"
                                        ) {
                                            this.prepareTransactionRaw(pin);
                                        } else if (
                                            this.state.signingData?.method == "eth_signTypedData"
                                        ) {
                                            this.setState({ isLoading: true });
                                            // let pKey = await getEncryptedData(`${Singleton.getInstance().defaultEthAddress}_pk`, pin);
                                            consoleLogFunc("eth_signTypedData----11");

                                            Singleton.getInstance()
                                                .dappApprovalHash(
                                                    pKey,
                                                    this.state.signingData?.newParams
                                                )
                                                .then(async (res) => {
                                                    consoleLogFunc("dappApprovalHash----11");

                                                    let responseVal = {
                                                        id: parseInt(this.state.signingData?.payload?.id),
                                                        result: res,
                                                        jsonrpc: "2.0",
                                                    };

                                                    consoleLogFunc("responseVal----11");

                                                    try {
                                                        await WalletConnectInstance.getInstance().web3Wallet?.respondSessionRequest(
                                                            {
                                                                topic:
                                                                    this.state.signingData?.payload?.topic?.toString(),
                                                                response: responseVal,
                                                            }
                                                        );
                                                        pKey = "";
                                                        Singleton.getInstance().showToast?.show(
                                                            "Transaction Successfully Done.",
                                                            2000
                                                        );
                                                        setTimeout(() => {
                                                            this.setState({
                                                                isLoading: false,
                                                                showConfirmDialog: false,
                                                                signingData: "",
                                                                isShowReq: false,
                                                            });
                                                            global.wcTxnPopup = false;
                                                        }, 800);
                                                    } catch (e) {
                                                        consoleLogFunc("-------approval-------error", e);
                                                        this.setState({ isLoading: false });
                                                        Singleton.getInstance().showToast?.show(`${e}`);
                                                    }
                                                })
                                                .catch((err) => {
                                                    this.setState({ isLoading: false });
                                                    Singleton.getInstance().showToast?.show(
                                                        "Transaction failed."
                                                    );
                                                });
                                        } else if (
                                            this.state.signingData?.method == "personal_sign" ||
                                            this.state.signingData?.method == "solana_signMessage"
                                        ) {
                                            this.setState({ isLoading: true });
                                            let msg = "";
                                            if (
                                                this.state.signingData?.method == "solana_signMessage"
                                            ) {
                                                consoleLogFunc(
                                                    "SOLANA_SIGN_MESSAGE",
                                                    this.state.transactionData?.data
                                                );
                                                let decodeSolanaMessage = base58.decode(
                                                    this.state.transactionData?.data
                                                );
                                                msg = ethers.utils.toUtf8String(decodeSolanaMessage);
                                            } else {
                                                msg = ethers.utils.toUtf8String(
                                                    this.state.transactionData?.data
                                                );
                                            }
                                            consoleLogFunc("MESSAGE::::::: ", msg);

                                            const signedMessage = await signPersonalMessage(
                                                msg,
                                                pKey,
                                                this.state.coinFamily
                                            );
                                            consoleLogFunc(" my msg::::::: ", msg);

                                            let responseVal = {
                                                id: parseInt(this.state.signingData?.payload?.id),
                                                result: signedMessage,
                                                jsonrpc: "2.0",
                                            };
                                            try {
                                                await WalletConnectInstance.getInstance().web3Wallet?.respondSessionRequest(
                                                    {
                                                        topic:
                                                            this.state.signingData?.payload?.topic?.toString(),
                                                        response: responseVal,
                                                    }
                                                );

                                                Singleton.getInstance().showToast?.show(
                                                    "Transaction Successfully Done."
                                                );
                                                setTimeout(() => {
                                                    // Actions.pop()
                                                    // Actions.WalletConnection()
                                                    this.setState({
                                                        isLoading: false,
                                                        showConfirmDialog: false,
                                                        signingData: "",
                                                        isShowReq: false,
                                                    });
                                                }, 800);
                                            } catch (err) {
                                                consoleLogFunc("personal_sign----catch", err);
                                                this.setState({ isLoading: false });
                                                Singleton.getInstance().showToast?.show(
                                                    "Transaction failed."
                                                );
                                            }
                                        }
                                        global.wcTxnData = null;
                                        global.wcTxnPopup = false;
                                    }, 100);
                                });
                            }}
                        />
                    </View>
                </Modal>
            </View>
        );
    }
}

const styles = StyleSheet.create({
    ViewStyle7: {
        fontSize: 16,
    },
    TextStyle2: {
        fontSize: 12,
        fontFamily: Fonts.dmRegular,
    },
    feeView: {
        paddingVertical: 7,
        width: Dimensions.get("screen").width / 4.2,
        borderRadius: 10,
        justifyContent: "center",
        alignItems: "center",
        borderWidth: 1,
    },
    textStyle1: {
        fontSize: 12,
        fontFamily: Fonts.dmRegular,
    },
    blurView: {
        position: "absolute",
        top: 0,
        left: 0,
        bottom: 0,
        right: 0,
        flex: 1,
    },
    touchableStyle: {
        position: "absolute",
        right: 0,
        top: 0,
        height: 40,
        width: 40,
        alignItems: "flex-end",
    },
    ViewStyle1: {
        width: "100%",
        height: 44,
        flexDirection: "row",
        justifyContent: "space-between",
        marginBottom: hasNotchWithIOS() ? 20 : 0,
    },
    ViewStyle2: {
        width: 100,
        height: 44,
        flexDirection: "row",
        justifyContent: "space-between",
        elevation: 2,
    },
    ViewStyle3: {
        width: 40,
        height: "100%",
        justifyContent: "center",
        alignItems: "center",
    },
    ViewStyle4: {
        width: 50,
        height: 44,
        flexDirection: "row",
        justifyContent: "space-between",
    },
    ViewStyle5: {
        justifyContent: "center",
        alignItems: "center",
        marginBottom: 30,
    },
    textStyle: {
        fontFamily: Fonts.dmRegular,
        fontSize: 15,
        color: "#6DAAFF",
    },
    ViewStyle: {
        flexDirection: "row",
        alignItems: "center",
        width: "33%",
    },
    modalView: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        // backgroundColor: ThemeManager.colors.Mainbg,
        // opacity: 0.94,
    },
    modalinner: {
        backgroundColor: ThemeManager.colors.whiteText,
        borderRadius: 18,
        borderWidth: 1,
        // borderColor: Colors.White,
        paddingHorizontal: 15,
        paddingVertical: 20,
        shadowOffset: {
            width: 0,
            height: 0,
        },
        shadowOpacity: 0.2,
        shadowRadius: 2.84,
        elevation: 2,
        width: "85%",
    },
    vwSignTransaction: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "flex-start",
        marginBottom: 14,
    },
    titleSign: {
        fontFamily: Fonts.dmMedium,
        fontSize: 17,
    },
    textLbl: {
        fontFamily: Fonts.dmMedium,
        fontSize: 15,
    },
    txtValue: {
        width: "86%",
        fontFamily: Fonts.dmRegular,
        fontSize: 14,
    },
    dropdown: {
        position: "absolute",
        backgroundColor: "white",
        alignSelf: "flex-end",
        paddingHorizontal: 20,
        top: -10,
        borderRadius: 10,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        elevation: 1,
    },
    searchBtn: {
        width: "12%",
        justifyContent: "center",
    },
    dapHeader: {
        width: "100%",
        flexDirection: "row",
        justifyContent: "space-between",
        marginTop: hasNotchWithIOS()
            ? getDimensionPercentage(60)
            : getDimensionPercentage(0),
        height: hasNotchWithIOS()
            ? getDimensionPercentage(90)
            : getDimensionPercentage(130),
    },
    dapBackView: {
        padding: 8,
        justifyContent: "center",
        width: "8%",
    },
    searchMainView: {
        width: "63%",
        height: "100%",
        alignItems: "center",
        justifyContent: "center",
    },
    searchInnerView: {
        height: 50,
        width: "95%",
        borderRadius: 10,
        borderWidth: 1,
        flexDirection: "row",
    },
    coinView: {
        alignItems: "center",
        width: "18%",
        justifyContent: "center",
    },
    coinView1: {
        flexDirection: "row",
        alignItems: "center",
        width: "15%",
        justifyContent: "flex-start",
    },
    coinImg: {
        marginRight: 2,
        width: 25,
        height: 25,
        borderRadius: 40,
    },
    coinTxt: {
        marginRight: 8,
        fontFamily: Fonts.dmMedium,
        fontSize: 13,
    },
    searchText: {
        paddingLeft: 10,
        fontFamily: Fonts.dmRegular,
        marginRight: 8,
    },
});
export default TransactionRequest;

// export default connect(null, {
//     requestGasEstimation
//   })(TransactionRequest);
