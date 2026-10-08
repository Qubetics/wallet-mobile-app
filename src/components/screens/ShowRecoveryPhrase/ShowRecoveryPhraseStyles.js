import { StyleSheet } from "react-native";
import {
  getDimensionPercentage as dimen,
  heightDimen,
  widthDimen,
} from "../../../Utils";
import { Fonts } from "../../../theme";
import { ThemeManager } from "../../../../ThemeManager";

export default StyleSheet.create({
  mainView: {
    flex: 1,
  },
  mainViewStyle: {
    flex: 1,
    paddingHorizontal: dimen(20),
    marginTop: heightDimen(30)
  },
  containerStyle: {
    paddingBottom: heightDimen(20),
  },
  itemContainerStyle: { flexDirection: "row", borderRadius: dimen(12) },

  mnemonic: {
    backgroundColor: ThemeManager.white,
    // padding: 10,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    // marginVertical: heightDimen(11),
    flexDirection: "row",
  },
  mnemonicBg: {
    // overflow:'hidden',
    borderRadius: 14,
    paddingHorizontal: dimen(16.96),
    marginTop: heightDimen(11.66),
    marginHorizontal: 5.83,
    height: dimen(50),
    justifyContent: "center",
  },
  textStyle: {
    color: ThemeManager.colors.black,
    fontFamily: Fonts.dmMedium,
    fontSize: dimen(16),
    lineHeight: dimen(27.17)
  },
  copyMainView: {
    marginTop: dimen(20),

  },
  styleMargin: {
    flex: 1,
    justifyContent: 'flex-start',
    alignItems: 'flex-start',
    marginTop: dimen(91)
    // backgroundColor:'red'

  },
  subView: {
    flex: 1,
    flexDirection: 'row',
    // backgroundColor:'pink',
    // alignItems: 'center'
  },
  tickImgStyle: {
    height: dimen(16),
    width: dimen(16),
    resizeMode: 'contain',
    marginTop: heightDimen(3)
  },
  txtStyleOne: {
    // textAlign: 'left',
    fontSize: dimen(14),
    lineHeight: dimen(24),
    fontFamily: Fonts.dmRegular,
    marginLeft: widthDimen(10)

  },
  subViewTwo: {
    flex: 1,
    flexDirection: 'row',
    marginTop: heightDimen(10)
    // alignItems: 'center'
  },
  txtStyleTwo: {
    // textAlign: 'left',
    flex: 1,
    fontSize: dimen(14),
    lineHeight: dimen(24),
    fontFamily: Fonts.dmRegular,
    marginLeft: widthDimen(10)
  },
  copyView: {
    flexDirection: 'row',
    borderRadius: dimen(14),
  },
  copyIconStyle: {
    resizeMode: 'contain',
  },
});
