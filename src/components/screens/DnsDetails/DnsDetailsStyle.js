import { StyleSheet } from "react-native";
import { heightDimen, widthDimen } from "../../../Utils";

export default StyleSheet.create({
  mainView: {
    flex: 1,
  },
  btnStyle:{
    flex:1,
    justifyContent:'flex-end',
    paddingBottom: heightDimen(40),
    marginHorizontal: widthDimen(24)
  }
});
