import { Dimensions, Platform, StyleSheet, StatusBar } from 'react-native';
import { ThemeManager } from '../../../../ThemeManager';
import { Fonts } from '../../../theme/';
import { dimen, getDimensionPercentage, heightDimen, widthDimen } from '../../../Utils';
import DeviceInfo from 'react-native-device-info';
export default StyleSheet.create({
  emptyView1: {
    alignSelf: 'center',
    marginTop: Dimensions.get('screen').height / 5,
  },
  ViewStyle2: {

    paddingHorizontal: getDimensionPercentage(25),

    width: '100%',
    // backgroundColor:'pink',
    // marginTop:heightDimen(Platform.OS == 'ios' ? 10: 50),
    marginTop: Platform.OS == 'ios'
      ? DeviceInfo.hasNotch() || DeviceInfo.hasDynamicIsland()
        ? 0
        : 0
      : StatusBar.currentHeight
        ? StatusBar.currentHeight
        : 28,
    // borderBottomLeftRadius: 20,
    // borderBottomRightRadius: 20,
  },
  touchableStyle: {
    borderRadius: 5,
    width: 33,
    height: 33,
    // marginLeft: 13,
    justifyContent: 'center',
    alignItems: 'center',
  },
  ViewStyle: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: getDimensionPercentage(20),
    justifyContent: "space-between"
  },
  imgNoti: {
  },
  viewAssets: {
    paddingHorizontal: 24,
    // paddingTop: 12,
    // backgroundColor:'red'
  },
  txtNoAssets: {
    fontSize: 15,
    fontFamily: Fonts.dmMedium,
    color: ThemeManager.colors.whiteText,
    alignSelf: 'center',
  },
  walletNameIcon: {
    fontFamily: Fonts.dmBold,
    fontSize: dimen(25.46),
    fontWeight: '700',
    // marginBottom: -2
  },
  walletName: {
    textTransform: "capitalize",
    marginLeft: widthDimen(6),
    fontSize: getDimensionPercentage(20),
    fontFamily: Fonts.dmSemiBold,
    lineHeight: getDimensionPercentage(20),
    maxWidth: widthDimen(230),
    marginTop: heightDimen(5),
  },

});
