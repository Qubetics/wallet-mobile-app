import { useState, useEffect } from 'react';
import { View, ImageBackground } from 'react-native';
import styles from './WalletNameStyles'

import { AppAlert, Button, HeaderMain, Input, LoaderView, OnboardingHeadings } from '../../common';
import { LanguageManager } from '../../../../LanguageManager';
import { ThemeManager } from '../../../../ThemeManager';
import { Actions } from '../../../navigation/RootNavigation';
import { createWallet } from '../../../Utils/MnemonicsUtils';
import * as Constants from '../../../Constants';
import { consoleLogFunc, getData } from '../../../Utils/MethodsUtils';

const WalletName = (props) => {
  const [wallet_name, setWallet_name] = useState('');
  const [loading, setLoading] = useState(false);
  const [alertModal, setAlertModal] = useState(false);
  const [alertText, setAlertText] = useState('');
  const [multiwallet, setmultiwallet] = useState([]);
  useEffect(() => {
    getData(Constants.MULTI_WALLET_LIST).then(multiWalletArray => {
      if (multiWalletArray) {
        setmultiwallet(JSON.parse(multiWalletArray));
      }
    });
  }, []);

  const onPressContinue = () => {

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
    if (props?.screen == 'managewallet') {
      const iswalletNameExist = multiwallet?.find(item => item?.walletName.toLowerCase() == wallet_name?.toLowerCase());
      if (iswalletNameExist) {
        setAlertModal(true)
        setAlertText(LanguageManager.alertMessages.walletNameAlreadyExists)
        return
      }

    }

    setLoading(true)
    createWallet().then((response) => {
      consoleLogFunc("response---- ", response)
      if (response?.retry) {
        onPressContinue()
      }
      else {
        setLoading(false)
        Actions.currentScene != 'SecretPhrase' && Actions.SecretPhrase({ walletData: response, walletName: wallet_name, screen: props?.screen })
      }
    }).catch((error) => {
      setLoading(false)
      consoleLogFunc("error---- ", error)
    })

  }


  return (
    <ImageBackground
      source={ThemeManager.ImageIcons.mainBgImgNew}
      style={{ flex: 1, backgroundColor: ThemeManager.colors.mainBgNew }}
    >
      <HeaderMain />
      <View style={styles.mainView}>
        <View style={styles.mainViewStyle}>

          <OnboardingHeadings title={LanguageManager.walletName.walletName} subTitle={LanguageManager.walletName.youCanlable} />

          <Input
            inputStyle={{ borderRadius: 14, color: ThemeManager.colors.blackWhiteText }}
            label={LanguageManager.walletName.enterWalletName}
            value={wallet_name}
            onChangeText={val => {
              if (Constants.ALPHANUMERIC_WITH_SPACE_REGEX.test(val)) {
                setWallet_name(val.trimStart());
              }
            }}
            placeholder={LanguageManager.walletName.enterHere}
            maxLength={20}
            labelcustom={{ color: ThemeManager.colors.grayBlack }}
          />
        </View>
        <View style={[styles.mainBtnView]}>
          <Button
            onPress={() => {
              onPressContinue()
            }}
            buttontext={LanguageManager.pins.Continue}
          />
        </View>
      </View>
      <AppAlert
        visible={alertModal}
        alertTxt={alertText}
        hideAlertDialog={() => { setAlertModal(false) }}
      />
      <LoaderView isLoading={loading} />
    </ImageBackground>

  );
};

export default WalletName;