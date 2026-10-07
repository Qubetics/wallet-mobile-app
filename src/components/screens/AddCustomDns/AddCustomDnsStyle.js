import { StyleSheet } from 'react-native';
import { dimen } from '../../../Utils';
import fonts from '../../../theme/Fonts';

export default StyleSheet.create({
    mainView: {
        flex: 1,
    },
    radioTextStyle: {
        fontFamily: fonts.dmMedium,
        fontSize: dimen(14),
        marginTop: dimen(20),
    },
    btnViewModal: {
        flexDirection: "row",
        alignSelf: "center",
        // paddingHorizontal: dimen(35),
        marginBottom: dimen(40),
        // marginTop: dimen(36),
        // flex:1,
      },
      borderButtonStyle: {
        width: "99%",
        height: "96%",
        alignItems: "center",
        justifyContent: "center",
        borderRadius: dimen(14),
      },
      buttonContainer:{
        flex: 1,
        justifyContent: "flex-end",
    marginBottom: dimen(24),
    marginHorizontal: dimen(24),
  },
  radioBtnContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: dimen(12)
  }
})