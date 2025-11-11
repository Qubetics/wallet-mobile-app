import React from "react";
import { Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { LanguageManager } from "../../../LanguageManager";
import { ThemeManager } from "../../../ThemeManager";
import { Fonts } from "../../theme";
import { dimen, heightDimen, widthDimen } from "../../Utils";

const ServerCards = ({
  name,
  flag, // image url
  locations,// numberOfCountries
  locationTxt = locations > 1 ? "Locations" : "Location",
  ping,
  isFavShow,
  isUserSubscribed,
  onPress,
  index,
}) => {
  const { vpn } = LanguageManager;

  return (
    <TouchableOpacity
      key={index}
      activeOpacity={1}
      onPress={onPress}
      style={[
        styles.serverItem,
        { backgroundColor: ThemeManager.colors.mnemonicsBg },
      ]}
    >
      {flag ? <Image source={{ uri: flag }} style={styles.flag} />: 
      <View
      style={[
        styles.imgViewStyle,
        { backgroundColor: ThemeManager.colors.placeholderColorNew },
      ]}
    >
      <Text
        allowFontScaling={false}
        style={{
          color: ThemeManager.colors.primaryColor,
          fontSize: heightDimen(22),
        }}
      >
        {name.charAt(0)}
      </Text>
    </View>}
      <View style={styles.info}>
        <Text
          style={[styles.name, { color: ThemeManager.colors.headersTextColor }]}
        >
          {name}
        </Text>
        {!!locations && <View style={styles.detailsRow}>
          <Text
            style={[
              styles.details,
              { color: ThemeManager.colors.legalGreyColor },
            ]}
          >
          {locations + ' ' + locationTxt}
          {/* && vpn.locations */}
          </Text>
          {/* <Image
            source={ThemeManager.ImageIcons.cellular_connection}
            style={styles.connectionImg}
          />
          <Text
            style={[
              styles.details,
              { color: ThemeManager.colors.legalGreyColor },
            ]}
          >
            {ping} {vpn.ms}
          </Text> */}
        </View>}
      </View>
      {isFavShow && (
        <TouchableOpacity>
          <Image source={ThemeManager.ImageIcons.link_icon} />
        </TouchableOpacity>
      )}
      {isUserSubscribed && (
        <TouchableOpacity
        onPress={onPress}
        style={styles.subscribeButton}>
          <Text style={styles.subscribeButtonText}>{vpn.subscribe}</Text>
        </TouchableOpacity>
      )}
    </TouchableOpacity>
  );
};

export default ServerCards;

const styles = StyleSheet.create({
  serverItem: {
    borderRadius: 14,
    padding: dimen(16),
    marginBottom: heightDimen(8),
    flexDirection: "row",
    alignItems: "center",
  },
  flag: {
    width: dimen(40),
    height: dimen(40),
    borderRadius: 20,
    marginRight: widthDimen(10),
  },
  info: {
    flex: 1,
  },
  name: {
    fontSize: dimen(14),
    fontFamily: Fonts.dmMedium,
  },
  detailsRow: {
    flexDirection: "row",
    marginTop: 2,
    alignItems: "center",
  },
  details: {
    fontSize: dimen(14),
    fontFamily: Fonts.dmRegular,
  },
  connectionImg: {
    width: dimen(20),
    height: dimen(12),
    marginHorizontal: widthDimen(10),
  },
  subscribeButton:{
    width: dimen(95),
    height: dimen(40),
    backgroundColor:ThemeManager.colors.subscribeButtonColor,
    borderRadius: dimen(30),
    marginRight: widthDimen(24),
    justifyContent: 'center',
    alignItems: 'center',
  },
  subscribeButtonText:{
    fontSize: dimen(15),
    fontFamily: Fonts.dmMedium,
    color: ThemeManager.colors.subscribeButtonTextColor,
  },
  imgViewStyle: {
    height: dimen(50),
    marginRight: widthDimen(10),
    width: dimen(50),
    alignItems: "center",
    justifyContent: "center",
    marginLeft: widthDimen(10),
    borderRadius: dimen(25),
  },
});
