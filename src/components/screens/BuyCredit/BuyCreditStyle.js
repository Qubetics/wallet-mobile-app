import { StyleSheet } from "react-native";
import { dimen } from "../../../Utils";
import { Fonts } from "../../../theme";

export default StyleSheet.create({
  mainView: {
    flex: 1,
  },
  txtTitle:{
    fontSize: dimen(15),
    fontFamily: Fonts.dmMedium,
    // marginTop: Dimensions.get('window').height / 2.7,
  },
  emptyView:{justifyContent: 'center', alignItems: 'center'},
});
