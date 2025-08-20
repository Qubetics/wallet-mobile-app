import { BlurView } from '@react-native-community/blur';
import React, { useEffect, useState } from 'react';
import {
  Image,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { EventRegister } from 'react-native-event-listeners';
import { ThemeManager } from '../../../ThemeManager';
import * as Constants from '../../Constants';
import { moderateScale } from '../../layouts/responsive';
import Singleton from '../../Singleton';
import { Fonts } from '../../theme';
import images from '../../theme/Images';
import { getData } from '../../Utils/MethodsUtils';

export const CosmoModalSend = props => {
  const AddressList = [
    { title: 'Qubetics Address', address: Singleton.getInstance().defaultTicsAddress, key: 'evm' },
    { title: 'Cosmos Address', address: Singleton.getInstance().defaultCosmosAddress, key: 'cosmo' },
  ];

  const [themeSelected, setThemeSelected] = useState();

  //******************************************************************************************/
  useEffect(() => {
    EventRegister.addEventListener('getThemeChanged', data => {
      setThemeSelected(data);
    });
    getData(Constants.DARK_MODE_STATUS).then(async theme => {
      setThemeSelected(theme);
    })
  }, []);

  //******************************************************************************************/
  return (
    <Modal
      statusBarTranslucent
      animationType="fade"
      transparent={true}
      visible={props.openModel}
      onRequestClose={props.onPressIn}>

      <BlurView
        style={styles.blurView}
        blurType="light"
        blurAmount={2}
        reducedTransparencyFallbackColor="white"
      />
      <TouchableOpacity onPress={props.onPressIn} style={[styles.centeredView1]} />

      <View style={[styles.modalView, { backgroundColor: ThemeManager.colors.mainBgNew }]}>
        <TouchableOpacity onPress={props.onPressIn} style={{ alignSelf: "flex-end", padding: 5 }}>
          <Image resizeMode="contain" source={ThemeManager.ImageIcons.crossIconNew} />
        </TouchableOpacity>
        <Text allowFontScaling={false} style={[styles.textStyle, { color: ThemeManager.colors.blackWhiteText }]}>{'Select Address'}</Text>

        <View style={[styles.ViewStyle1]}>
          {AddressList?.length > 0 && AddressList?.map((item, index) => {
            return (
              <TouchableOpacity activeOpacity={1} key={index + ''} onPress={() => props.onPressItem(item, index)} style={[styles.ViewStyle11]}>
                <View style={[styles.ViewStyle3, { borderBottomWidth: 1, borderColor: ThemeManager.colors.borderColor }]}>
                  <View>
                  <Text allowFontScaling={false} style={[styles.textStyle1, { color: ThemeManager.colors.blackWhiteText }]}>{item.title}</Text>


                  <View>
                    <Text allowFontScaling={false} style={[styles.subTextStyle1, { color: ThemeManager.colors.legalGreyColor }]}>{item?.address?.substring(0, 23) + '...'}</Text>
                  </View>
                  </View>

                 {props.showShare &&  <View style={styles.addressButtons}>
                  <TouchableOpacity
                    style={styles.addButtons}
                    onPress={() => props.copy(item)}
                  >
                    <Image
                      source={images.copy1}
                      resizeMode={"contain"}
                      style={{
                        height: moderateScale(20),
                        width: moderateScale(22),
                        resizeMode: "contain",
                      }}
                    />
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.addButtons}
                    onPress={() => props.Share(item)}
                  >
                    <Image
                      source={images.share}
                      resizeMode={"contain"}
                      style={{
                        height: moderateScale(20),
                        width: moderateScale(26),
                        resizeMode: "contain",
                      }}
                    />
                  </TouchableOpacity>
                </View>}
                </View>
              </TouchableOpacity>
            );
          })}
        </View>


      </View>
    </Modal>
  );
};

//******************************************************************************************/
const styles = StyleSheet.create({
  textStyle: {
    fontFamily: Fonts.dmSemiBold,
    fontSize: 18,
    textAlign: 'center',
    marginTop: 10,
  },
  textStyle1: {
    fontSize: 16,
    fontFamily: Fonts.dmRegular,
  },
  modalView: {
    width: '100%',
    borderTopRightRadius: 20,
    borderTopLeftRadius: 20,
    borderRadius: 10,
    elevation: 4,
    paddingHorizontal: 24,
    paddingVertical: 20,
    flex: 0.5,
  },
  centeredView1: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 18,
    width: '100%',
    justifyContent: 'space-evenly',
    alignItems: 'center',
    borderTopRightRadius: 20,
    borderTopLeftRadius: 20,
  },
  blurView: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    right: 0,
    flex: 1,
  },
  ViewStyle1: {
    borderRadius: 20,
    marginTop: 20,
  },
  ViewStyle11: {
    width: '100%',
  },
  ViewStyle3: {
    padding: 10,
    flexDirection:'row',
    
  },
  subTextStyle1: {
    fontFamily: Fonts.dmRegular,
    fontSize: 14,
  },
  addressButtons: {
    flexDirection: 'row',
    flex:1,
    justifyContent:'flex-end',
    marginLeft:10

  },
  addButtons: {
    width: 30,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
