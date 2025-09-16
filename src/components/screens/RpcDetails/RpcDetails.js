import styles from './RpcDetailsStyle';
import {
  Alert,
  BackHandler,
  Dimensions,
  FlatList,
  Image,
  ImageBackground,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import React, {useEffect, useState} from 'react';
import {Button, HeaderMain, InputCustom} from '../../common';
import {LanguageManager} from '../../../../LanguageManager';
import {dimen, widthDimen} from '../../../Utils';
import LabelTextInput from '../../common/LabelTextInput';
import TwoButtonFooter from '../../common/TwoRowButtons';
import {ThemeManager} from '../../../../ThemeManager';
import CommonModal from '../../common/CommonModal';
import images from '../../../theme/Images';
import * as Constants from '../../../Constants';
import {EventRegister} from 'react-native-event-listeners';

const {width: screenWidth} = Dimensions.get('window');
const RpcDetails = props => {
  const {vpn, help, placeholderAndLabels, walletName} = LanguageManager;
  const {colors, ImageIcons} = ThemeManager;
  const [host, setHost] = useState('');
  const [activePort, setActivePort] = useState('');

  useEffect(() => {
    var url = Constants.COSMO_RPC_URL;
    console.log('url--->', url);
    let urlObject = new URL(url);

    console.log('urlObject--->', urlObject);
    let rpcURL = urlObject.hostname;
    let port = urlObject.port;
    setHost(rpcURL);
    setActivePort(port);
    return () => {};
  }, []);

  const handleBackButtonClick = () => {
    return true;
  };

  return (
    <ImageBackground
      source={ThemeManager.ImageIcons.mainBgImgNew}
      style={{flex: 1, backgroundColor: ThemeManager.colors.mainBgNew}}>
      <View style={[styles.mainView]}>
        <HeaderMain BackButtonText={vpn.rcpDetails} />
        <View
          style={{
            marginHorizontal: dimen(24),
          }}>
          <LabelTextInput
            label={vpn.host}
            placeholder={walletName.enterHere}
            value={host}
            isEnabled={true}
            onChangeText={value => {
              setHost(value)
            }}
            customViewStyle={{
              marginTop: 0,
            }}
          />
          <LabelTextInput
            label={vpn.post}
            placeholder={walletName.enterHere}
            value={activePort}
            isEnabled={false}
            onChangeText={value => {}}
          />
        </View>
        {/* <View
          style={{
            ...styles.buttonContainer,
          }}>
          <View style={[styles.btnViewModal]}>
            <TwoButtonFooter
              onLeftPress={() => {
                console.log('Cancel pressed');
              }}
              onRightPress={() => {
                console.log('Continue pressed');
              }}
              leftLabel={LanguageManager.merchantCard.reset}
              rightLabel={LanguageManager.commonText.save}
            />
          </View>
        </View> */}
      </View>
    </ImageBackground>
  );
};

export default RpcDetails;
