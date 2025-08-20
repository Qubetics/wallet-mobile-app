/* eslint-disable react-native/no-inline-styles */
import React, { Component } from 'react';
import {
  BackHandler,
  FlatList,
  Image,
  ImageBackground,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import Toast from 'react-native-easy-toast';
import { EventRegister } from 'react-native-event-listeners';
import { Actions } from 'react-native-router-flux';
import { LanguageManager } from '../../../../LanguageManager';
import { ThemeManager } from '../../../../ThemeManager';
import * as Constants from '../../../Constants';
import { getDimensionPercentage } from '../../../Utils';
import { consoleLogFunc, saveData } from '../../../Utils/MethodsUtils';
import { AppAlert, HeaderMain, OnboardingHeadings } from '../../common';
import SecretCodeInput from '../../subcommon/molecules/secretCodeInput';
import styles from './CreatePinStyle';
// import ReactNativeBiometrics from 'react-native-biometrics';
import ReactNativeBiometrics, { BiometryTypes } from 'react-native-biometrics';

const DATA = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', 'Del'];
const rnBiometrics = new ReactNativeBiometrics();

class CreatePin extends Component {
  state = {
    showAlertDialog: false,
    alertTxt: '',
    myPin: '',
    themeSelected: '',
    isWeak: false,
    showView: false,
    secretTxt: [false, false, false, false, false, false],
    toggleStatus: false,

  };
  componentDidMount() {
    this.checkBiometricAvailabilty();
    EventRegister.addEventListener('getThemeChanged', data => {
      this.setState({ themeSelected: data });
    });
    // this.props.navigation.addListener("didFocus", () => {
    //   this.backhandle = BackHandler.addEventListener('hardwareBackPress', this.handleBackButtonClick);

    // })
    this.focusListener = this.props.navigation.addListener("didFocus", () => {
      this.backhandle = BackHandler.addEventListener('hardwareBackPress', this.handleBackButtonClick);
    });
    this.blurListener = this.props.navigation.addListener("didBlur", () => {
      if (this.backhandle) this.backhandle.remove();
      this.setState({
        myPin: '',
        isWeak: false,
        showButton: false,
        secretTxt: [false, false, false, false, false, false]
      });
    });
    // this.props.navigation.addListener('didBlur', event => {
    //   if (this.backhandle) this.backhandle.remove();

    //   this.setState({
    //     myPin: '',
    //     isWeak: false,
    //     showButton: false,
    //     secretTxt: [false, false, false, false, false, false]
    //   });
    // });
  }

  componentWillUnmount() {
    if (this.focusListener) this.focusListener?.remove();
    if (this.blurListener) this.blurListener?.remove();
  }

  checkBiometricAvailabilty() {
    const { pins } = LanguageManager;
    rnBiometrics.isSensorAvailable().then(resultObject => {
      const { available, biometryType } = resultObject;
      if (available && biometryType === BiometryTypes.TouchID) {
        consoleLogFunc('TouchID is supported');
        this.setState({ text: pins.enableBiometrics });
      } else if (available && biometryType === BiometryTypes.FaceID) {
        consoleLogFunc('FaceID is supported');
        this.setState({ text: pins.enableFaceId });
      } else if (available && biometryType === BiometryTypes.Biometrics) {
        consoleLogFunc('Biometrics is supported');
        this.setState({ text: pins.enableBiometrics });
      } else {
        consoleLogFunc('Biometrics not supported');
      }
      consoleLogFunc('chk available:::::', available);
      this.setState({ showView: available ? true : false });
      saveData(Constants.BIOMETRIC_SUPPORTED, available ? 'true' : false);
    });
  }
  handleBackButtonClick() {
    return true;
  }
  /******************************************************************************************/
  didSelect(item) {
    this.timeout && clearTimeout(this.timeout);
    this.setState({ itemPressed: item });
    this.timeout = setTimeout(() => {
      this.setState({ itemPressed: '' });
    }, 200);
    if (item == 'd') {
    } else if (item == 'Forgot?') {
      this.forgotPassword();
    } else if (item == 'Del') {
      let pin = this.state.myPin;
      let newPin = pin.slice(0, -1);
      const updatePin = pin;
      const updatedCircleStates = [...this.state.secretTxt];
      updatedCircleStates[updatePin.length - 1] = false;
      this.setState({
        myPin: newPin,
        itemPressed: newPin.length == 0 ? null : item,
        showButton: false,
        secretTxt: updatedCircleStates

      });
    } else {
      let pin = this.state.myPin;
      pin = pin + item;
      if (pin.length <= 6) {
        const newCircleStates = [...this.state.secretTxt];
        newCircleStates[this.state.secretTxt.indexOf(false)] = true;
        this.setState({ showButton: pin.length == 6 ? true : false, myPin: pin, secretTxt: newCircleStates });
        // pin.length == 6 && this.checkPin(pin);
        pin.length == 6 && this.continuePressed(pin);

      }
    }
  }

  /******************************************************************************************/
  checkPin(pin) {
    const pinArr = pin.split('');
    const is_AscendodDescend = pinArr.every((num, i) => i === pinArr.length - 1 || num < pinArr[i + 1]);
    const allSame = pinArr.every(v => v === pinArr[0]);
    if (allSame || is_AscendodDescend) {
      this.setState({ isWeak: true });
    } else {
      this.setState({ isWeak: false });
    }
  }

  togglePress() {
    this.setState({ toggleStatus: !this.state.toggleStatus }, () => {
      // consoleLogFunc('chk toggle statte:::::', this.state.toggleStatus);
      saveData(Constants.BIOMETRIC_MODE, this.state.toggleStatus.toString());
    });
  }
  /******************************************************************************************/
  continuePressed(pin) {
    saveData(Constants.BIOMETRIC_MODE, this.state.toggleStatus.toString());
    Actions.currentScene != "ConfirmPin" &&
      Actions.ConfirmPin({
        title: this.props.title == "New" ? "new" : "",
        pin: pin,
        fromForgot: this.props.fromForgot,
        walletData: this.props?.walletData,
        walletName: this.props?.walletName,
        walletApiRes: this.props?.walletApiRes,
        isHardware: !!this.props?.isHardware,
        isPrivateKey: this.props?.isPrivateKey,
        screenName: this.props?.screenName
      });
    this.setState({ myPin: '' });
  }

  getTitle() {
    const { pins } = LanguageManager;
    const { text, toggleStatus } = this.state;
    if (text == pins.enableBiometrics && toggleStatus == true) {
      return pins.biometricsEnabled;
    } else if (text == pins.enableFaceId && toggleStatus == true) {
      return pins.faceIdEnabled;
    } else {
      return text;
    }
  }

  /******************************************************************************************/
  render() {
    const { pins } = LanguageManager;

    return (
      <ImageBackground
        source={ThemeManager.ImageIcons.mainBgImgNew}
        style={{ flex: 1,}}
      >
        <HeaderMain
          // backCallBack={() => {
          //   this.props.fromForgot ?
          //     Actions.EnterPin() : Actions.pop();
          // }}
          showBackBtn={true}
        />
        <View style={[styles.wrap]}>
          <OnboardingHeadings title={pins.createSecretCode} subTitle={pins.pleaseEnterYourDigitCode} />
          {/* -------------------------------------------------------- */}
          <View style={{
            flex: 0.4,
          }}>
            <SecretCodeInput
              secretTxt={this.state.secretTxt}
              biometric={this.state.showView}
              togglePress={() => { this.togglePress() }}
              toggleStatus={this.state.toggleStatus} />

          </View>
          {/* -------------------------------------------------------- */}

          <View style={[styles.pin_wrap]}>
            <FlatList
              showsVerticalScrollIndicator={false}
              data={DATA}
              numColumns={3}
              bounces={false}
              scrollEnabled={false}
              keyExtractor={(item, index) => index.toString()}
              renderItem={({ item, index }) => {
                return index == 9 ? (
                  <View style={styles.listStyle}>
                    <Text style={{ ...styles.pinBlockTextStyle, color: ThemeManager.colors.blackWhiteText }}></Text></View>) : (
                  <TouchableOpacity
                    style={styles.pinBlockStyle}
                    onPress={this.didSelect.bind(this, item)}>
                    {item === 'Del' ? (
                      <Image source={ThemeManager.ImageIcons.deleteIconNew} resizeMode={'contain'} style={{ height: getDimensionPercentage(24), width: getDimensionPercentage(32) }} />) :
                      (<Text allowFontScaling={false} style={[styles.pinBlockTextStyle, { color: ThemeManager.colors.blackWhiteText }]}>{item}</Text>)}
                  </TouchableOpacity>
                );
              }}
            />
          </View>


        </View>
        {/* -------------------------------------------------------- */}
        <Toast
          ref={toast => (this.toast = toast)}
          position="bottom"
          style={{ backgroundColor: ThemeManager.colors.toastBg }}
        />
        {/* -------------------------------------------------------- */}
        {this.state.showAlertDialog && (
          <AppAlert
            alertTxt={this.state.alertTxt}
            hideAlertDialog={() => { this.setState({ showAlertDialog: false }) }}
          />
        )}
      </ImageBackground>

    );
  }
}
export default CreatePin;





