import { StyleSheet } from "react-native";
import { dimen, heightDimen, widthDimen } from "../../../Utils";
import { Fonts } from "../../../theme";

export default StyleSheet.create({
  mainView: {
    flex: 1,
  },
  mainView_2: {
    flex: 1,
    marginHorizontal: widthDimen(24),
    marginTop: heightDimen(30)
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
  connectedText:{
    fontSize: dimen(26),
  },
  container: {
    // marginTop: heightDimen(5),
    // marginHorizontal: widthDimen(24),
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: heightDimen(10),
  },
  title: {
    fontSize: dimen(18),
    fontFamily: Fonts.dmMedium,
  },
  viewAll: {
    fontSize: dimen(14),
    fontFamily: Fonts.dmMedium,
  },
  bottomView:{
    flex:1,
    justifyContent:'flex-end',
    paddingBottom: heightDimen(40)
  },
  viewStyle:{
  
    width:'100%',
    height:'80%',
    justifyContent:'center',
    alignItems:'center',
// margin:3,

  },
  borderButtonStyle: {
    width: "99%",
    height: "96%",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: dimen(14),
    flexDirection: "row",
  },
});
