import {useEffect, useState, useRef} from 'react';
import {
  View,
  TouchableOpacity,
  Text,
  ImageBackground,
  ScrollView,
} from 'react-native';
import styles from './VerifySecretPhraseStyles';
import Toast from 'react-native-easy-toast';
import {
  getDimensionPercentage as dimen,
  getDimensionPercentage,
  heightDimen,
  widthDimen,
} from '../../../Utils';
import {
  AppAlert,
  Button,
  ButtonIcon,
  HeaderMain,
  LoaderView,
  OnboardingHeadings,
} from '../../common';
import {LanguageManager} from '../../../../LanguageManager';
import {ThemeManager} from '../../../../ThemeManager';
import {useDispatch} from 'react-redux';
import {
  consoleLogFunc,
  requestWalletApiData,
} from '../../../Utils/MethodsUtils';
import {requestWalletLogin} from '../../../Redux/Actions';
import { Actions } from '../../../navigation/RootNavigation';
import {signCosmosMessage} from '../../../Utils/MnemonicsUtils';
import {loginWithCosmosWallet} from '../../Api/VPN/api/authWithCosmosWallet';

const VerifySecretPhrase = props => {
  const dispatch = useDispatch();
  const toast = useRef(null);
  const [seqenceMn, setSeqenceMn] = useState([]);
  const [jumbleMn, setJumbleMn] = useState([]);
  const [indexArr, setIndexArr] = useState([]);
  const [alertModal, setAlertModal] = useState(false);
  const [alertText, setAlertText] = useState('');
  const [loading, setLoading] = useState(false);
  const originalMnemonics = props?.walletData?.mnemonics?.split(' ');
  useEffect(() => {
    let shuffle = originalMnemonics.sort(() => Math.random() - 0.5);
    setJumbleMn(shuffle);
    setSeqenceMn([]);
  }, []);
  const addMnemonic = (item, indexValue) => {
    setSeqenceMn([...seqenceMn, item]);
    setIndexArr([...indexArr, indexValue]);
    removeMnemonicBottom(item, indexValue, true);
  };
  const removeMnemonicBottom = (item, indexValue, isUpperSide) => {
    let index = 0;
    let arr = indexArr;
    if (isUpperSide) {
      index = indexValue;
    } else {
      index = arr.indexOf(indexValue);
    }
    let mn = jumbleMn;
    if (index > -1) {
      mn.splice(index, 1);
      setJumbleMn([...mn]);

      arr.splice(index, 1);
      setIndexArr([...arr]);
    }
  };
  const removeMnemonic = (item, indexValue, isUpperSide) => {
    let index = 0;
    let arr = indexArr;
    if (isUpperSide) {
      index = indexValue;
    } else {
      index = arr.indexOf(indexValue);
    }
    let mn = seqenceMn;
    if (index > -1) {
      mn.splice(index, 1);
      setSeqenceMn([...mn]);
      setJumbleMn([...jumbleMn, item]);
      arr.splice(index, 1);
      setIndexArr([...arr]);
    }
  };

  const continueAction = async () => {
    if (JSON.stringify(originalMnemonics) != JSON.stringify(seqenceMn)) {
      setAlertModal(true);
      setAlertText(LanguageManager.alertMessages.invalidMnemonics);
    } else {
      setLoading(true);
      let WalletData = props?.walletData;
      const mnemonicString = originalMnemonics.join(' ');
      const message = WalletData?.cosmos_address
        ? WalletData?.cosmos_address
        : 'Hello Cosmos';
      const {pubKey, signature} = await signCosmosMessage(
        mnemonicString?.toLowerCase()?.trim(),
        WalletData?.cosmos_address,
        message,
      );
      try {
        await loginWithCosmosWallet({
          wallet_address: WalletData?.cosmos_address,
          pubKey: pubKey,
          signatureBase64: signature,
        });
      } catch (err) {
        console.error('Login error:', err);
        setLoading(false);
        toast.current?.show(err);
        return;
      }

      const data = await requestWalletApiData({
        walletData: WalletData,
        walletName: props?.walletName,
      });

      dispatch(requestWalletLogin({data}))
        .then(resp => {
          consoleLogFunc('requestWalletLogin---', resp);

          Actions.currentScene != 'CreatePin' &&
            Actions.CreatePin({
              title: 'Create',
              subtitle: 'create',
              walletData: props?.walletData,
              walletName: props?.walletName,
              walletApiRes: resp,
              screenName: 'createWallet',
            });
          setLoading(false);
        })
        .catch(err => {
          setLoading(false);
          toast.current?.show(err);
          consoleLogFunc('error requestWalletLogin:::::', err);
        });
    }
  };

  return (
    <ImageBackground
      source={ThemeManager.ImageIcons.mainBgImgNew}
      style={{flex: 1, backgroundColor: ThemeManager.colors.mainBgNew}}>
      <HeaderMain />
      <ScrollView>
      <View style={{marginHorizontal: dimen(21) }}>
        <OnboardingHeadings title={LanguageManager.verifyPhrase.verifySecretPhrase} subTitle={LanguageManager.verifyPhrase.taptheWord} />

        <View
          style={[
            styles.mnemonicInput,
            {
              borderColor: ThemeManager.colors.blackWhiteText,
            },
          ]}>
          <ScrollView showsVerticalScrollIndicator={false}>
            <View style={styles.mnemonicsViewStyle}>
              {seqenceMn.map((item, index) => {
                return (
                  <View
                    style={{
                      marginTop: heightDimen(11),
                      marginHorizontal: widthDimen(5.5),
                    }}>
                    <ButtonIcon
                      directionReverse={true}
                      onPress={() => {
                        removeMnemonic(item, index, true);
                      }}
                      index={index}
                      name={item}
                      width={'100%'}
                      imageSize={8}
                      textStyle={{color: ThemeManager.colors.blackWhiteText}}
                      fontSize={getDimensionPercentage(16)}
                      textHeight={getDimensionPercentage(42)}
                      lineHeight={getDimensionPercentage(27.52)}
                      borderRadius={55}
                      tintColor={ThemeManager.colors.lightBlack}
                      outline={true}
                      borderColor={ThemeManager.colors.dividerColor}
                    />
                  </View>
                );
              })}
            </View>
          </ScrollView>
        </View>
        <View style={styles.mnemonicsStyle}>
          {jumbleMn.map((item, index) => {
            let isActive = seqenceMn.includes(item);
            return (
              <TouchableOpacity
                key={index}
                style={[
                  styles.mnemonic_style,
                  {backgroundColor: ThemeManager.colors.mnemonicsBg},
                ]}
                onPress={() => {
                  consoleLogFunc('jumbleMn----sadsad', isActive);
                  isActive
                    ? removeMnemonic(item, index, false)
                    : addMnemonic(item, index);
                }}>
                <Text
                  style={[
                    styles.jumleText,
                    {color: ThemeManager.colors.blackWhiteText},
                  ]}>
                  {item}{' '}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
            </ScrollView>
      <View style={[styles.txtButtonContainer]}>
        <Button
          buttontext={LanguageManager.pins.Continue}
          onPress={() => {
            continueAction();
          }}
        />
      </View>

      <AppAlert
        visible={alertModal}
        alertTxt={alertText}
        hideAlertDialog={() => {
          setAlertModal(false);
        }}
      />
      <Toast
        ref={toast}
        position="bottom"
        positionValue={250}
        style={{backgroundColor: ThemeManager.colors.toastBg}}
      />
      <LoaderView isLoading={loading} />
    </ImageBackground>
  );
};

export default VerifySecretPhrase;
