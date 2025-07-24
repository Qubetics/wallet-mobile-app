import { BlurView } from "@react-native-community/blur";
import React from "react";
import { Modal, StyleSheet, Text, View } from "react-native";
import FastImage from "react-native-fast-image";
import { LanguageManager } from "../../../LanguageManager";
import { ThemeManager } from "../../../ThemeManager";
import { Colors, Fonts, Images } from "../../theme";
import { dimen, heightDimen, widthDimen } from "../../Utils";
import { Button } from "./Button";
import { TouchableOpacity } from "react-native";

const SlippageImpactModal = ({
  visible,
  onRequestClose = () => { },
  customStyle,
  onContinuePress = () => { },
  onReduceSlippagePress = () => { },
}) => {
  return (
    <Modal
      statusBarTranslucent
      animationType="fade"
      transparent={true}
      visible={visible}
      onRequestClose={onRequestClose}
    >
      <BlurView
        style={styles.blurView}
        blurType="dark"
        blurAmount={2}
        reducedTransparencyFallbackColor="white"
      />
      <View style={[styles.centeredView, styles.absoluteView, customStyle]}>
        <View
          style={[
            styles.modalView,
            {
              backgroundColor: ThemeManager.colors.mainBgNew,
              borderColor: ThemeManager.colors.modalBorder,
            },
          ]}
        >
          <TouchableOpacity onPress={onRequestClose}>
            <FastImage
              source={Images?.closeIcon}
              style={styles.clossIcon}
              resizeMode={"contain"}
            />
          </TouchableOpacity>
          <FastImage
            source={Images?.infoNew}
            style={styles.imageStyle}
            resizeMode={"contain"}
          />
          <Text
            style={[
              styles?.titleStyle,
              { color: ThemeManager.colors.blackWhitePure },
            ]}
          >
            {"Slippage is too high"}
          </Text>

          <Button
            onPress={onContinuePress}
            buttontext={"Continue at Your Own Risk"}
          />

          <TouchableOpacity
            onPress={onReduceSlippagePress}
            style={{
              borderWidth: 1,
              borderColor: ThemeManager.colors.borderColor,
              borderRadius: 14,
              marginTop: dimen(15),
              marginBottom: dimen(20),
              paddingVertical: dimen(15),
            }}
          >
            <Text
              allowFontScaling={false}
              style={[
                styles.txtDelete,
                {
                  color: ThemeManager.colors.blackWhiteText,
                  textAlign: "center",
                },
              ]}
            >
              {"Reduce Slippage"}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

export default SlippageImpactModal;

const styles = StyleSheet.create({
  blurView: {
    position: "absolute",
    top: 0,
    left: 0,
    bottom: 0,
    right: 0,
    flex: 1,
  },
  absoluteView: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    elevation: 1,
  },
  centeredView: {
    backgroundColor: "rgba(0,0,0,0.4)",
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: dimen(18),
  },
  modalView: {
    backgroundColor: Colors.White,
    borderRadius: dimen(20),
    width: "90%",
    alignSelf: "center",
    borderWidth: 1,
    padding: dimen(20),
  },
  imageStyle: {
    height: heightDimen(40),
    width: widthDimen(40),
    alignSelf: "center",
    marginTop: dimen(40),
    marginBottom: dimen(20),
  },
  clossIcon: {
    height: heightDimen(21),
    width: widthDimen(21),
    position: "absolute",
    right: 0,
    top: 0,
  },
  titleStyle: {
    fontFamily: Fonts.dmRegular,
    fontSize: dimen(20),
    marginBottom: dimen(20),
    alignSelf: "center",
  },
  subTitleStyle: {
    fontFamily: Fonts.dmSemiBold,
    fontSize: dimen(14),
    marginBottom: dimen(50),
    alignSelf: "center",
  },
});
