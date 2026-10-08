import { StyleSheet } from "react-native";
import { Fonts } from "../../../theme/";
import {
  getDimensionPercentage as dimen,
  getDimensionPercentage,
} from "../../../Utils";

export default StyleSheet.create({

  mainView: {
    flex: 1,
    // position:'absolute', top:0, bottom:0, left:0, right:0
  },
  mainViewStyle: {
    flex: 1,
    // paddingBottom:20
    // paddingHorizontal: getDimensionPercentage(24)
  },
  cardStyle: { flexDirection: "row", alignItems: "center", },

  txt2: {
    fontSize: dimen(18),
    lineHeight: dimen(24),
    fontFamily: Fonts.dmBold,
    marginRight: dimen(30),
  },
  imagetextContainer: {
    marginTop: dimen(43),
    // marginTop: dimen(32),
  },
  imagetextContainerOne: {
    flexDirection: "row",
    // alignItems: "center",
    marginTop: dimen(21),
  },
  imagetextContainerThree: {
    flexDirection: "row",
    marginTop: dimen(16),
  },
  dotStyle: {
    height: dimen(18),
    width: dimen(18),
    justifyContent: "center",
    marginTop: getDimensionPercentage(3),
    resizeMode: "contain",
    alignSelf: "center",
    // padding:5
    marginTop: 5,
  },
  txt4: {
    fontSize: dimen(12),
    lineHeight: dimen(24),
    fontFamily: Fonts.dmMedium,
    marginLeft: dimen(6),
    // marginRight:1
  },
  btnViewModal: {
    flexDirection: "row",
    alignSelf: "center",
    paddingHorizontal: dimen(35),
    marginBottom: dimen(40),
    marginTop: dimen(36),
  },

  borderButtonStyle: {
    width: "99%",
    height: "96%",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: dimen(14),

  },
});
