import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { LanguageManager } from "../../../../LanguageManager";
import { ThemeManager } from "../../../../ThemeManager";
import { dimen, heightDimen, widthDimen } from "../../../Utils";
import { Fonts, Images } from "../../../theme";
import ConnectedStatusCard from "../../common/ConnectedStatusCard";
import LocationInfoCard from "../../common/LocationInfoCard";
import RecentServers from "../../common/RecentServers";
import { Actions } from "react-native-router-flux";

const ConnectContainer = ({ countryList,vpnLocation = null,vpnIP }) => {
  const { vpn } = LanguageManager;
  return (
    <>
      <View style={styles.container}>
        <ConnectedStatusCard
          title1={vpn.status}
          title2={vpn.connected}
          rightText={vpn.protected}
        />
        <LocationInfoCard
          icon={ThemeManager.ImageIcons.vpn_globe_grey}
          location={vpnLocation}
          ip={`IP: ${vpnIP}`}
          tintColor={ThemeManager.colors.headersTextColor}
        />
      </View>

      <View style={styles.subHeaderView}>
        <Text
          style={[
            styles.leftText,
            { color: ThemeManager.colors.headersTextColor },
          ]}
        >
          {LanguageManager.vpn.recentServers}
        </Text>
        <Text
          onPress={() =>
            Actions.currentScene != "ServersScreen" && Actions.ServersScreen()
          }
          style={[
            styles.rightText,
            { color: ThemeManager.colors.legalGreyColor },
          ]}
        >
          {LanguageManager.vpn.viewAll}
        </Text>
      </View>

      <RecentServers
        container={{ marginTop: heightDimen(10) }}
        fromServerScreen
        isFavShow={false}
        dataList={countryList}
        listType={"Country"}
        onPress={(item) => {
          Actions.currentScene != "WishlistServersScreen" &&
            Actions.WishlistServersScreen({ country: item?.country || "" });
        }}
      />
    </>
  );
};

export default ConnectContainer;

const styles = StyleSheet.create({
  container: {
    marginHorizontal: widthDimen(24),
    marginTop: heightDimen(40),
  },
  subHeaderView: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: heightDimen(20),
    marginHorizontal: widthDimen(24),
  },
  leftText: {
    fontSize: dimen(18),
    fontFamily: Fonts.dmMedium,
  },
  rightText: {
    fontSize: dimen(14),
    fontFamily: Fonts.dmMedium,
  },
});
