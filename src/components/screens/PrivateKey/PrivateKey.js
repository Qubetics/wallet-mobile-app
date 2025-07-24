import React, { useRef, useState } from 'react';
import { Clipboard, Image, Keyboard, Text, TouchableOpacity, View } from 'react-native';
import { LanguageManager } from '../../../../LanguageManager';
import { ThemeManager } from '../../../../ThemeManager';
import images from '../../../theme/Images';
import { consoleLogFunc } from '../../../Utils/MethodsUtils';
import { HeaderMain, Input } from '../../common';
import styles from './PrivateKeyStyle';


const PrivateKey = (props) => {

  const toast = useRef(null);

  const [wallet_name, setWallet_name] = useState('');
  const [mnemonics, setMnemonics] = useState('');
  const [isKeyboard, setIsKeyboard] = useState(false);

  const copyAction = () => {
    Clipboard.setString(mnemonics);
    toast.current?.show(alertMessages.copied)
  }

  return (
    <View style={[{ flex: 1, backgroundColor: ThemeManager.colors.Mainbg }]}>
      <HeaderMain
        BackButtonText={LanguageManager.manageWallet.privateKey}
      />
      <View style={[styles.mainView,]}>
        <View style={styles.subView}>
          <Text style={[styles.reviewText, { color: ThemeManager.colors.headersTextColor }]}>
            {LanguageManager.manageWallet.keepYourPrivateKey}
          </Text>
        </View>

        <Input
          inputStyle={[
            styles.placeHolderStyle,
            { borderColor: ThemeManager.colors.cloudy },
          ]}
          placeholder={'0X31471e0791fcdbe82fbf4c4...'}
          multiline
          returnKeyType="next"
          icon={false}
          value={mnemonics}
          onChangeText={val => {
            if (val) {
              if (val?.includes('\n')) {
                Keyboard.dismiss();
                return;
              }
              val = val.replace(/[^A-Za-z ]/gi, '');
            }
            setMnemonics(val);
            consoleLogFunc('val', val);
          }}
          numberOfLines={3}
          style={styles.inputPhraseStyle}
          onBlur={() => setIsKeyboard(false)}
          onFocus={() => setIsKeyboard(true)}
        />

        <View style={styles.copyMainView}>
          <TouchableOpacity
            onPress={() => { copyAction() }}
            style={styles.copyView}
          >
            <Text style={[styles.copyText, { color: ThemeManager.colors.greenText }]}>{LanguageManager.secretPhrase.copy}</Text>
            <Image
              style={styles.copyIconStyle}
              source={images.copy}
            />
          </TouchableOpacity>
        </View>
      </View>

    </View>



  );
};

export default PrivateKey;