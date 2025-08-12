import React, { useEffect, useState } from "react";
import {
  BackHandler,
  Dimensions,
  ImageBackground,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { EventRegister } from "react-native-event-listeners";
import { ActionConst, Actions } from "react-native-router-flux";
import { connect } from "react-redux";
import { LanguageManager } from "../../../../LanguageManager";
import { ThemeManager } from "../../../../ThemeManager";
import * as Constants from "../../../Constants";
import Singleton from "../../../Singleton";
import images from "../../../theme/Images";
import { widthDimen } from "../../../Utils";
import { HeaderMain, InputtextSearch, LoaderView } from "../../common";
import RecentServers from "../../common/RecentServers";
import VpnGradientCard from "../../common/VpnGradientCard";
import styles from "./ServersScreenStyle";
import { consoleLogFunc } from "../../../Utils/MethodsUtils";
import { getVpnNodes } from "../../Api/VPN/api/getVpnNodes";

const filters1 = ["All", "V2Ray", "Wireguard"];

const ServersScreen = (props) => {
  const { vpn } = LanguageManager;
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [selected1, setSelected1] = useState("All");
  const [selected2, setSelected2] = useState("All Locations");
  const [countryList, setCountryList] = useState([]);
  const [filteredCountryList, setFilteredCountryList] = useState([]);

  useEffect(() => {
    BackHandler.addEventListener("hardwareBackPress", handleBackButtonClick);
    const focusListener = props.navigation.addListener("didFocus", () => {
      BackHandler.addEventListener("hardwareBackPress", handleBackButtonClick);
      loadVpnNodes();
    });
    const blurListener = props.navigation.addListener("didBlur", () => {
      BackHandler.removeEventListener(
        "hardwareBackPress",
        handleBackButtonClick
      );
    });

    EventRegister.addEventListener(Constants.DOWN_MODAL, () => {});
    loadVpnNodes();
    return () => {
      focusListener.remove();
      blurListener.remove();
      BackHandler.removeEventListener(
        "hardwareBackPress",
        handleBackButtonClick
      );
    };
  }, []);

  const handleBackButtonClick = () => {
    Singleton.bottomBar?.navigateTab("WalletMain");
    Actions.Main({ type: ActionConst.RESET });
    return true;
  };

  const loadVpnNodes = async () => {
    try {
      const result = await getVpnNodes({
        limit: 10,
        page: 1,
        order: "ASC",
        count_total: true,
        reverse: false,
      });

      if (!result.Error) {
        console.log("✅ all VPN Nodes:", result);
        console.log("✅ VPN Nodes:", result?.data?.countries);
        setCountryList(result?.data?.countries);
        setFilteredCountryList(result?.data?.countries);

        if (result?.total) {
          console.log("Total Nodes:", result?.data?.total);
        }
      } else {
        console.warn("⚠️ Failed to fetch nodes:", result.Message);
      }
    } catch (err) {
      console.error("❌ Error fetching nodes:", err.message);
    }
  };

  const renderButton = (label, selected, setSelected) => {
    const isActive = label === selected;

    const ButtonContent = (
      <Text
        style={[
          isActive ? styles.activeText : styles.inactiveText,
          {
            color: isActive
              ? ThemeManager.colors.headersTextColor
              : ThemeManager.colors.legalGreyColor,
          },
        ]}
      >
        {label}
      </Text>
    );

    return (
      <Pressable
        key={label}
        onPress={() => setSelected(label)}
        style={{ marginRight: widthDimen(15) }}
      >
        {isActive ? (
          <VpnGradientCard children={ButtonContent} />
        ) : (
          <VpnGradientCard isOutLine children={ButtonContent} />
        )}
      </Pressable>
    );
  };
  const updateSearch = (text) => {
    let list = countryList.filter((res) =>
      res.country?.toLowerCase().startsWith(text.toLowerCase())
    );
    setFilteredCountryList(list);
  };
  return (
    <ImageBackground
      source={ThemeManager.ImageIcons.mainBgImgNew}
      style={{ flex: 1, backgroundColor: ThemeManager.colors.mainBgNew }}
    >
      <View style={[styles.mainView]}>
        <HeaderMain
          BackButtonText={vpn.servers}
          customStyle={{ paddingHorizontal: widthDimen(24) }}
          showBackBtn={true}
        />
        <InputtextSearch
          style={{
            height: 50,
            width: Dimensions.get("screen").width - widthDimen(48),
          }}
          placeholder={vpn.searchCountry}
          returnKeyType={"done"}
          value={search}
          search={true}
          clear={search ? true : false}
          pressClear={() => {
            setSearch("");
            updateSearch("");
          }}
          onChangeNumber={(text) => {
            setSearch(text);
            updateSearch(text);
            console.log("SERARCH_____", text);
          }}
          onSubmitEditing={() => updateSearch(search)}
        />

        <View style={{ marginLeft: widthDimen(20), marginTop: 20 }}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.row}
          >
            {filters1.map((label) =>
              renderButton(label, selected1, setSelected1)
            )}
          </ScrollView>
        </View>

        <RecentServers
          container={{ marginHorizontal: widthDimen(24) }}
          fromServerScreen
          isFavShow={true}
          dataList={filteredCountryList}
          listType={"Country"}
          onPress={(item) => {
            console.log("item====>>>>>>>>>", item);
            Actions.currentScene != "WishlistServersScreen" &&
              Actions.WishlistServersScreen({ country: item?.country || "" });
          }}
        />
        <LoaderView isLoading={loading} />
      </View>
    </ImageBackground>
  );
};

export default connect(undefined, {})(ServersScreen);
