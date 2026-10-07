import {
  View,
  Text,
  Image,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from "react-native";
import { LanguageManager } from "../../../LanguageManager";
import { dimen, heightDimen, widthDimen } from "../../Utils";
import { ThemeManager } from "../../../ThemeManager";
import { Fonts } from "../../theme";
import { Actions } from '../../navigation/RootNavigation';

const QuickConnect = ({ countries }) => {
  const renderItem = ({ item }) => (
    <TouchableOpacity
      onPress={() => {
        Actions.currentScene != "WishlistServersScreen" &&
          Actions.WishlistServersScreen({ country: item?.country || "" });
      }}
      style={[
        styles.card,
        { backgroundColor: ThemeManager.colors.mnemonicsBg },
      ]}
    >
      <Image source={{ uri: item.flag_url }} style={styles.flag} />
      <Text
        style={[
          styles.countryText,
          { color: ThemeManager.colors.subTextColor },
        ]}
      >
        {item.country}
      </Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <Text style={[styles.title, { color: ThemeManager.colors.bottomColor }]}>
        {LanguageManager.vpn.country_list}
      </Text>
      <FlatList
        data={countries}
        horizontal
        keyExtractor={(item) => item.name}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        showsHorizontalScrollIndicator={false}
      />
    </View>
  );
};

export default QuickConnect;

const styles = StyleSheet.create({
  container: {
    marginHorizontal: widthDimen(24),
    marginTop: heightDimen(40),
  },
  title: {
    fontSize: dimen(18),
    fontFamily: Fonts.dmMedium,
    marginBottom: heightDimen(10),
  },
  listContent: {
    gap: 12,
  },
  card: {
    width: Dimensions.get("screen").width / 3.8,
    height: dimen(114),
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    marginRight: widthDimen(20),
  },
  flag: {
    width: dimen(40),
    height: dimen(40),
    borderRadius: 20,
    resizeMode: "cover",
  },
  countryText: {
    fontSize: dimen(16),
    textAlign: "center",
    fontFamily: Fonts.dmSemiBold,
    marginTop: heightDimen(8),
  },
});
