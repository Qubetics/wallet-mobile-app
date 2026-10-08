import { useEffect, useState } from "react";
import {
  Image,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from "react-native";
import { EventRegister } from "react-native-event-listeners";
import { ThemeManager } from "../../../ThemeManager";
import { Fonts } from "../../theme";
import { HeaderMain } from "./HeaderMain";

export const CustomTokenModal = (props) => {
  const [themeSelected, setThemeSelected] = useState();

  //******************************************************************************************/
  useEffect(() => {
    EventRegister.addEventListener("getThemeChanged", (data) => {
      setThemeSelected(data);

    });
  }, []);

  //******************************************************************************************/
  return (
    <Modal
      statusBarTranslucent
      animationType="fade"
      transparent={true}
      visible={props.openModel}
      onRequestClose={props.onPressIn}
    >
      {/* <SafeAreaView style={[styles.centeredView]}> */}
      <View
        style={[
          styles.modalView,
          {
            backgroundColor: ThemeManager.colors.mainBgNew,
            // paddingTop: Platform.OS == 'ios' ? (DeviceInfo.hasNotch() ? 50 : 0) : (deviceName == 'OPPO F19 Pro' || 'OnePlus NordCE 5G' ? 0 : 20)
          },
        ]}
      >
        <HeaderMain
          backCallBack={props.onPressIn}
          BackButtonText={"Network"}
        ></HeaderMain>
        <View style={{ marginHorizontal: 15 }}>
          {props.list?.map((item, index) => {
            return (
              <TouchableOpacity
                disabled={props.disabled}
                key={index + ""}
                onPress={() => props.onPress(item, index)}
                style={[
                  styles.touchableStyle,
                  {
                    borderBottomWidth: 1,
                    borderColor: ThemeManager.colors.dividerColor,
                  },
                ]}
              >
                <View style={{ flexDirection: "row", alignItems: "center" }}>
                  <Image style={styles.imgStyle} source={{ uri: item.image }} />
                  <Text
                    allowFontScaling={false}
                    style={[
                      styles.textStyle1,
                      {
                        color:
                          index == props.selectedIndex
                            ? ThemeManager.colors.blackWhiteText
                            : ThemeManager.colors.blackWhiteText,
                        fontFamily: index == props.selectedIndex
                          ? Fonts.dmSemiBold
                          : Fonts.dmLight
                      },
                    ]}
                  >
                    {item.symbol}
                  </Text>
                </View>
                <Image source={ThemeManager.ImageIcons.forwardIcon} />
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* <TouchableOpacity onPress={props.onPressIn} style={[styles.centeredView1]} /> */}

      {/* </SafeAreaView> */}
      {/* <SafeAreaView style={{ backgroundColor: ThemeManager.colors.bottomSheetColor }} /> */}
    </Modal>
  );
};

//******************************************************************************************/
const styles = StyleSheet.create({
  textStyle1: {
    marginLeft: 10,
    fontSize: 16,
    fontFamily: Fonts.dmRegular,
  },
  modalView: {

    flex: 1,
  },
  touchableStyle: {
    flexDirection: "row",
    paddingVertical: 12,
    alignItems: "center",
    borderRadius: 10,
    marginTop: 5,
    justifyContent: "space-between",
  },
  imgStyle: {
    height: 32,
    width: 32,
    borderRadius: 32,
  },
});
