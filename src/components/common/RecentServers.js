import React from "react";
import { FlatList, StyleSheet, Text, View } from "react-native";
import { LanguageManager } from "../../../LanguageManager";
import { ThemeManager } from "../../../ThemeManager";
import { dimen, heightDimen, widthDimen } from "../../Utils";
import { Fonts } from "../../theme";
import images from "../../theme/Images";
import ServerCards from "./ServerCards";
import { Actions } from "react-native-router-flux";


const RecentServers = ({ fromServerScreen, container, isFavShow, onPress, dataList, listType,cityFlag }) => {
  const { vpn } = LanguageManager;

  const renderItem = ({ item, index }) => (
    console.log("item---",item),
    <ServerCards
      flag={listType === 'City' ? cityFlag : item?.flag_url}
      name={listType === 'Country' ?item?.country: listType === 'City' ?item?.city : ''}
      index={index}
      locations={item?.node_count}
      ping={''}
      isFavShow={isFavShow}
      onPress={() => {
        onPress && onPress(item);
      }}
    />
  );

  return (
    <>
      <View style={[styles.container, container, {}]}>
        {!fromServerScreen && (
          <View style={styles.header}>
            <Text
              style={[
                styles.title,
                { color: ThemeManager.colors.headersTextColor },
              ]}
            >
              {vpn.recentServers}
            </Text>
            <Text
              onPress={() =>
                Actions.currentScene != "ServersScreen" &&
                Actions.ServersScreen()
              }
              style={[
                styles.viewAll,
                { color: ThemeManager.colors.legalGreyColor },
              ]}
            >
              {vpn.viewAll}
            </Text>
          </View>
        )}
      </View>
      <FlatList
        data={dataList}
        showsVerticalScrollIndicator={false}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.listContainer}
      />
    </>
  );
};

export default RecentServers;

const styles = StyleSheet.create({
  listContainer: {
    marginHorizontal: widthDimen(24),
  },
  container: {
    marginTop: heightDimen(20),
    marginHorizontal: widthDimen(24),
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
});
