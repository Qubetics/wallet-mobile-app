import { StyleSheet } from "react-native";
import { dimen, widthDimen } from "../../../Utils";
import { Fonts } from "../../../theme";

export default StyleSheet.create({
  mainView: {
    flex: 1,
  },
  toggleIcon: {
    width: dimen(36),
    height: dimen(22),
    resizeMode:'contain',
  },
  listContainer:{
  marginHorizontal: widthDimen(24),
  },
  mainStyleOne: {},
  imagetextContainerNew: {
    marginTop: dimen(31),
    flexDirection: "row",
    justifyContent: "space-between",
    // marginTop: dimen(32),
  },
  txt2: {
    fontSize: dimen(18),
    lineHeight: dimen(24),
    fontFamily: Fonts.dmBold,
    marginRight: dimen(30),
  },
  crossIconStyle: {
    height: dimen(20),
    width: dimen(20),
    resizeMode: "contain",
  },
});
