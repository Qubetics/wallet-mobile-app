import { BlurView } from "@react-native-community/blur";
import React from "react";
import {
  Image,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { ThemeManager } from "../../../ThemeManager";
import { Fonts, Images } from "../../theme";
import { dimen, heightDimen } from "../../Utils";
import { Button } from "./Button";
import { LoaderView } from "./LoaderView";
import Singleton from "../../Singleton";
import { toFixedExp } from "../../Utils/MethodsUtils";
import { COIN_INFO_BY_FAMILY } from "../../Constants";

const ConfirmAbstraction = ({
  fromToken,
  toToken,
  gasFee,
  onCancel,
  onConfirm,
  visible,
  onClose,
  fromAmt,
  toAmt,
  fiatVal,
  isLoading,
  platFormFee,
  fiatValTics,
}) => {
  return (
    <Modal visible={visible} transparent animationType="fade">
      <BlurView
        style={styles.blurView}
        blurType="light"
        blurAmount={2}
        reducedTransparencyFallbackColor="white"
      />
      <TouchableOpacity
        style={styles.overlay}
        TouchableOpacityTouchableOpacityTouchableOpacity
        activeOpacity={1}
      >
        <View
          style={{
            ...styles.container,
            backgroundColor: ThemeManager.colors.mnemonicsBg,
          }}
        >
          <Text
            style={{
              ...styles.title,
              color: ThemeManager.colors.blackWhiteText,
            }}
          >
            Confirm Abstraction
          </Text>
          <Text
            style={{
              ...styles.subtitle,
              color: ThemeManager.colors.legalGreyColor,
            }}
          >
            Please review your transaction details
          </Text>

          {/* From Token */}
          <View
            style={{
              ...styles.card,
              backgroundColor: ThemeManager.colors.inputBgNew,
            }}
          >
            <View style={styles.tokenInfo}>
              <Image source={{ uri: fromToken.coin_image }} style={styles.icon} />
              <View>
                <Text style={styles.tokenAmount}>{fromToken.coin_name}</Text>
                <Text style={styles.tokenLabel}>{fromToken.coin_symbol}</Text>
              </View>
            </View>
            <View>
              <Text style={styles.tokenAmount}>{fromAmt}</Text>
              {/* <Text style={styles.fiatValue}>
                ≈ {fromToken.fiatValue}$1992.30
              </Text> */}
            </View>
          </View>

          {/* Arrow */}
          <Text style={styles.arrow}>↓</Text>

          {/* To Token */}
          <View
            style={{
              ...styles.card,
              backgroundColor: ThemeManager.colors.inputBgNew,
            }}
          >
            <View style={styles.tokenInfo}>
              <Image source={{ uri: toToken.coin_image }} style={styles.icon} />
              <View>
                <Text style={styles.tokenAmount}>{toToken.coin_name}</Text>
                <Text style={styles.tokenLabel}>{toToken.coin_symbol}</Text>
              </View>
            </View>
            <View>
              <Text style={styles.tokenAmount}>{toAmt}</Text>
              {/* <Text style={styles.fiatValue}>
                ≈ {fromToken.fiatValue}$1992.30
              </Text> */}
            </View>
          </View>

          {/* Gas Fee */}
          <View
            style={[
              styles.feeBox,
              { backgroundColor: ThemeManager.colors.inputBgNew },
            ]}
          >
            <View style={styles.feeLabelRow}>
              <Text
                style={{
                  ...styles.feeLabel,
                  color: ThemeManager.colors.blackWhiteText,
                }}
              >
                Transaction Fee
              </Text>
              <TouchableOpacity>
                <Image source={Images.infoGradient} style={styles.imgStyle} />
              </TouchableOpacity>
            </View>
            <Text
              style={{
                ...styles.feeValue,
                color: ThemeManager.colors.blackWhiteText,
                // flex: 0.9, 
                // textAlign:'right'
              }}
            >
              {gasFee && gasFee + ' ' + COIN_INFO_BY_FAMILY[fromToken?.coin_family]?.coin_symbol?.toUpperCase()}{fiatVal}
            </Text>
          </View>
          {/* platForm Fee */}

          <View
            style={[
              styles.feeBox,
              { backgroundColor: ThemeManager.colors.inputBgNew },
            ]}
          >
            <View style={styles.feeLabelRow}>
              <Text
                style={{
                  ...styles.feeLabel,
                  color: ThemeManager.colors.blackWhiteText,
                }}
              >
                PlatForm Fee
              </Text>
            </View>
            <Text
              style={{
                ...styles.feeValue,
                color: ThemeManager.colors.blackWhiteText,
              }}
            >
              {platFormFee && platFormFee + ' ' + 'Tics'}{fiatValTics}
            </Text>
          </View>

          {/* Buttons */}
          <View style={styles.buttonRow}>
            <View style={{ flex: 1, marginRight: dimen(10) }}>
              <Button normalBtn1={true} buttontext={"Cancel"} onPress={onClose} />
            </View>
            <View style={{ flex: 1, marginLeft: dimen(10) }}>
              <Button buttontext={"Confirm"} onPress={onConfirm} />
            </View>
          </View>
        </View>
      </TouchableOpacity>
      <LoaderView isLoading={isLoading} />

    </Modal>
  );
};

export default ConfirmAbstraction;

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    padding: dimen(20),
    margin: dimen(20),
  },
  blurView: {
    position: "absolute",
    top: 0,
    left: 0,
    bottom: 0,
    right: 0,
    flex: 1,
  },
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    // paddingHorizontal: widthDimen(40),
  },
  title: {
    fontSize: dimen(18),
    textAlign: "center",
    fontFamily: Fonts.dmBold,
  },
  subtitle: {
    fontSize: dimen(13),
    textAlign: "center",
    marginBottom: 20,
    fontFamily: Fonts.dmRegular,
  },
  card: {
    borderRadius: 12,
    padding: dimen(14),
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: dimen(12),
  },
  tokenInfo: {
    flexDirection: "row",
    alignItems: "center",
  },
  icon: {
    width: dimen(38),
    height: dimen(38),
    marginRight: dimen(12),
    resizeMode: "contain",
  },
  tokenAmount: {
    color: ThemeManager.colors.blackWhiteText,
    fontSize: dimen(16),
    fontFamily: Fonts.dmBold,
  },
  tokenLabel: {
    color: ThemeManager.colors.legalGreyColor,
    fontSize: dimen(12),
    fontFamily: Fonts.dmRegular,
  },
  fiatValue: {
    color: ThemeManager.colors.legalGreyColor,
    fontSize: dimen(13),
    fontFamily: Fonts.dmRegular,
  },
  arrow: {
    color: ThemeManager.colors.legalGreyColor,
    fontSize: dimen(20),
    textAlign: "center",
    marginVertical: dimen(4),
  },
  feeBox: {
    borderRadius: 10,
    padding: dimen(12),
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: heightDimen(20),
  },
  feeLabelRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  feeLabel: {
    fontSize: dimen(14),
    fontFamily: Fonts.dmRegular,
  },
  imgStyle: {
    width: dimen(14),
    height: dimen(14),
    resizeMode: "contain",
    marginLeft: dimen(5),
  },
  feeValue: {
    fontSize: dimen(16),
    fontFamily: Fonts.dmMedium,
    flex: 0.9,
    textAlign: 'right'
  },
  feeText: {
    color: ThemeManager.colors.legalGreyColor,
    fontSize: dimen(13),
    fontFamily: Fonts.dmRegular,
  },
  buttonRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: heightDimen(30),
  },
  cancelBtn: {
    flex: 1,
    backgroundColor: ThemeManager.colors.inputBgNew,
    borderRadius: 12,
    paddingVertical: dimen(12),
    marginRight: dimen(10),
  },
  confirmBtn: {
    flex: 1,
    backgroundColor: ThemeManager.colors.inputBgNew,
    borderRadius: 12,
    paddingVertical: dimen(12),
    marginLeft: dimen(10),
  },
  cancelText: {
    color: ThemeManager.colors.legalGreyColor,
    fontSize: dimen(15),
    textAlign: "center",
    fontFamily: Fonts.dmRegular,
  },
  confirmText: {
    color: ThemeManager.colors.blackWhiteText,
    fontSize: dimen(15),
    textAlign: "center",
    fontFamily: Fonts.dmRegular,
  },
});
