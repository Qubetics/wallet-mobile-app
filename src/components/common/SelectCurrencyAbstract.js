/* eslint-disable react-native/no-inline-styles */
import React from "react";
import { Dimensions, Image, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { LanguageManager } from "../../../LanguageManager";
import { ThemeManager } from "../../../ThemeManager";
import { dimen, widthDimen } from "../../Utils";
import { useKeyboard } from "../../hooks/useKeyboard";
import { Fonts, Images } from "../../theme";
import { bigNumberSafeMath, toFixed, toFixedExp } from "../../Utils/MethodsUtils";
import Singleton from "../../Singleton";
const { width } = Dimensions.get("window");

const SelectCurrencyAbstract = (props) => {
  const { commonText } = LanguageManager;
  const { isKeyboardOpen } = useKeyboard();

  // useEffect(() => {
  //   if (isKeyboardOpen && Platform.OS === "android") {
  //     checkKeyboards();
  //   }
  // }, [isKeyboardOpen]);
  /******************************************************************************************/

  /******************************************************************************************/
  return (
    <View
      style={[
        styles.container,
        { borderColor: ThemeManager.colors.borderColor },
      ]}
    >
      {/* Available Balance & Max */}
      <View style={styles.balanceRow}>
        <Text
          style={[styles.label, { color: ThemeManager.colors.blackWhiteText }]}
        >
          {props?.isfrom ? "From" : "TO"}
        </Text>
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <Text
            style={[
              styles.label,
              { color: ThemeManager.colors.blackWhiteText },
            ]}
          >
            Available:
          </Text>
          <Text
            style={[
              styles.balanceText,
              { color: ThemeManager.colors.legalGreyColor },
            ]}
          >
            {toFixedExp(props?.item?.balance ?? "0", 8)} {props?.item?.coin_symbol?.toUpperCase()}
          </Text>
          {props?.isMax && (
            <TouchableOpacity onPress={props.onPressMax} style={styles.maxButton}>
              <Text
                style={[
                  styles.maxText,
                  { color: ThemeManager.colors.blackWhiteText },
                ]}
              >
                MAX
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Token Box */}
      <View
        style={[
          styles.tokenBoxOuter,
          { backgroundColor: ThemeManager.colors.mnemonicsBg },
        ]}
      >
        <View style={[styles.tokenBox]}>
          <TouchableOpacity
            onPress={props.onPressCoin}
            style={[
              styles.tokenRow,
              { backgroundColor: ThemeManager.colors.inputBgNew },
            ]}
          >
            {/* Token Icon */}
            <Image
              source={{uri:props?.item?.coin_image}} // Replace with actual token icon
              style={styles.tokenIcon}
            />
            <View style={{ marginLeft: 8 }}>
              <Text
                style={[
                  styles.tokenSymbol,
                  { color: ThemeManager.colors.blackWhiteText },
                ]}
              >
                {props?.item?.coin_symbol?.toUpperCase()}
              </Text>
              <Text
                style={[
                  styles.tokenName,
                  { color: ThemeManager.colors.legalGreyColor },
                ]}
              >
                {props?.item?.coin_name}
              </Text>
            </View>
            <Image source={Images.dropDown} style={styles.imageStyle} />
          </TouchableOpacity>

          {/* Amount Input */}
          <View style={styles.inputContainer}>
            <TextInput
              keyboardType="decimal-pad"
              style={[
                styles.amountInput,
                {
                  color: ThemeManager.colors.blackWhiteText,
                  // fontSize: props?.value?.length > 10? dimen(18) :
                  //         props?.value?.length > 15 ? dimen(22) : dimen(25),
                },
              ]}
              placeholderTextColor={ThemeManager.colors.legalGreyColor}
              onChangeText={props.onChangeNumber}
              placeholder={props.placeholder || "0.0"}
              editable={props.editable}
              maxLength={props.maxLength}
              value={props.value}
              onBlur={props.onBlur}
              numberOfLines={!props.editable ? 1 : undefined}
            />
          </View>
          {props?.onPressUSD && <TouchableOpacity 
          style={{ alignSelf: 'center', marginLeft: 8}}
          onPress={props.onPressUSD}>
          <Text style={[styles.usdText]}>{props?.isUSD ? "USD" : props?.item?.coin_symbol?.toUpperCase()}</Text>
   
          </TouchableOpacity>}
           </View>
        {/* USD Equivalent */}

        <Text
          style={[
            styles.usdText,
            { color: ThemeManager.colors.legalGreyColor },
          ]}
        >
          ≈ {(props?.onPressUSD && props?.isUSD )? "" : Singleton.getInstance().CurrencySymbol }
          {props?.onPressUSD ? props?.valueInFiat : props?.value ? toFixed(bigNumberSafeMath(props?.item?.fiat_price_data?.value, "*", props?.value), 2) : "0.00"}
          {" "}{(props?.onPressUSD && props?.isUSD )?  props?.item?.coin_symbol?.toUpperCase() : "" }
        </Text>
      </View>
      {/* From Address */}
      <Text
        style={{
          ...styles.textStyle,
          color: ThemeManager.colors.blackWhiteText,
        }}
      >
        {props?.isfrom ? "From" : "To"} Address
      </Text>
      {props?.isfrom ? (
        <>
          <View
            style={[
              styles.addressBox,
              { backgroundColor: ThemeManager.colors.mnemonicsBg },
            ]}
          >
            <View style={styles.greenDot} />
            <Text style={styles.addressText}>{props?.fromAddress}</Text>
          </View>
        </>
      ) : (
        <>
          <TextInput
            style={[
              styles.input,
              { backgroundColor: ThemeManager.colors.inputBgNew },
            ]}
            placeholderTextColor={ThemeManager.colors.legalGreyColor}
            placeholder={props.placeholder || "Enter recipient address"}
            editable={props.editable}
            maxLength={props.maxLength}
            value={props.toAddress}
            numberOfLines={1}
            onChangeText={props.onChangeAddress}
          />
        </>
      )}
    </View>
  );
};

/******************************************************************************************/
const styles = StyleSheet.create({
  container: {
    // padding: dimen(16),
    // borderRadius: 12,
    // borderWidth: 1,
  },
  balanceRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    // marginBottom: 8,
  },
  label: {
    fontSize: dimen(14),
    fontFamily: Fonts.dmMedium,
  },
  balanceText: {
    marginLeft: widthDimen(4),
    fontSize: dimen(14),
    fontFamily: Fonts.dmRegular,
  },
  maxButton: {
    backgroundColor: "#2a3b6b",
    paddingHorizontal: widthDimen(10),
    paddingVertical: dimen(4),
    borderRadius: dimen(6),
    marginLeft: "auto",
    marginLeft: widthDimen(10),
  },
  maxText: {
    color: "#56a8ff",
    fontSize: dimen(14),
    fontWeight: "600",
  },
  tokenBoxOuter: {
    backgroundColor: "#131a2a",
    padding: dimen(16),
    borderRadius: dimen(12),
    marginBottom: dimen(12),
    marginTop: dimen(10),
  },
  tokenBox: {
    flexDirection: "row",
  },
  tokenRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: dimen(12),
    backgroundColor: "red",
    padding: dimen(10),
    borderRadius: dimen(10),
  },
  tokenIcon: {
    width: dimen(32),
    height: dimen(32),
    borderRadius: dimen(16),
    backgroundColor: "#222",
  },
  tokenSymbol: {
    fontSize: dimen(16),
    fontFamily: Fonts.dmRegular,
  },
  tokenName: {
    fontSize: dimen(12),
    fontFamily: Fonts.dmRegular,
  },
  amountInput: {
    fontSize: dimen(21),
    fontFamily: Fonts.dmSemiBold,
    width: "100%",
    padding: 0,
    height: 55,
    // backgroundColor:'pink',
    textAlign: "right",
  },
  usdText: {
    fontSize: dimen(12),
    color: ThemeManager.colors.legalGreyColor,
    textAlign: "right",
    fontFamily: Fonts.dmRegular,
  },
  addressBox: {
    flexDirection: "row",
    alignItems: "center",
    padding: dimen(12),
    borderRadius: 8,
  },
  greenDot: {
    width: dimen(10),
    height: dimen(10),
    borderRadius: dimen(5),
    backgroundColor: "#38d05f",
    marginRight: widthDimen(8),
  },
  addressText: {
    color: "#ccc",
    fontSize: dimen(14),
    marginRight: widthDimen(12),
    fontFamily: Fonts.dmRegular
  },
  inputContainer: {
    // backgroundColor:'yellow',
    flex: 1,
    justifyContent: "center",
    alignItems: "flex-end",
  },
  imageStyle: {
    width: 10,
    height: 10,
    resizeMode: "contain",
    marginLeft: 10,
  },
  textStyle: {
    color: ThemeManager.colors.blackWhiteText,
    fontSize: dimen(14),
    fontFamily: Fonts.dmMedium,
    marginBottom: dimen(10),
  },
  input: {
    borderRadius: dimen(10),
    paddingVertical: dimen(10),
    paddingHorizontal: dimen(12),
    fontSize: dimen(15),
    color: ThemeManager.colors.blackWhiteText,
  },
});

export { SelectCurrencyAbstract };
