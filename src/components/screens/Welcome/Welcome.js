import JailMonkey from 'jail-monkey';
import Lottie from 'lottie-react-native';
import React, { Component } from 'react';
import {
  BackHandler,
  Dimensions,
  NativeModules,
  Platform,
  View,
} from 'react-native';
import DeviceInfo from 'react-native-device-info';
import { EventRegister } from 'react-native-event-listeners';
import changeNavigationBarColor from 'react-native-navigation-bar-color';
import { Actions } from 'react-native-router-flux';
import Video from 'react-native-video';
import { connect } from 'react-redux';
import { ThemeManager } from '../../../../ThemeManager';
import * as Constants from '../../../Constants';
import { requestWalletLogin } from '../../../Redux/Actions';
import Singleton from '../../../Singleton';
import { Colors, Images } from '../../../theme/';
import images from '../../../theme/Images';
import { consoleLogFunc, getData, saveData, saveDataInStorage } from '../../../Utils/MethodsUtils';
import { AppAlert } from '../../common';
import styles from './WelcomeStyle';

class Welcome extends Component {
  constructor(props) {
    super(props);
    this.state = {
      // themeSelected: store.getState().walletReducer.cureentTheme,
      themeSelected: 1,
      alertTxt: '',
      showAlertDialog3: false,
      isshow: false
    };
  }

  /******************************************************************************************/
  async componentDidMount() {
    Singleton?.getInstance()?.isNewerVersion1()
    this.focus = this.props.navigation.addListener("didFocus", () => {
      this.backhandle = BackHandler.addEventListener('hardwareBackPress', this.handleBackButtonClick);
      // console;
      getData(Constants.DARK_MODE_STATUS).then(async theme => {
        consoleLogFunc('chk theme::::status', theme);

        if (theme) {
          consoleLogFunc("predefined======", theme)

          theme == 1 ? ThemeManager.setLanguage('darkMode') : ThemeManager.setLanguage('lightMode');
          EventRegister.emit('getThemeChanged', theme);
          EventRegister.emit('theme', theme == 1 ? '#0C0C0D' : Colors.White);
          Singleton.getInstance().themeStatus = theme

          saveData(Constants.DARK_MODE_STATUS, theme);
          this.setState({ themeSelected: theme });
          this.navigateApp();
        } else {
          consoleLogFunc("bydefault======")
          ThemeManager.setLanguage('darkMode');
          Singleton.getInstance().themeStatus = '1'
          EventRegister.emit('getThemeChanged', '1');
          EventRegister.emit('theme', '#0C0C0D');
          saveData(Constants.DARK_MODE_STATUS, 1);
          this.setState({ themeSelected: 1 });
          this.navigateApp();
        }
      })
    });
    // const response = await changeNavigationBarColor('#80b3ff');
    if (ThemeManager.colors.theme == 'light') {
      changeNavigationBarColor('#ffffff');
    } else {
      changeNavigationBarColor('#121117');
    }
    // const response = await changeNavigationBarColor(ThemeManager.colors.mainBgNew);
    // consoleLogFunc('chk theme::::response', response);

  }

  handleBackButtonClick() {
    return false;
  }

  /******************************************************************************************/
  async navigateApp() {
    // if (Platform.OS == 'android') {

    //   if (await DeviceInfo.isEmulator()) {
    //     __DEV__ ?  this.moveForward(): this.setState({ alertTxt: 'Your device is rooted. You cannot proceed.', showAlertDialog3: true });
    //      return
    //   } else {
    //     const { rootStatus } = NativeModules.EncryptionModule;
    //     rootStatus().then(async res => {
    //       if (res) {
    //         res == 'It is not rooted device' ? this.moveForward() : this.setState({ alertTxt: 'Your device is rooted. You cannot proceed.', showAlertDialog3: true });
    //       }
    //     }).catch(err => {
    //       consoleLogFunc('-----------root error--------', err);
    //     });
    //   }
    // } else {
      this.moveForward();
    // }
  }

  /******************************************************************************************/
  moveForward() {
    EventRegister.emit('fromscreen', 'welcome')
    if (JailMonkey.isJailBroken()) {
      this.navigate();
      // return Alert.alert('Your device is rooted. You cannot proceed.');
    } else {
      this.navigate();
    }
  }

  /******************************************************************************************/
  navigate() {
    getData(Constants.ACCESS_TOKEN).then(value => {
      getData(Constants.PIN_LOCK).then(pin => {
        if (value && pin) {
          getData(Constants.ACTIVE_ADDRESS_LIST).then(addressList => {
            consoleLogFunc('addressList:::::', addressList);
            const addressArr = addressList ? JSON.parse(addressList) : []
            const isHavingBnb = addressArr?.find((item) => item?.symbol?.toLowerCase() == 'bnb')
            consoleLogFunc('isHavingBnb::::::::', isHavingBnb);
            if (addressArr.length > 0) {
              this.moveToApp(value, pin)
            } else {
              this.createWallet(value, pin);
            }
          });
        } else this.moveToApp(value, pin)
      })
    });
    this.createRefLink();
  }

  /******************************************************************************************/
  createRefLink = async () => {

  }
  /******************************************************************************************/
  async moveToApp(value, pin, fromCreate = false) {
    if (value && pin) {

      const newUser = await getData(Constants.NEW_USER)
      if(newUser == null){
        saveData(Constants.NEW_USER, "true")
        saveData(Constants.BIOMETRIC_MODE, "false");
      }
    
      if (fromCreate) {
        Actions.currentScene != 'EnterPin' && Actions.EnterPin({ from: "welcome" });
      } else {
        setTimeout(() => {
          Actions.currentScene != 'EnterPin' && Actions.EnterPin({ from: "welcome" });
          EventRegister.emit('fromscreen', '')
        }, 4500);
      }
    } else {
      fromCreate ? Actions.currentScene != 'Onboarding' && Actions.Onboarding({ type: 'reset' }) :
        setTimeout(() => {
          Actions.currentScene != 'Onboarding' && Actions.Onboarding({ type: 'reset' });
          EventRegister.emit('fromscreen', '')
        }, 4500);
    }
  }

  /******************************************************************************************/
  createWallet(value, pin) {
    getData(Constants.MULTI_WALLET_LIST).then(async list => {
      getData(Constants.LOGIN_DATA).then(async (res) => {
        const response = JSON.parse(res);
        const WallList = JSON.parse(list);
        const defaultWallet = WallList?.find((item) => item?.defaultWallet == true)
        consoleLogFunc('defaultWallet::::::::', defaultWallet);
        consoleLogFunc('response::::::::', response);

        const web3Res = defaultWallet?.web3Res
        const data = {
          device_id: Singleton.getInstance().unique_id,
          login_type: web3Res?.userInfo?.typeOfLogin,
          social_id: web3Res?.sessionId,
          email: web3Res?.userInfo?.email,
          wallet_address: response.defaultEthAddress,
          device_token: (await getData(Constants.DEVICE_TOKEN)) || 'abc',
          wallet_name: web3Res?.userInfo?.name || 'Basic',
          referral_code: response.refCode,
          addressList: [
            { symbol: 'bnb', address: response.defaultEthAddress, coin_family: 1 },
            { symbol: 'eth', address: response.defaultEthAddress, coin_family: 2 },
            // { symbol: 'matic', address: response.defaultEthAddress, coin_family: 4 },
            { symbol: 'btc', address: response.defaultBtcAddress, coin_family: 3 },
      { symbol: "pol", address: walletData.eth_address, coin_family: 4 },
      { symbol: "sol", address: walletData.sol_address, coin_family: 5 },
            { symbol: 'trx', address: response.defaultTrxAddress, coin_family: 6 },
            { symbol: "tics", address: walletData.eth_address, coin_family: 7 },
            { symbol: "tics", address: walletData.cosmos_address, coin_family: 7 },
          ],
        };
        const addrsListKeys = [
          response.defaultEthAddress,
          response.defaultEthAddress,
          response.defaultEthAddress,
          response.defaultBtcAddress,
          response.defaultTrxAddress,
          response.defaultSolAddress, 
          response.defaultTicsAddress,
          response.defaultCosmosAddress
        ];
        const coinFamilyKeys = [1, 2, 3, 4, 5, 6, 7];
        this.props.requestWalletLogin({ data }).then(res2 => {
          Singleton.getInstance().defaultBnbAddress = response.defaultEthAddress;
          // Singleton.getInstance().defaultTicsAddress = response.defaultEthAddress;
          const login_data = {
            access_token: res2.data.token,
            defaultEthAddress: response.defaultEthAddress,
            // defaultBtcAddress: response.defaultBtcAddress,
            defaultTrxAddress: response.defaultTrxAddress,
            defaultBnbAddress: response.defaultEthAddress,
            defaultLtcAddress: response.defaultLtcAddress,
            defaultMaticAddress: response.defaultEthAddress,
            walletName: web3Res?.userInfo?.name || 'Basic',
            userId: res2.data.userId,
            userEmail: web3Res?.userInfo?.email,
            refCode: response.refCode,
          };
          const Wallet_Array = [
            {
              walletName: web3Res?.userInfo?.name || 'Basic',
              loginRequest: data,
              defaultWallet: true,
              user_jwtToken: res2.data?.token,
              user_refreshToken: res2.data?.token,
              userEmail: web3Res.userInfo?.email,
              typeOfLogin: web3Res?.userInfo?.typeOfLogin,
              addrsListKeys: addrsListKeys,
              coinFamilyKeys: coinFamilyKeys,
              login_data: login_data,
              web3Res: defaultWallet?.web3Res,
            },
          ];
          saveData(Constants.MULTI_WALLET_LIST, JSON.stringify(Wallet_Array));
          saveData(Constants.ACCESS_TOKEN, res2.data.token);
          saveData(Constants.ACTIVE_ADDRESS_LIST, JSON.stringify(data.addressList));
          saveData(Constants.ADDRESS_LIST, JSON.stringify(addrsListKeys));
          saveData(Constants.COIN_FAMILY_LIST, JSON.stringify(coinFamilyKeys));
          saveData(Constants.LOGIN_DATA, JSON.stringify(login_data));
          saveData(Constants.REFRESH_TOKEN, res2.data.refreshToken);
          Singleton.getInstance().walletName = web3Res?.userInfo?.name || 'Basic';
          this.moveToApp(value, pin, true)
        })
      });
    });
  }

  /******************************************************************************************/
  render() {
    // consoleLogFunc('chk this.state.themeSelected welcpme', store.getState().walletReducer.cureentTheme)
    // if(this.state.themeSelected == 0){
    //   return null
    // }
    return (
      <>
        <View style={{
          height: Dimensions.get('screen').height,
          width: Dimensions.get('screen').width,
          backgroundColor: ThemeManager.colors.mainBgNew,
          justifyContent: "center",
          alignItems: "center"
        }}>
          <Video
            source={images.tickAnimation}
            style={styles.backgroundVideo}
            resizeMode="cover"
          />
          <Lottie
            style={{ height: 300, }}
            source={Images.splashLogo}
            autoPlay
            loop={false}
          />
        </View>
        {this.state.showAlertDialog3 && (
          <AppAlert
            alertTxt={this.state.alertTxt}
            hideAlertDialog={() => { this.setState({ showAlertDialog3: false }, () => BackHandler.exitApp()); }}
          />
        )}
      </>
    );
  }
}

export default connect(null, { requestWalletLogin })(Welcome);
