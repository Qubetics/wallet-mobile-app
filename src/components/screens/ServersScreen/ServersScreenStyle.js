import { StyleSheet } from "react-native";
import { dimen, heightDimen, widthDimen } from "../../../Utils";
import { Fonts } from "../../../theme";

export default StyleSheet.create({
  mainView: {
    flex: 1,
  },
  activeText: {
    fontSize: dimen(16),
    fontFamily: Fonts.dmSemiBold
  },
  row: {
    flexDirection: 'row',
    marginBottom: 10,
    // flexWrap: 'wrap',
  },
  row_1: {
    flexDirection: 'row',
    // marginBottom: 12,
    // flexWrap: 'wrap',
  },
  inactiveText: {
    fontSize: dimen(14),
    fontFamily: Fonts.dmRegular
  },
  

});
