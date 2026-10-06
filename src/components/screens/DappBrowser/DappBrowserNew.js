import React, {Component} from 'react';
import {
  View,
  Image,
  Text,
  TouchableOpacity,
  Platform,
  Modal,
  TextInput,
  Keyboard,
  SafeAreaView,
  ImageBackground,
} from 'react-native';
import {
  requestNonce,
  requestgasprice,
  requestGasEstimation,
  requestSendCoin,
  requestGasLimitForDapp,
  fetchNativePrice,
} from '../../../Redux/Actions';
import {
  bigNumberSafeMath,
  consoleLogFunc,
  exponentialToDecimal,
  getData,
  getEncryptedData,
  saveData,
  toFixed,
  toFixedExp,
} from '../../../Utils/MethodsUtils';
import styles from './DappBrowserStyle';
import {Actions} from '../../../navigation/RootNavigation';
import {Fonts, Images} from '../../../theme';
import {Button, LoaderView, AppAlert} from '../../common';
import RNFS from 'react-native-fs';
import WebView from 'react-native-webview';
import web3 from 'web3';
import {connect} from 'react-redux';
import Singleton from '../../../Singleton';
import * as Constants from '../../../Constants';
import {IS_PRODUCTION} from '../../../EndPoint';
import {ThemeManager} from '../../../../ThemeManager';
import FastImage from 'react-native-fast-image';
import {getNonce, getTotalGasFee} from '../../../Utils/EthUtils';
import {EventRegister} from 'react-native-event-listeners';
import {BackHandler} from 'react-native';
import {LanguageManager} from '../../../../LanguageManager';
import {
  dimen,
  getDimensionPercentage,
  hasNotchWithIOS,
  heightDimen,
  widthDimen,
} from '../../../Utils';
import LinearGradient from 'react-native-linear-gradient';
import {ethers} from 'ethers';
import DeviceInfo from 'react-native-device-info';
import EnterPinForTransaction from '../EnterPinForTransaction/EnterPinForTransaction';
import {getDappProvider} from '../../../Utils/etherProviderUtils';
import {BlurView} from '@react-native-community/blur';
const gasFeeMultiplier = 0.000000000000000001;
const imageBaseURl = 'https://besticon-demo.herokuapp.com/allicons.json?url=';
const {sendTrx, browser, merchantCard} = LanguageManager;

class DappBrowserNew extends Component {
  constructor(props) {
    consoleLogFunc('chk props dapp::::', props);
    super(props);
    this.state = {
      content: '',
      jsContent: '',
      isVisible: false,
      signingData: '',
      calculatedFee: '',
      gasPrice: '',
      gas: '',
      canGoBack: false,
      gasFeeMultiplier: 0.000000000000000001,
      canGoForward: false,
      isLoading: false,
      selectedNetwork: 'Ethereum',
      selectedNetworkImageUri: Constants.ETH_Img,
      chainId: this.props.chainId || 1,
      rpcUrl: this.props.rpcUrl || Singleton.getInstance().ETH_DAPP_RPC_URL,
      url: this.props.url,
      enteredURL: this.props.url,
      isNetworkModalVisible: false,
      showAlertDialog: false,
      alertTxt: '',
      isSearchFocus: false,
      selectedFeeType: 2,
      favoriteArray: [],
      isFavorite: false,
      urlTitle: '',
      isSwitch: false,
      isButtonDisabled: false,
      pinModal: false,
      msgType: '',
      signedData: '',
      isShowEth: true,
      isShowBnb: true,
      isShowMatic: true,
      isPrivateKeyWallet: false,
      fiatPriceByFamily: {},
    };
  }

  getNetworkMeta = (networkName = this.state.selectedNetwork) => {
    return (
      Constants.DAPP_CHAIN_META?.[networkName] ||
      Constants.DAPP_CHAIN_META?.Polygon
    );
  };

  isBinanceNetwork = () => {
    return this.state.selectedNetwork == 'Binance';
  };

  isEthereumNetwork = () => {
    return this.state.selectedNetwork == 'Ethereum';
  };

  isEthOrQubeticsNetwork = () => {
    return (
      this.state.selectedNetwork == 'Ethereum' ||
      this.state.selectedNetwork == 'Qubetics'
    );
  };

  getAdjustedGasPrice = (type, gasResponse) => {
    const metricKey =
      type == 'slow'
        ? 'safe_gas_price'
        : type == 'average'
        ? 'propose_gas_price'
        : 'fast_gas_price';
    const gasValue = gasResponse?.resultList?.[metricKey];

    if (!gasResponse?.resultList) return 0;
    if (!this.isBinanceNetwork()) return gasValue;
    if (Constants.network == 'testnet') return 10 * 10 ** 9;
    return gasValue > 3 ? gasValue : 3;
  };

  fetchAllDappFiatPrices = () => {
    const uniqueCoinFamilies = [
      ...new Set(
        Object.values(Constants.DAPP_CHAIN_META).map(item => item.coinFamily),
      ),
    ];
    const requests = uniqueCoinFamilies.map(coinFamily => {
      const data = {
        fiat_currency: Singleton.getInstance().CurrencySelected,
        coin_family: coinFamily,
      };
      return this.props
        .fetchNativePrice({data})
        .then(value => ({status: 'fulfilled', value}))
        .catch(reason => ({status: 'rejected', reason}));
    });

    Promise.all(requests).then(results => {
      const fiatPriceByFamily = {};
      results.forEach((result, index) => {
        const coinFamily = uniqueCoinFamilies[index];
        if (result?.status == 'fulfilled') {
          fiatPriceByFamily[coinFamily] = Number(
            result?.value?.fiatCoinPrice?.value || 0,
          );
        }
      });
      this.setState({fiatPriceByFamily});
    });
  };

  getFiatPriceByCoinFamily = coinFamily => {
    return Number(this.state.fiatPriceByFamily?.[coinFamily] || 0);
  };

  getSelectedNetworkFiatPrice = () => {
    const selectedNetworkMeta = this.getNetworkMeta();
    return this.getFiatPriceByCoinFamily(selectedNetworkMeta?.coinFamily);
  };

  componentDidMount() {
    EventRegister.addEventListener(Constants.DOWN_MODAL, () => {
      this.setState({showAlertDialog: false, alertTxt: '', isVisible: false});
      if (this.state.signingData) {
        this.closeModal();
      }
    });
    global.isFromUniswap = 'yes';

    this.blur = this.props.navigation.addListener('blur', () => {
      consoleLogFunc('Blur .....');
      if (this.backhandle) this.backhandle?.remove();
      Keyboard.dismiss();
    });
    this.focus = this.props.navigation.addListener('focus', () => {
      this.backhandle = BackHandler.addEventListener(
        'hardwareBackPress',
        this.handleBackButtonClick,
      );
      consoleLogFunc('Focus .....');
      Keyboard.dismiss();
    });

    getData(Constants.MULTI_WALLET_LIST).then(list => {
      const currentWalletList = JSON.parse(list);
      let currentWallet = currentWalletList.find(res => res?.defaultWallet);
      let coinFamily =
        Constants.DAPP_COIN_LIST[this.state.url?.includes('blazpay') ? 3 : 0]
          .coin_family;
      // let coinFamily = Constants.DAPP_COIN_LIST[0].coin_family;
      let coinItem = Constants.DAPP_COIN_LIST[0];
      if (currentWallet?.isPrivateKey) {
        coinFamily = currentWallet?.coinFamily;
        coinItem = Constants.DAPP_COIN_LIST.find(
          res => res?.coin_family == coinFamily,
        );
      }

      this.setState(
        {
          selectedNetwork: coinItem.coin_name,
          isPrivateKeyWallet: true,
          chainId: coinItem.chainId,
          isShowBnb: coinFamily == 1 ? true : false,
          isShowEth: coinFamily == 2 ? true : false,
          isShowMatic: coinFamily == 2 ? true : false,
          selectedNetworkImageUri:
            Constants.COIN_IMAGE_BY_SYMBOL[coinItem?.coin_symbol],
          rpcUrl: this.getRpcUrl(coinFamily),
        },
        () => {
          this.fetchAllDappFiatPrices();
          setTimeout(() => {
            this.connectWithDapp();
          }, 1000);
        },
      );
    });
  }
  connectWithDapp() {
    // var provider = new web3.providers.HttpProvider(this.state.rpcUrl);
    // this.web3 = new web3(provider);
    // const provider = new ethers.providers.JsonRpcProvider(this.state.rpcUrl);
    const provider = getDappProvider(this.state.rpcUrl);
    consoleLogFunc('connectWithDapp----provider', provider);
    this.web3 = provider;
    if (this.state.jsContent === '') {
      if (Platform.OS === 'ios') {
        RNFS.readFile(`${RNFS.MainBundlePath}/trust-min.js`, 'utf8').then(
          content => {
            this.setState({
              jsContent: this.getJavascript(
                this.state.chainId,
                this.state.rpcUrl,
                Singleton.getInstance().defaultEthAddress,
                content,
              ),
              content: content,
            });
          },
        );
      } else {
        RNFS.readFileAssets(`trust-min.js`, 'utf8').then(content => {
          this.setState({
            jsContent: this.getJavascript(
              this.state.chainId,
              this.state.rpcUrl,
              Singleton.getInstance().defaultEthAddress,
              content,
            ),
            content: content,
          });
        });
      }
    }
  }

  /******************************************************************************************/
  handleBackButtonClick() {
    consoleLogFunc('Backhandler Dapp');
    Singleton.bottomBar?.navigateTab('DefiAccessMain');
    Actions.pop();

    // Actions.jump("DefiAccessMain");
    return true;
  }

  /******************************************************************************************/
  componentWillUnmount() {
    global.isFromUniswap = null;
    clearTimeout(this.reloadWebView);
    this.backhandle?.remove();
    this.blur?.();
    this.focus?.();
  }

  /******************************************************************************************/
  onLoadStart = event => {
    this.setState({isLoading: true});
  };

  /******************************************************************************************/
  onLoadEnd = event => {
    this.setState({isLoading: false});
  };

  /******************************************************************************************/
  onShouldStartLoadWithRequest = () => {
    return true;
  };

  /******************************************************************************************/
  onMessage = async ({nativeEvent}) => {
    let message = JSON.parse(nativeEvent.data);
    consoleLogFunc('---------message------', message);
    consoleLogFunc('---------nativeEvent.data------', nativeEvent.data);
    // consoleLogFunc('Singleton.getInstance().MATIC_RPC_URL-----', Singleton.getInstance().MATIC_RPC_URL);
    consoleLogFunc(
      'Singleton.getInstance().ETH_DAPP_RPC_URL-----',
      Singleton.getInstance().ETH_DAPP_RPC_URL,
    );
    consoleLogFunc(
      'Singleton.getInstance().BSC_RPC_URL-----',
      Singleton.getInstance().BSC_RPC_URL,
    );
    consoleLogFunc(
      Singleton.getInstance().defaultEthAddress,
      'Singleton.getInstance().defaultEthAddress',
    );

    this.setState({msgType: message.name});
    if (message.name == 'signTransaction') {
      if (!message.object.value) message.object.value = '0x0';
      consoleLogFunc('---------message.object.gas------', message.object.gas);

      if (!message.object.gas) {
        consoleLogFunc('---------message.object.gas------11111');
        try {
          const selectedNetworkMeta = this.getNetworkMeta();
          const gasLimitRpcUrl = this.isEthereumNetwork()
            ? Singleton.getInstance().ETH_DAPP_RPC_URL
            : this.isBinanceNetwork()
            ? Singleton.getInstance().BSC_RPC_URL
            : selectedNetworkMeta.backendCoinType == 'qubetics'
            ? Singleton.getInstance().TICS_RPC_URL
            : Singleton.getInstance().MATIC_RPC_URL;
          let res = await this.props.requestGasLimitForDapp({
            url: gasLimitRpcUrl,
            data: message.object,
          });
          consoleLogFunc('res.result', res.result);
          if (res.result) {
            message.object.gas = res.result;
          } else {
            message.object.gas = '0x238ec';
          }
        } catch (error) {
          consoleLogFunc('error------11111', error);

          message.object.gas = '0x238ec';
        }
      }
      this.setState({signingData: message});
      consoleLogFunc('this.hex2dec(message.ob==', message.object.value);

      consoleLogFunc(
        'this.hex2dec(message.object.value)==',
        this.hex2dec(message.object.value),
      );
      this.getNonceAndGas(
        this.hex2dec(message.object.value),
        this.getNetworkMeta()?.txSymbol,
      );
    } else if (message.name == 'requestAccounts') {
      /******************************************* requestAccounts ***********************************************/
      let js = `trustwallet.${message?.network}.setAddress('${
        Singleton.getInstance().defaultEthAddress
      }');`;
      consoleLogFunc('js>>>>', js);

      this.webview?.injectJavaScript(js);
      let mmid = message.id;
      let js1 = `trustwallet.${message?.network}.sendResponse(${mmid}, ['${
        Singleton.getInstance().defaultEthAddress
      }'])`;
      consoleLogFunc('js>>>>', js1);

      this.webview?.injectJavaScript(js1);
    } else if (
      /********************************************** signPersonalMessage ********************************************/
      message.name == 'signPersonalMessage' ||
      message.name == 'signMessage' ||
      message.name == 'signTypedMessage'
    ) {
      consoleLogFunc('message.name==1', message.name);
      this.setState({
        signedData: message,
        pinModal: true,
      });
    } else if (message.name == 'switchEthereumChain') {
      consoleLogFunc('message.name==', message.name);
      let mmid = message.id;
      let chainId = message?.object?.chainId;
      chainId = parseInt(chainId, 16);
      consoleLogFunc('chainId----', chainId);
      let item = Constants.DAPP_COIN_LIST.find(res => res?.chainId == chainId);
      consoleLogFunc('item-----', item);

      if (item == undefined) {
        let js1 = `trustwallet.${message?.network}.sendError(${mmid}, "not supported")`;
        this.webview.injectJavaScript(js1);
        return;
      }

      let rpcUrl = this.getRpcUrl(item.coin_family);
      consoleLogFunc('item-----rpcUrl', rpcUrl);

      this.setState(
        {
          selectedNetwork: item.coin_name,
          isPrivateKeyWallet: true,
          chainId: item.chainId,
          selectedNetworkImageUri:
            Constants.COIN_IMAGE_BY_SYMBOL[item?.coin_symbol],
          rpcUrl: rpcUrl,
        },
        () => {
          this.fetchAllDappFiatPrices();

          // let provider = new web3.providers.HttpProvider(rpcUrl);
          // this.web3 = new web3(provider);
          // const provider = new ethers.providers.JsonRpcProvider(rpcUrl);
          const provider = getDappProvider(rpcUrl);
          consoleLogFunc('item-----provider', provider);

          this.web3 = provider;
          let script = this.switchChainScript(chainId, rpcUrl);
          this.webview.injectJavaScript(script);
          // let js = `trustwallet.ethereum.emitChainChanged('${web3.utils.toHex(message.object.chainId)}')`;
          let js = `trustwallet.ethereum.emitChainChanged('${ethers.utils.hexValue(
            message.object.chainId,
          )}')`;
          this.webview.injectJavaScript(js);
          let js1 = `trustwallet.${message?.network}.sendResponse(${mmid}, null)`;
          this.webview.injectJavaScript(js1);
          // this.web3 = new web3(provider);
        },
      );
    }
  };

  getRpcUrl(coinFamily) {
    if (coinFamily == 1) {
      return Singleton.getInstance().BSC_RPC_URL;
    } else if (coinFamily == 2) {
      return Singleton.getInstance().ETH_DAPP_RPC_URL;
    } else if (coinFamily == 7) {
      return Singleton.getInstance().TICS_RPC_URL;
    } else {
      return Singleton.getInstance().MATIC_RPC_URL;
    }
  }

  /******************************************************************************************/
  getJavascript = function (chainId, rpcUrl, address, jsContent) {
    let source = '';
    consoleLogFunc('chainId:', chainId, 'rpcUrl:', rpcUrl, 'address:', address);

    source = `
  ${jsContent}
  (function() {
    let config = {
      ethereum: {
        chainId: ${chainId},
        rpcUrl: '${rpcUrl}',
        address:'${address}'
    }
    };
    trustwallet.ethereum = new trustwallet.Provider(config);
    trustwallet.postMessage = (jsonString) => {
      window.ReactNativeWebView?.postMessage(JSON.stringify(jsonString))
    };
    window.ethereum = trustwallet.ethereum;
    const EIP6963Icon = '${Constants.APP_LOGO_BASE64}';
      
      const info = {
        uuid: crypto.randomUUID(),
        name: 'QubeticsWallet',
        icon: EIP6963Icon,
        rdns: 'com.qubetics.wallet',
      };

      const announceEvent = new CustomEvent('eip6963:announceProvider', {
        detail: Object.freeze({ info, provider: ethereum }),
      });

      window.dispatchEvent(announceEvent);

      window.addEventListener('eip6963:requestProvider', () => {
         window.dispatchEvent(announceEvent);
      });
})();
  `;
    // consoleLogFunc("source:::::", source);
    return source;
  };

  /******************************************************************************************/
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

  /******************************************************************************************/
  hex2dec(num) {
    return this.ConvertBase(num).from(16).to(10);
  }

  renderBlurView() {
    return Platform.OS === 'ios' ? (
      <View style={[styles.blurView, {backgroundColor: 'rgba(0,0,0,0.6)'}]} />
    ) : (
      <BlurView
        style={styles.blurView}
        blurType="dark"
        blurAmount={3}
        // reducedTransparencyFallbackColor="white"
      />
    );
  }

  /******************************************************************************************/
  async getNonceAndGas(amount, coinsym) {
    const selectedNetworkMeta = this.getNetworkMeta();
    const selectedCoinSymbol = coinsym || selectedNetworkMeta?.txSymbol;
    const nonceReq = {
      amount: amount,
    };
    consoleLogFunc(
      ' this.state.selectedNetwork:::::',
      this.state.selectedNetwork,
    );
    consoleLogFunc(' amount:::::', amount);
    consoleLogFunc(' coinsym:::::', coinsym);

    if (this.isEthereumNetwork()) {
      try {
        const Totalfee = await getTotalGasFee();
        const gasLimit = this.hex2dec(this.state.signingData.object.gas);
        const value = exponentialToDecimal(
          Totalfee * this.state.gasFeeMultiplier * gasLimit,
        );
        consoleLogFunc(' value:::::', value);
        const fee = parseFloat(value).toFixed(8);
        consoleLogFunc(' fee:::::', fee);
        const non = await getNonce();
        consoleLogFunc(' non:::::', non);
        this.nonce = non;
        this.setState({
          isVisible: true,
          gasEstimate: gasLimit,
          gasPrice: Totalfee,
          calculatedFee: fee,
        });
      } catch (error) {
        consoleLogFunc(' error:::::', error);
      }
    } else {
      getData(Constants.ACCESS_TOKEN).then(token => {
        let gasEstimationReq = {
          from: Singleton.getInstance().defaultEthAddress,
          to: Singleton.getInstance().defaultEthAddress,
          amount: '',
        };
        this.props
          .requestNonce({
            url: `${selectedNetworkMeta?.backendCoinType}/${selectedCoinSymbol}/nonce`,
            coinSymbol: selectedCoinSymbol,
            nonceReq,
            token,
          })
          .then(result => {
            consoleLogFunc('requestNonce==result:::::', result);

            this.nonce = result.data.nonce;
            this.props
              .requestGasEstimation({
                url: `${selectedNetworkMeta?.backendCoinType}/${selectedNetworkMeta?.txSymbol}/gas_estimation`,
                coinSymbol: selectedNetworkMeta?.txSymbol,
                gasEstimationReq,
                token,
              })
              .then(res => {
                consoleLogFunc('gasPriceDetail: bnb', res);
                consoleLogFunc(
                  'this.hex2dec(this.state.signingData.object.gas)===-=-==-=-==',
                  this.hex2dec(this.state.signingData.object.gas),
                );
                var fast = res?.resultList
                  ? res.resultList.propose_gas_price > 3
                    ? res.resultList.propose_gas_price
                    : 3
                  : res?.gas_price || 1;
                var initialValue =
                  10 ** 9 *
                  fast *
                  this.hex2dec(this.state.signingData.object.gas);
                var fee = initialValue * gasFeeMultiplier;
                consoleLogFunc('initialValue===>', initialValue + ' ' + fee);
                this.setState({
                  gas: res,
                  isVisible: true,
                  calculatedFee: fee.toFixed(5),
                  gasPrice: fast,
                  isLoading: false,
                });
              })
              .catch(err => {
                consoleLogFunc('Error: ', err);
                this.setState({isLoading: false});
              });
          })
          .catch(err => {
            consoleLogFunc('Error: ', err);
            this.setState({isLoading: false});
          });
      });
    }
  }

  /******************************************************************************************/
  async signRawTxn(pin) {
    consoleLogFunc('hellooooo');
    //isVisible: true,
    this.setState({isLoading: true});
    const selectedNetworkMeta = this.getNetworkMeta();
    let pKey = await getEncryptedData(
      `${Singleton.getInstance().defaultEthAddress}_pk`,
      pin,
    );
    const gasLimit = this.state.signingData.object.gas; // in hex
    const gasPrice = this.isBinanceNetwork()
      ? IS_PRODUCTION == 0
        ? 10 * 10 ** 9
        : this.state.gasPrice
      : this.state.gasPrice; // in hex
    const amount = (
      this.hex2dec(this.state.signingData.object.value) /
      10 ** 18
    ).toString();
    const nonce = this.nonce;
    Singleton.getInstance()
      .getsignRawTxnDapp(
        pKey,
        amount,
        gasPrice,
        gasLimit,
        nonce,
        this.state.signingData.object.to,
        this.state.signingData.object.from,
        this.state.signingData.object.data,
        selectedNetworkMeta?.txSymbol,
      )
      .then(serializedTx => {
        consoleLogFunc('this.serializedTx-------', serializedTx);
        if (serializedTx != null) {
          this.setState({isLoading: true});
          this.sendCoin(serializedTx);
        } else {
          this.setState({isLoading: false});
          let js = `trustwallet.ethereum.sendError(${this.state.signingData.id}, 'Something went wrong.')`;
          this.webview?.injectJavaScript(js);
        }
        pKey = '';
      })
      .catch(err => {
        this.setState({isLoading: false});
        pKey = '';
      });
  }

  /******************************************************************************************/
  sendCoin(serializedTx) {
    const selectedNetworkMeta = this.getNetworkMeta();
    const nonce = this.nonce;
    const tx_raw = serializedTx;
    const from = this.state.signingData.object.from;
    const to = this.state.signingData.object.to;
    const amount = (
      this.hex2dec(this.state.signingData.object.value) /
      10 ** 18
    ).toString();
    const gas_estimate = this.hex2dec(this.state.signingData.object.gas);
    const eth_gas_price = this.state.gasPrice;
    const coinsym = selectedNetworkMeta?.txSymbol;
    const coinType = selectedNetworkMeta?.backendCoinType;
    const fee = toFixedExp(parseFloat(this.state.calculatedFee), 8);
    const sendCoinReq = {
      nonce: nonce,
      tx_raw: tx_raw,
      from: from,
      to: to,
      amount:
        this.hex2dec(this.state.signingData.object.value) == 0 ? fee : amount,
      add_amount:
        this.hex2dec(this.state.signingData.object.value) == 0 ? 1 : 0,
      gas_estimate: gas_estimate,
      gas_price: this.isBinanceNetwork()
        ? IS_PRODUCTION == 0
          ? 10 * 10 ** 9
          : eth_gas_price
        : this.isEthereumNetwork()
        ? eth_gas_price
        : eth_gas_price * 10 ** 9,
      tx_type: 'dapp',
    };
    consoleLogFunc('The sendCoinReq txn is ', sendCoinReq);
    getData(Constants.ACCESS_TOKEN).then(token => {
      consoleLogFunc('The raw txn is ' + tx_raw);
      this.props
        .requestSendCoin({
          url: `${coinType}/${coinsym}/send`,
          coinSymbol: coinsym,
          sendCoinReq,
          token,
        })
        .then(res => {
          consoleLogFunc(
            '-----------------------Response------------',
            res.tx_hash,
          );
          this.setState({
            isVisible: false,
            isLoading: false,
            selectedFeeType: 2,
          });
          let mmid = this.state.signingData.id;
          let hash = res.tx_hash;
          let js = `trustwallet.ethereum.sendResponse(${mmid}, '${hash}')`;
          this.webview?.injectJavaScript(js);
          Singleton.getInstance().showToast.show(
            res?.message || 'Transaction Successful',
          );
        })
        .catch(err => {
          consoleLogFunc('Error: ', err);
          let js = `trustwallet.ethereum.sendError(${
            this.state.signingData.id
          }, '${err.message || err}')`;
          this.webview?.injectJavaScript(js);
          this.setState({
            isVisible: false,
            selectedFeeType: 2,
            isLoading: false,
            alertTxt: err,
            showAlertDialog: true,
          });
        });
    });
  }

  /******************************************************************************************/
  calculateFee(type) {
    let res = this.state.gas;
    // consoleLogFunc("response=-=--===", res)
    var fast = 0;
    if (res) {
      fast = this.getAdjustedGasPrice(type, res);

      // consoleLogFunc("fast=-=-==", fast)
      // consoleLogFunc("this.state.signingData.object=-=-==", this.state.signingData.object)

      // consoleLogFunc("this.hex2dec(this.state.signingData.object.gas-====", this.hex2dec(this.state.signingData.object.gas))
      var initialValue =
        fast *
        10 ** 9 *
        parseFloat(this.hex2dec(this.state.signingData.object.gas));
      consoleLogFunc(
        'initialValue-=-=======',
        fast,
        initialValue,
        bigNumberSafeMath(initialValue, '*', gasFeeMultiplier),
      );
      return toFixed(
        exponentialToDecimal(
          bigNumberSafeMath(initialValue, '*', gasFeeMultiplier),
        ),
        5,
      );
    } else {
      return (0 * gasFeeMultiplier).toFixed(5);
    }
  }

  /******************************************************************************************/
  onClickAction(type) {
    consoleLogFunc('chk type:::::', type);
    if (type == 'slow') {
      const res = this.state.gas;
      const standard = this.getAdjustedGasPrice('slow', res);
      const initialValue =
        10 ** 9 * standard * this.hex2dec(this.state.signingData.object.gas);
      const fee = initialValue * gasFeeMultiplier;
      this.setState({
        selectedFeeType: 1,
        isVisible: true,
        calculatedFee: fee.toFixed(5),
        gasPrice: standard,
      });
    } else if (type == 'average') {
      let res = this.state.gas;
      const fast = this.getAdjustedGasPrice('average', res);
      const initialValue =
        10 ** 9 * fast * this.hex2dec(this.state.signingData.object.gas);
      const fee = initialValue * gasFeeMultiplier;
      this.setState({
        selectedFeeType: 2,
        isVisible: true,
        calculatedFee: fee.toFixed(5),
        gasPrice: fast,
      });
    } else if (type == 'fast') {
      let res = this.state.gas;
      const fast = this.getAdjustedGasPrice('fast', res);
      const initialValue =
        10 ** 9 * fast * this.hex2dec(this.state.signingData.object.gas);
      const fee = initialValue * gasFeeMultiplier;
      this.setState({
        selectedFeeType: 3,
        isVisible: true,
        calculatedFee: fee.toFixed(5),
        gasPrice: fast,
      });
    }
  }

  /******************************************************************************************/
  calculateFiat(type) {
    const res = this.state.gas;
    const selectedNetworkMeta = this.getNetworkMeta();
    var fast = 0;
    if (res) {
      fast = this.getAdjustedGasPrice(type, res);
      const initialValue =
        fast * 10 ** 9 * this.hex2dec(this.state.signingData.object.gas);
      const fee = initialValue * gasFeeMultiplier;
      const networkFiatPrice = this.getFiatPriceByCoinFamily(
        selectedNetworkMeta?.coinFamily,
      );
      return toFixedExp(bigNumberSafeMath(fee, '*', networkFiatPrice), 4);
    }
  }

  /******************************************************************************************/
  renderSlowStandardFast() {
    const selectedNetworkMeta = this.getNetworkMeta();
    return (
      <View>
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            marginTop: 8,
          }}>
          <View>
            <TouchableOpacity
              onPress={() => this.onClickAction('slow')}
              style={[
                styles.feeView,
                {
                  borderColor:
                    this.state.selectedFeeType == 1
                      ? ThemeManager.colors.primaryColor
                      : ThemeManager.colors.borderColor11,
                },
              ]}>
              <Text
                allowFontScaling={false}
                style={[
                  styles.TextStyle2,
                  {color: ThemeManager.colors.blackWhiteText, marginTop: 3},
                ]}>
                {' '}
                {this.calculateFee('slow')} {selectedNetworkMeta?.displaySymbol}
              </Text>
              <Text
                allowFontScaling={false}
                style={[
                  styles.TextStyle2,
                  {color: ThemeManager.colors.blackWhiteText},
                ]}>
                {this.calculateFiat('slow')}{' '}
                {Singleton.getInstance().CurrencySelected}
              </Text>
            </TouchableOpacity>
            <Text
              allowFontScaling={false}
              style={{
                color:
                  this.state.selectedFeeType == 1
                    ? ThemeManager.colors.primaryColor
                    : ThemeManager.colors.blackWhiteText,
                marginTop: 5,
                textAlign: 'center',
                fontSize: 14,
                fontFamily: Fonts.dmMedium,
              }}>
              {sendTrx.slow}
            </Text>
          </View>

          <View>
            <TouchableOpacity
              onPress={() => this.onClickAction('average')}
              style={[
                styles.feeView,
                {
                  borderColor:
                    this.state.selectedFeeType == 2
                      ? ThemeManager.colors.primaryColor
                      : ThemeManager.colors.borderColor11,
                },
              ]}>
              <Text
                allowFontScaling={false}
                style={[
                  styles.TextStyle2,
                  {color: ThemeManager.colors.blackWhiteText, marginTop: 3},
                ]}>
                {' '}
                {this.calculateFee('average')}{' '}
                {selectedNetworkMeta?.displaySymbol}
              </Text>
              <Text
                allowFontScaling={false}
                style={[
                  styles.TextStyle2,
                  {color: ThemeManager.colors.blackWhiteText},
                ]}>
                {this.calculateFiat('average')}{' '}
                {Singleton.getInstance().CurrencySelected}
              </Text>
            </TouchableOpacity>
            <Text
              allowFontScaling={false}
              style={{
                color:
                  this.state.selectedFeeType == 2
                    ? ThemeManager.colors.primaryColor
                    : ThemeManager.colors.blackWhiteText,
                marginTop: 5,
                textAlign: 'center',
                fontSize: 14,
                fontFamily: Fonts.dmMedium,
              }}>
              {sendTrx.Average}
            </Text>
          </View>

          <View>
            <TouchableOpacity
              onPress={() => this.onClickAction('fast')}
              style={[
                styles.feeView,
                {
                  borderColor:
                    this.state.selectedFeeType == 3
                      ? ThemeManager.colors.primaryColor
                      : ThemeManager.colors.borderColor11,
                },
              ]}>
              <Text
                allowFontScaling={false}
                style={[
                  styles.TextStyle2,
                  {color: ThemeManager.colors.blackWhiteText, marginTop: 3},
                ]}>
                {' '}
                {this.calculateFee('fast')} {selectedNetworkMeta?.displaySymbol}
              </Text>
              <Text
                allowFontScaling={false}
                style={[
                  styles.TextStyle2,
                  {color: ThemeManager.colors.blackWhiteText},
                ]}>
                {this.calculateFiat('fast')}{' '}
                {Singleton.getInstance().CurrencySelected}
              </Text>
            </TouchableOpacity>
            <Text
              allowFontScaling={false}
              style={{
                color:
                  this.state.selectedFeeType == 3
                    ? ThemeManager.colors.primaryColor
                    : ThemeManager.colors.blackWhiteText,
                marginTop: 5,
                textAlign: 'center',
                fontSize: 14,
                fontFamily: Fonts.dmMedium,
              }}>
              {sendTrx.Fast}
            </Text>
          </View>
        </View>
      </View>
    );
  }

  /******************************************************************************************/
  validURL(str) {
    var pattern = new RegExp(
      '^(https?:\\/\\/)?' + // protocol
        '((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.)+[a-z]{2,}|' + // domain name
        '((\\d{1, 3}\\.){3}\\d{1, 3}))' + // OR ip (v4) address
        '(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*' + // port and path
        '(\\?[;&a-z\\d%_.~+=-]*)?' + // query string
        '(\\#[-a-z\\d_]*)?$',
      'i',
    ); // fragment locator
    return !!pattern.test(str);
  }

  /******************************************************************************************/
  setUrl() {
    consoleLogFunc('this.state.enteredURL:::::', this.state.enteredURL);
    if (this.validURL(this.state.enteredURL)) {
      if (!this.state.enteredURL.startsWith('http')) {
        this.setState({url: 'https://' + this.state.enteredURL});
      } else {
        this.setState({url: this.state.enteredURL});
        this.webview?.reload();
      }
    } else {
      this.setState({
        url: 'https://www.google.com/search?q=' + this.state.enteredURL,
      });
    }
  }

  switchChainScript(chainId, rpcUrl) {
    const script = `(async () => {
      try {
        let changeEVMConfig = {
        ethereum: {
          address: "${Singleton.getInstance().defaultEthAddress}",
          chainId: ${ethers.utils.hexValue(chainId)},
          rpcUrl: "${rpcUrl}"
        }
      };
      ethereum.setConfig(changeEVMConfig);
      trustwallet.ethereum.emitChainChanged('${ethers.utils.hexValue(
        chainId,
      )}');
      true;
  } catch (error) {
  console.error('Error switching chain:', error);
  trustwallet.ethereum.sendError(null, "Error switching chain:");
}
})();`;
    return script;
  }
  /******************************************************************************************/
  onChangeText(text) {
    if (Constants.NO_SPACE_REGEX.test(text)) {
      this.setState({enteredURL: text});
    }
  }

  /******************************************************************************************/
  closeModal() {
    const js = `trustwallet.ethereum.sendError(${this.state.signingData?.id}, 'Cancelled')`;
    consoleLogFunc('----------------js-----------', js);
    this.webview?.injectJavaScript(js);
    this.setState({isVisible: false, selectedFeeType: 2});
  }

  /******************************************************************************************/

  /******************************************************************************************/
  getIconUrl(url) {
    consoleLogFunc('chk url:::::', url);
    const newStr = url.slice(0, url.indexOf('/', 8));
    return new Promise((resolve, reject) => {
      fetch(`${imageBaseURl}${newStr}`, {method: 'GET'})
        .then(async res => {
          let jsonVal = await res.json();
          if (jsonVal?.icons?.length > 0) {
            resolve({icon: jsonVal.icons[0].url});
          } else {
            resolve({icon: ''});
          }
        })
        .catch(err => {
          resolve({icon: ''});
        });
    });
  }

  /******************************************************************************************/

  async addToHistory(url, urlTitle) {
    clearTimeout(this.historyTimeout);
    this.historyTimeout = setTimeout(async () => {
      let historyData = await getData(Constants.DAPP_HISTORY);
      historyData = historyData == null ? [] : JSON.parse(historyData);
      historyData = [
        {
          url: url,
          title: urlTitle,
          iconUrl: `https://t2.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=http://${this.cleanUrl(
            url,
          )}&size=128`,
          timestamp: new Date().getTime(),
        },
        ...historyData,
      ];
      consoleLogFunc('historyData>>>', historyData);

      if (historyData?.length > 50) {
        historyData = historyData.slice(0, 50);
      }

      saveData(Constants.DAPP_HISTORY, JSON.stringify(historyData));
    }, 1200);
  }

  cleanUrl = url => {
    // clean url
    let cleanedUrl = url.includes('https')
      ? url.slice(8)
      : url.includes('http')
      ? url.slice(7)
      : url;
    cleanedUrl = cleanedUrl.includes('/')
      ? cleanedUrl.split('/')[0]
      : cleanedUrl;
    return cleanedUrl;
  };

  /******************************************************************************************/
  render() {
    const selectedNetworkMeta = this.getNetworkMeta();
    const isEthOrQubeticsNetwork = this.isEthOrQubeticsNetwork();
    const networkFiatPrice = this.getSelectedNetworkFiatPrice();

    return (
      <>
        <ImageBackground
          source={ThemeManager.ImageIcons.mainBgImgNew}
          style={{backgroundColor: ThemeManager.colors.mainBgNew}}>
          <View
            style={{
              ...styles.dapHeader,
              paddingTop:
                Platform.OS == 'ios'
                  ? DeviceInfo.hasNotch() || DeviceInfo.hasDynamicIsland()
                    ? getDimensionPercentage(0)
                    : getDimensionPercentage(30)
                  : getDimensionPercentage(30),
            }}>
            <TouchableOpacity
              disabled={this.state.isButtonDisabled}
              onPress={() => {
                // Singleton.bottomBar?.navigateTab("DefiAccessMain");
                // Actions.jump("DefiAccessMain");
                Actions.pop();
                setTimeout(() => {
                  this.setState({isButtonDisabled: false});
                }, 2000);
              }}
              style={styles.dapBackView}>
              <Image
                style={{
                  marginRight: 2,
                  tintColor: ThemeManager.colors.blackWhiteText,
                }}
                source={Images.arrow_back}
              />
            </TouchableOpacity>

            <View style={[styles.searchMainView, {width: '90%'}]}>
              <View
                style={{
                  ...styles.searchInnerView,
                  borderColor: ThemeManager.colors.searchBorderColor,
                }}>
                <TextInput
                  style={{
                    ...styles.searchText,
                    color: ThemeManager.colors.TextColor,
                    width: this.state.isSearchFocus ? '82%' : '95%',
                  }}
                  placeholder="https://"
                  value={this.state.enteredURL}
                  onChangeText={text => {
                    this.onChangeText(text);
                  }}
                  onBlur={() => {
                    this.setUrl();
                    this.setState({isSearchFocus: false});
                  }}
                  onFocus={() => {
                    this.setState({isSearchFocus: true});
                  }}
                  autoCorrect={false}
                  autoCapitalize={'none'}
                  allowFontScaling={false}
                />
                {this.state.isSearchFocus && (
                  <TouchableOpacity
                    style={[styles.searchBtn]}
                    onPress={() => {
                      this.setState({enteredURL: ''});
                    }}>
                    <Image
                      style={{
                        tintColor: ThemeManager.colors.TextColor,
                      }}
                      source={Images.close_icon}
                    />
                  </TouchableOpacity>
                )}
              </View>
            </View>

            {/* <TouchableOpacity
              style={[styles.coinView]}
              onPress={() => {
                this.setState({ isNetworkModalVisible: true });
              }}
            >
              <FastImage
                style={styles.coinImg}
                source={{
                  uri: this.state.selectedNetworkImageUri,
                  priority: FastImage.priority.normal,
                }}
                resizeMode={FastImage.resizeMode.contain}
              />
            </TouchableOpacity> */}
          </View>
        </ImageBackground>

        <View style={{flex: 1}}>
          {this.state.jsContent !== '' && (
            <WebView
              forceDarkOn={true}
              setSupportMultipleWindows={false}
              onShouldStartLoadWithRequest={this.onShouldStartLoadWithRequest}
              // onStartShouldSetResponder={() => this.state.isNetworkModalVisible ? false : true}
              ref={ref => (this.webview = ref)}
              source={{uri: this.state.url}}
              injectedJavaScriptBeforeContentLoaded={this.state.jsContent}
              style={{flex: 1}}
              content
              onMessage={this.onMessage}
              onNavigationStateChange={navState => {
                consoleLogFunc(
                  this.state.chainId,
                  'chk navState.url:::::',
                  navState.url,
                );
                this.setState({
                  canGoBack: navState.canGoBack,
                  canGoForward: navState.canGoForward,
                  enteredURL: navState.url,
                  urlTitle: navState.title,
                });
                this.addToHistory(navState.url, navState.title);
              }}
              startInLoadingState={false}
              sendCookies
              javascriptEnabled
              allowsInlineMediaPlayback
              useWebkit
              testID={'browser-webview'}
              originWhitelist={['http://*', 'https://*', 'intent://*']}
              // originWhitelist={['http://*', 'https://*', 'intent://*']}
              // originWhitelist={["*"]}
            />
          )}
          {this.state.isNetworkModalVisible && (
            <View
              style={[
                styles.dropdown,
                {backgroundColor: ThemeManager.colors.searchBg},
              ]}>
              {this.state.isShowEth && (
                <TouchableOpacity
                  style={{padding: 10}}
                  onPress={() => {
                    this.onPressEth();
                  }}>
                  <View style={{flexDirection: 'row'}}>
                    <FastImage
                      style={{marginRight: 10, width: 20, height: 20}}
                      source={{
                        uri: Constants.ETH_Img,
                        priority: FastImage.priority.normal,
                      }}
                      resizeMode={FastImage.resizeMode.contain}
                    />
                    <Text
                      allowFontScaling={false}
                      style={{
                        ...styles.textStyle,
                        color: ThemeManager.colors.settingsText,
                      }}>
                      {browser.Ethereum}
                    </Text>
                  </View>
                </TouchableOpacity>
              )}
              {this.state.isShowBnb && (
                <TouchableOpacity
                  style={{padding: 10}}
                  onPress={() => {
                    this.onPressBnb();
                  }}>
                  <View style={{flexDirection: 'row'}}>
                    <FastImage
                      style={{
                        marginRight: 10,
                        width: 20,
                        height: 20,
                        borderRadius: 45,
                      }}
                      source={{
                        uri: Constants.BSC_Img,
                        priority: FastImage.priority.normal,
                      }}
                      resizeMode={FastImage.resizeMode.contain}
                    />
                    <Text
                      allowFontScaling={false}
                      style={{
                        ...styles.textStyle,
                        color: ThemeManager.colors.settingsText,
                      }}>
                      {browser.Bnb}
                    </Text>
                  </View>
                </TouchableOpacity>
              )}

              {this.state.isShowMatic && (
                <TouchableOpacity
                  style={{padding: 10}}
                  onPress={() => {
                    this.onPressMatic();
                  }}>
                  <View style={{flexDirection: 'row'}}>
                    <FastImage
                      style={{marginRight: 10, width: 20, height: 20}}
                      source={{
                        uri: Constants.MATIC_Img,
                        priority: FastImage.priority.normal,
                      }}
                      resizeMode={FastImage.resizeMode.contain}
                    />
                    <Text
                      allowFontScaling={false}
                      style={{
                        ...styles.textStyle,
                        color: ThemeManager.colors.settingsText,
                      }}>
                      {browser.Matic}
                    </Text>
                  </View>
                </TouchableOpacity>
              )}
            </View>
          )}
        </View>
        {/* /****************************************************************************************** */}
        <View style={styles.ViewStyle1}>
          <View style={styles.ViewStyle2}>
            <TouchableOpacity
              style={styles.ViewStyle3}
              onPress={() => this.webview?.goBack()}
              disabled={!this.state.canGoBack}>
              <Image
                style={[
                  {
                    width: 25,
                    height: 25,
                    tintColor: ThemeManager.colors.statusBarColor1,
                  },
                  this.state.canGoBack ? {opacity: 1} : {opacity: 0.2},
                ]}
                source={Images.left_arrow}
              />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.ViewStyle3}
              onPress={() => this.webview?.goForward()}
              disabled={!this.state.canGoForward}>
              <Image
                style={[
                  {
                    transform: [{rotate: '180deg'}],
                    width: 25,
                    height: 25,
                    tintColor: ThemeManager.colors.statusBarColor1,
                  },
                  this.state.canGoForward ? {opacity: 1} : {opacity: 0.2},
                ]}
                source={Images.left_arrow}
              />
            </TouchableOpacity>
          </View>

          <View style={styles.ViewStyle4}>
            <TouchableOpacity
              style={styles.ViewStyle3}
              onPress={() => this.webview?.reload()}>
              <Image
                style={{
                  width: 25,
                  height: 25,
                  tintColor: ThemeManager.colors.statusBarColor1,
                }}
                source={Images.reload}
              />
            </TouchableOpacity>
          </View>
        </View>
        {Platform.OS != 'ios' && (
          <LoaderView isLoading={this.state.isLoading} />
        )}
        {/* </SafeAreaView> */}

        {/* *************************************************** Confirm Transaction ********************************************* */}
        <Modal
          onRequestClose={() => this.closeModal()}
          visible={this.state.isVisible}
          animationType="fade"
          style={{margin: 0, justifyContent: 'flex-end'}}>
          {this.state.signingData && this.state.signingData.object && (
            <>
              {this.renderBlurView()}
              <View
                style={{
                  ...styles.modalView,
                  // borderColor: ThemeManager.colors.borderColor,
                  // backgroundColor:'transparent',
                }}>
                <View
                  style={{
                    ...styles.modalinner,
                    borderColor: ThemeManager.colors.borderColor,
                    backgroundColor: ThemeManager.colors.whiteBlacktext,
                  }}>
                  <View style={styles.ViewStyle5}>
                    <Text
                      allowFontScaling={false}
                      style={{
                        ...styles.titleSign,
                        color: ThemeManager.colors.blackWhiteText,
                      }}>
                      {browser.confirmTransaction}
                    </Text>
                    <TouchableOpacity
                      style={styles.touchableStyle}
                      onPress={() => {
                        this.closeModal();
                      }}>
                      <Image
                        style={{
                          tintColor: ThemeManager.colors.blackWhiteText,
                        }}
                        source={Images.close_icon}
                      />
                    </TouchableOpacity>
                  </View>
                  <View style={{gap: 10}}>
                    <View style={styles.vwSignTransaction}>
                      <Text
                        allowFontScaling={false}
                        style={[
                          styles.textLbl,
                          {color: ThemeManager.colors.blackWhiteText},
                        ]}>
                        {browser.to}
                      </Text>
                      <Text
                        allowFontScaling={false}
                        style={[
                          styles.txtValue,
                          {color: ThemeManager.colors.placeholderColorNew},
                        ]}>
                        {this.state.signingData.object.to}
                      </Text>
                    </View>

                    <View style={styles.vwSignTransaction}>
                      <Text
                        allowFontScaling={false}
                        style={[
                          styles.textLbl,
                          {color: ThemeManager.colors.blackWhiteText},
                        ]}>
                        {browser.From}
                      </Text>
                      <Text
                        allowFontScaling={false}
                        style={[
                          styles.txtValue,
                          {color: ThemeManager.colors.placeholderColorNew},
                        ]}>
                        {this.state.signingData.object.from}
                      </Text>
                    </View>
                    <View>
                      {isEthOrQubeticsNetwork ? null : (
                        <Text
                          allowFontScaling={false}
                          style={[
                            styles.textLbl,
                            {
                              color: ThemeManager.colors.blackWhiteText,
                              // marginTop: 15,
                            },
                          ]}>
                          {sendTrx.transactionFee}
                        </Text>
                      )}
                      {isEthOrQubeticsNetwork
                        ? null
                        : this.renderSlowStandardFast()}
                      {isEthOrQubeticsNetwork ? (
                        <View style={[styles.vwSignTransaction]}>
                          <Text
                            allowFontScaling={false}
                            style={[
                              styles.textLbl,
                              {color: ThemeManager.colors.blackWhiteText},
                            ]}>
                            {browser.gasFee}
                          </Text>
                          <Text
                            allowFontScaling={false}
                            style={[
                              styles.txtValue,
                              {
                                color: ThemeManager.colors.placeholderColorNew,
                                marginLeft: dimen(6),
                              },
                            ]}>
                            {this.state.calculatedFee}{' '}
                            {selectedNetworkMeta?.displaySymbol}{' '}
                            {`(${
                              Singleton.getInstance().CurrencySymbol
                            } ${toFixedExp(
                              Number(this.state.calculatedFee) *
                                Number(networkFiatPrice || 0),
                              4,
                            )})`}
                          </Text>
                        </View>
                      ) : null}
                    </View>
                    <View style={styles.vwSignTransaction}>
                      <Text
                        allowFontScaling={false}
                        style={[
                          styles.textLbl,
                          {color: ThemeManager.colors.blackWhiteText},
                        ]}>
                        {browser.total}
                      </Text>
                      <Text
                        allowFontScaling={false}
                        style={[
                          styles.txtValue,
                          {color: ThemeManager.colors.placeholderColorNew},
                        ]}>
                        {toFixedExp(
                          bigNumberSafeMath(
                            this.hex2dec(
                              this?.state?.signingData?.object?.value || 0,
                            ) /
                              10 ** 18,
                            '+',
                            this?.state?.calculatedFee || 0,
                          ),
                          10,
                        )}{' '}
                        {selectedNetworkMeta?.displaySymbol}
                      </Text>
                    </View>
                    <Button
                      btnstyle={{borderRadius: 6}}
                      buttontext={merchantCard.submit}
                      onPress={() => {
                        // this.setState({ isLoading: true });
                        // setTimeout(() => {
                        // this.signRawTxn();
                        this.setState({isVisible: false, pinModal: true});
                        // }, 1000);
                      }}
                    />
                  </View>
                </View>
              </View>
              <LoaderView isLoading={this.state.isLoading} />
            </>
          )}
        </Modal>

        {/* /****************************************************************************************** */}
        <AppAlert
          visible={this.state.showAlertDialog}
          alertTxt={this.state.alertTxt}
          hideAlertDialog={() => {
            this.setState({showAlertDialog: false, alertTxt: ''});
          }}
        />

        <Modal
          animationType="slide"
          transparent={true}
          visible={this.state.pinModal}
          onRequestClose={() => {
            this.setState({pinModal: false});
          }}>
          <View style={{flex: 1}}>
            <EnterPinForTransaction
              onBackClick={() => {
                this.setState({pinModal: false});
              }}
              checkBiometric={true}
              closeEnterPin={pin => {
                this.setState({pinModal: false}, () => {
                  setTimeout(async () => {
                    if (
                      this.state.msgType == 'signPersonalMessage' ||
                      this.state.msgType == 'signMessage'
                    ) {
                      const message = this.state.signedData;
                      let mmid = message.id;
                      let pKey = await getEncryptedData(
                        `${Singleton.getInstance().defaultEthAddress}_pk`,
                        pin,
                      );
                      let msg = ethers.utils.toUtf8String(
                        message?.object?.data,
                      );
                      let signedMessage =
                        await Singleton.getInstance().signPersonalMessage(
                          // message?.object?.data,
                          msg,
                          pKey,
                        );
                      pKey = '';
                      let js = `trustwallet.${message?.network}.sendResponse(${mmid}, "${signedMessage}")`;
                      this.webview?.injectJavaScript(js);
                    } else if (this.state.msgType == 'signTypedMessage') {
                      const message = this.state.signedData;
                      let approvalParam = JSON.parse(message?.object?.raw);

                      let typeArr = Object.keys(approvalParam.types);
                      let newTypes = {};
                      typeArr.map(el => {
                        if (el != 'EIP712Domain') {
                          newTypes[el] = approvalParam.types[el];
                        }
                      });

                      let newParams = {
                        domain: approvalParam.domain,
                        types: newTypes,
                        message: approvalParam.message,
                      };

                      consoleLogFunc('---------newParams:::::', newParams);
                      setTimeout(async () => {
                        let pvt_key = await getEncryptedData(
                          `${Singleton.getInstance().defaultEthAddress}_pk`,
                          pin,
                        );

                        Singleton.getInstance()
                          .dappApprovalHash(pvt_key, newParams)
                          .then(res => {
                            consoleLogFunc('res::::::::', res);
                            let mmid = message.id;
                            let js = `trustwallet.ethereum.sendResponse(${mmid}, "${res}")`;
                            this.webview?.injectJavaScript(js);
                            this.setState({loading: false});
                            pvt_key = '';
                          })
                          .catch(err => {
                            pvt_key = '';
                            consoleLogFunc('err::::::::', err);
                          });
                      }, 200);
                    } else {
                      this.signRawTxn(pin);
                    }
                  }, 1000);
                });
              }}
            />
          </View>
        </Modal>
      </>
    );
  }
}

export default connect(null, {
  requestNonce,
  requestgasprice,
  requestGasEstimation,
  requestSendCoin,
  requestGasLimitForDapp,
  fetchNativePrice,
})(DappBrowserNew);
