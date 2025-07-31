import Clipboard from '@react-native-clipboard/clipboard';
import React, { useRef, useState } from 'react';
import {
  Image,
  ImageBackground,
  TouchableOpacity,
  View
} from 'react-native';
import Toast from 'react-native-easy-toast';
import { Actions } from 'react-native-router-flux';
import { useDispatch } from 'react-redux';
import { LanguageManager } from '../../../../LanguageManager';
import { ThemeManager } from '../../../../ThemeManager';
import * as Constants from '../../../Constants';
import { requestWalletLogin } from '../../../Redux/Actions';
import { Images } from '../../../theme';
import {
  getDimensionPercentage as dimen,
  heightDimen
} from '../../../Utils';
import { consoleLogFunc, requestWalletApiData } from '../../../Utils/MethodsUtils';
import { importWallet } from '../../../Utils/MnemonicsUtils';
import { AppAlert, Button, HeaderMain, Input, LoaderView, OnboardingHeadings } from '../../common';
import styles from './ImportWalletStyles';
import { Hmac, } from '@cosmjss/crypto';
// import { hexToBytes, bytesToHex } from '@noble';
const utils = require('@noble/hashes/utils');
import { sha512 } from '@noble/hashes/sha512';


const ImportWallet = (props) => {
  const dispatch = useDispatch();
  const toast = useRef(null);
  const [wallet_name, setWallet_name] = useState('new');
  const [isKeyboard, setIsKeyboard] = useState(false);
  const [mnemonics, setMnemonics] = useState('REDACTED_TEST_MNEMONIC');
  const [loading, setLoading] = useState(false);
  const [alertModal, setAlertModal] = useState(false);
  const [alertText, setAlertText] = useState('');


  const importAction = () => {
//           // Fixed 32-byte key (in hex)
// const keyHex = '000102030405060708090a0b0c0d0e0f101112131415161718191a1b1c1d1e1f';
// const key = utils.hexToBytes(keyHex);

// // Fixed message (in hex)
// const msgHex = '48656c6c6f2c20576f726c6421'; // "Hello, World!"
// const msg = utils.hexToBytes(msgHex);

// // Create HMAC instance and digest
// const mac = new Hmac(sha512, key);
// mac.update(msg);
// const result = mac.digest();

// // Log HMAC result
// console.log("HMAC-SHA512:", utils.bytesToHex(result));
//       return

    if (wallet_name?.trim().length == 0) {
      setAlertModal(true)
      setAlertText(LanguageManager.alertMessages.enterWalletName)
      return
    }
    if (wallet_name?.length < 3) {
      setAlertModal(true)
      setAlertText(LanguageManager.createWalletTexts.validName)
      return
    }
    if (mnemonics?.length <= 0) {
      setAlertModal(true)
      setAlertText('Please enter mnemonics')
      return
    }
    setLoading(true)
    importWallet(mnemonics?.toLowerCase()?.trim()).then(async (response) => {


      let WalletData = response
      consoleLogFunc("importWallet response--++++-- ", WalletData)


      // consoleLogFunc("importWallet response---- ", WalletData)

      const data = await requestWalletApiData({
        walletData: response,
        walletName: wallet_name,
      });


      consoleLogFunc('data:::::::>>>>>', data);
      importWalletApiCall(WalletData, data, false)

    }).catch((error) => {
      setLoading(false)
      consoleLogFunc("importWallet error---- ", error)
      setAlertModal(true)
      setAlertText(error)
    })
  }

  const importWalletApiCall = async (WalletData, data, isHardware) => {
    dispatch(requestWalletLogin({ data }))
      .then((resp) => {
        Actions.currentScene != "CreatePin" &&
          Actions.CreatePin({
            title: "Create",
            subtitle: "create",
            walletData: WalletData,
            walletName: wallet_name,
            walletApiRes: resp,
            isHardware,
            screenName: 'importWallet'
          });
        setLoading(false);
      })
      .catch((err) => {
        setLoading(false);
        toast.current?.show(err);
        consoleLogFunc("error requestWalletLogin:::::", err);
      });
  };


  const pasteAction = async () => {
    const text = await Clipboard.getString();
    setMnemonics(text);
  }
  return (
    <ImageBackground
      source={ThemeManager.ImageIcons.mainBgImgNew}
      style={{ flex: 1, backgroundColor: ThemeManager.colors.mainBgNew }}
    >
      <HeaderMain />
      <View style={[styles.mainView]}>
        <OnboardingHeadings title={LanguageManager.importWallet.importWallet} subTitle={LanguageManager.importWallet.importWalletH1} />

        <View style={[styles.subView]}>
          <Input
            inputStyle={{
              borderRadius: dimen(14),
              color: ThemeManager.colors.blackWhiteText,
            }}
            label={LanguageManager.walletName.enterWalletName}
            value={wallet_name}
            onChangeText={(val) => {
              if (Constants.ALPHANUMERIC_WITH_SPACE_REGEX.test(val)) {
                setWallet_name(val?.trimStart());
              }
            }}
            placeholder={LanguageManager.walletName.enterHere}
            maxLength={20}
            onBlur={() => setIsKeyboard(false)}
            onFocus={() => setIsKeyboard(true)}
            // style={{ marginTop: dimen(5) }}
            labelcustom={{
              marginTop: heightDimen(10),
              color: ThemeManager.colors.blackWhiteText,
            }}
          />
          <View>
            <Input
              inputStyle={[
                styles.placeHolderStyle,
                {
                  color: ThemeManager.colors.blackWhiteText,
                },
              ]}
              placeholder={LanguageManager.importWallet.secret}
              multiline
              returnKeyType="next"
              icon={false}
              value={mnemonics}
              onChangeText={(val) => {
                // if (val) {
                //   if (val?.includes('\n')) {
                //     Keyboard.dismiss();
                //     return;
                //   }
                //   val = val.replace(/[^A-Za-z ]/gi, '');
                // }
                setMnemonics(val);
                consoleLogFunc("val nmemonics>>>>", val);
              }}
              numberOfLines={3}
              style={styles.inputPhraseStyle}
              onBlur={() => setIsKeyboard(false)}
              onFocus={() => setIsKeyboard(true)}
            />

            <TouchableOpacity
              onPress={() => {
                pasteAction()
              }}
              style={{ position: "absolute", bottom: 12, right: 15 }}
            >
              <Image style={{ tintColor: ThemeManager.colors.primaryColor }} source={Images.pasteIcon} />
            </TouchableOpacity>
          </View>
          <View style={styles.btnContainer}>
            <Button
              buttontext={LanguageManager.pins.Continue}
              onPress={() => {
                importAction();
              }}
            />
          </View>
        </View>

        {alertModal && (
          <AppAlert
            alertTxt={alertText}
            hideAlertDialog={() => {
              setAlertModal(false);
            }}
          />
        )}

        <Toast
          ref={toast}
          position="bottom"
          positionValue={250}
          style={{ backgroundColor: ThemeManager.colors.toastBg }}
        />
      </View>
      <LoaderView isLoading={loading} />
    </ImageBackground>
  );
};

export default ImportWallet;
