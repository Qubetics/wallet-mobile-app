import React, { useEffect, useRef, useState } from "react";
import {
  BackHandler,
  ImageBackground,
  Pressable,
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
import { heightDimen, widthDimen } from "../../../Utils";
import { Button, DvpnLoader, HeaderMain, LoaderView } from "../../common";
import ConnectedStatusCard from "../../common/ConnectedStatusCard";
import VpnGradientCard from "../../common/VpnGradientCard";
import styles from "./VpnAccountDetailsStyle";
import { getBalance } from "../../Api/VPN/api/startSubscriptionOnChain";
import { getData } from "../../../Utils/MethodsUtils";
import Clipboard from "@react-native-clipboard/clipboard";
import Toast from "react-native-easy-toast";

const filters1 = ["All", "Fastest", "Recommended", "Favorites"];
const filters2 = ["All Locations", "Americas", "Europe", "Asia"];

const VpnAccountDetails = (props) => {
  const { vpn } = LanguageManager;
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [selected1, setSelected1] = useState("All");
  const [selected2, setSelected2] = useState("All Locations");
  const [balance, setBalance] = useState();
  const [userAddress, setUserAddress] = useState();
  const toast = useRef(null);

  useEffect(() => {
    initScreen();

    BackHandler.addEventListener("hardwareBackPress", handleBackButtonClick);
    const focusListener = props.navigation.addListener("didFocus", () => {
      BackHandler.addEventListener("hardwareBackPress", handleBackButtonClick);
    });
    const blurListener = props.navigation.addListener("didBlur", () => {
      BackHandler.removeEventListener(
        "hardwareBackPress",
        handleBackButtonClick
      );
    });

    EventRegister.addEventListener(Constants.DOWN_MODAL, () => {});
    return () => {
      focusListener.remove();
      blurListener.remove();
      BackHandler.removeEventListener(
        "hardwareBackPress",
        handleBackButtonClick
      );
    };
  }, []);

  const initScreen = async () => {
    setLoading(true);
    try {
      const address = await loadUserInfo();
      await Promise.all([
        loadBalance(address), // ⬅️ will now have a valid userAddress
      ]);
    } catch (error) {
      console.error("🔴 initScreen error:", error.message);
    } finally {
      setLoading(false);
    }
  };

  const loadBalance = async (addressParam) => {
    const address = addressParam || userAddress;
    console.log("✅ Fetching balance for:", address);
    if (!address) {
      console.warn("🚫 Cannot load balance: address is undefined");
      return;
    }

    try {
      let balance = await getBalance({
        denom: "tics",
        address: address,
        rcp: Constants.COSMO_RPC_URL,
      });
      console.log("✅ Balance fetched:111", balance);
      setBalance(balance);
    } catch (e) {
      console.log("❌ VPN status check failed", e);
    }
  };

  const loadUserInfo = async () => {
    try {
      const address = await getData(Constants.COSMOS_ADDRESS);
      if (address) {
        setUserAddress(address); // ✅ update state still for later use
      }
      return address; // ✅ return it
    } catch (err) {
      console.error("❌ Error loading user info:", err.message);
      return null;
    }
  };

  const handleBackButtonClick = () => {
    return true;
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
  function truncateToFixed(num, digits) {
    const factor = Math.pow(10, digits);
    return Math.floor(Number(num) * factor) / factor;
  }
  const onPressCopy = async (address) => {
    await Clipboard.setString(address);
    toast.current?.show("Copied");
  };

  return (
    <ImageBackground
      source={ThemeManager.ImageIcons.mainBgImgNew}
      style={{ flex: 1, backgroundColor: ThemeManager.colors.mainBgNew }}
    >
      <View style={[styles.mainView]}>
        <HeaderMain
          BackButtonText={vpn.accountDetails}
          customStyle={{ paddingHorizontal: widthDimen(24) }}
        />
        {/* **********************************Card View*************************************** */}

        <View style={[styles.mainView_2]}>
          <ConnectedStatusCard
            src={images.vpn_logo}
            title1={vpn.yourCredits}
            title2={balance ? `${truncateToFixed(balance, 2).toFixed(2)} TICS` : "0.00 TICS"}
            // rightText={vpn.refresh}
            connectedText={styles.connectedText}
            isDot
            refreshClicked={() => {
              initScreen();
            }}
          />
          {/* **********************************text View*************************************** */}

          <View style={[styles.container]}>
            <View style={styles.header}>
              <Text
                style={[
                  styles.title,
                  { color: ThemeManager.colors.headersTextColor },
                ]}
              >
                {vpn.accountAddress}
              </Text>
              <Text
                ellipsizeMode="middle"
                numberOfLines={1}
                style={[
                  styles.viewAll,
                  { color: ThemeManager.colors.legalGreyColor, width: "50%" },
                ]}
              >
                {userAddress}
              </Text>
            </View>
          </View>
          {/* **********************************Button View*************************************** */}
          <View style={styles.bottomView}>
            <Button
              buttontext={vpn.copyAddress}
              onPress={
                () => {
                  onPressCopy(userAddress);
                }
                // Actions.currentScene != "VpnNodeAccess" &&
                // Actions.VpnNodeAccess()
              }
            />
          </View>
        </View>
        <DvpnLoader isLoading={loading} />
      </View>
      <Toast
        ref={toast}
        position="bottom"
        positionValue={250}
        style={{ backgroundColor: ThemeManager.colors.toastBg }}
      />
    </ImageBackground>
  );
};

export default connect(undefined, {})(VpnAccountDetails);
