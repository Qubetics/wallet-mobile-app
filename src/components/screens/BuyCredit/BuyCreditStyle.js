import { Dimensions, StyleSheet } from "react-native";
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
    cancelButton: {
    alignSelf: "flex-end",
    marginTop: dimen(28)
  },
  contentContainer: {
    justifyContent: 'center',
    alignItems: "center",
    marginTop: dimen(30)
  },
  titleText: {
    fontSize: dimen(20),
    fontFamily: Fonts.dmMedium
  },
  planText: {
    fontSize: dimen(18),
    fontFamily: Fonts.dmSemiBold,
    marginVertical: dimen(12)
  },
  descriptionText: {
    fontSize: dimen(18),
    fontFamily: Fonts.dmRegular,
    textAlign: "center"
  },
  buttonContainer: {
    width: '100%',
    alignSelf:'center',
  }
});
