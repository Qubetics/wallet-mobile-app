import { StyleSheet } from "react-native";
import { ThemeManager } from "../../../../ThemeManager";
import { Colors, Fonts } from "../../../theme/";
import {
  bottomNotchWidth,
  getDimensionPercentage as dimen,
  getDimensionPercentage,
  heightDimen,
  widthDimen,
} from "../../../Utils";
import fonts from "../../../theme/Fonts";

export default StyleSheet.create({
  mainView:{
    flex: 1,
  },
  sectionHeaderText:{
    fontSize: dimen(18),
    fontFamily: fonts.dmRegular,
    // marginLeft: dimen(24),
    marginTop:dimen(20),
    marginBottom: dimen(10),
  }

})