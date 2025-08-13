import React, { useEffect, useState } from "react";
import {
  Alert,
  BackHandler,
  Dimensions,
  FlatList,
  ImageBackground,
  Platform,
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
import { widthDimen } from "../../../Utils";
import { HeaderMain, InputtextSearch, LoaderView } from "../../common";
import LocationInfoCard from "../../common/LocationInfoCard";
import styles from "./SelectServersStyle";
import VpnGradientCard from "../../common/VpnGradientCard";
import { getVpnNodes } from "../../Api/VPN/api/getVpnNodes";
import {
  checkAndGetVpnStatus,
  connectVpn,
  createOrUpdateVPN,
  disconnectVpn,
  getEndpointFromConfig,
  getRunningVpnConfig,
  getRuntimeStats,
  startVPN,
  stopVPN,
} from "../../common/WireGuardNative";
import {
  getBalance,
  startSubscriptionOnChain,
} from "../../Api/VPN/api/startSubscriptionOnChain";
import {
  getData,
  getEncryptedData,
  removeStorageItem,
  saveData,
} from "../../../Utils/MethodsUtils";
import { stopVpnSessionOnChain } from "../../Api/VPN/api/stopVpnSessionOnChain";
import { getUserSubscriptions } from "../../Api/VPN/api/getUserSubscriptions";
import { startVpnSessionOnChain } from "../../Api/VPN/api/startVpnSessionOnChain";

const filters1 = ["All", "V2Ray", "Wireguard"];

const SelectServers = (props) => {
  const { data } = props;
  const { vpn } = LanguageManager;
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [isToggle, setIsToggle] = useState(false);
  const [selected1, setSelected1] = useState("All");
  const [selectIndex, setSelectIndex] = useState("");
  const [VpnList, setVpnList] = useState([]);
  const [filteredVpnList, setFilteredVpnList] = useState([]);
  const [defaultWallet, setDefaultWallet] = useState();
  const [balance, setBalance] = useState();
  const [userAddress, setUserAddress] = useState();
  const [isConnected, setIsConnected] = useState(false);
  const [endpoint, setendpoint] = useState(null);

  useEffect(() => {
    getData(Constants.MULTI_WALLET_LIST).then((list) => {
      let currentWallet = JSON.parse(list);
      currentWallet = currentWallet.find((res) => res?.defaultWallet);
      setDefaultWallet(currentWallet);
    });
    initScreen();
    EventRegister.addEventListener("getThemeChanged", (data) => {});
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
    return () => {
      setIsToggle(false);
      focusListener.remove();
      blurListener.remove();
      BackHandler.removeEventListener(
        "hardwareBackPress",
        handleBackButtonClick
      );
    };
  }, []);
  const extractIP = (endpoint) => {
    if (!endpoint) return null;

    // Check for NAT64 IPv6 format like: [64:ff9b::bcef:2152]:51820
    const ipv6Match = endpoint.match(/\[64:ff9b::([0-9a-f]+):([0-9a-f]+)\]/i);
    if (ipv6Match) {
      const part1 = parseInt(ipv6Match[1], 16);
      const part2 = parseInt(ipv6Match[2], 16);
      return `${(part1 >> 8) & 0xff}.${part1 & 0xff}.${(part2 >> 8) & 0xff}.${
        part2 & 0xff
      }`;
    }

    // Regular IPv4 case like: 188.239.33.82:51820
    const ipv4Match = endpoint.match(/^([0-9.]+):/);
    if (ipv4Match) {
      return ipv4Match[1];
    }

    return null;
  };

  const checkVpnStatus = async () => {
    try {
      if(Platform.OS === 'ios'){
        const stats = await getRuntimeStats();
      console.log("VPN Stats:", stats);
      const status = stats?.status;
      const endpoint = stats?.endpoint;
      const actualIP = extractIP(endpoint);
            console.log("actualIP actualIP:", actualIP);
      setendpoint(actualIP);
      setIsConnected(status === "connected");
      }else{
        const status = await checkAndGetVpnStatus()
        const currentVpnConfig = await getRunningVpnConfig()
        const endpoint = getEndpointFromConfig(currentVpnConfig)
        const actualIP = extractIP(endpoint);
        setendpoint(actualIP);
        setIsConnected(status?.toLowerCase() === "connected");
      }
    } catch (e) {
      Platform.OS === 'android' ? await disconnectVpn() : await stopVPN();
      // await stopVPN();
      setendpoint(null);
      console.log("VPN status check failed", e);
      setIsConnected(false);
    }
  };

  const initScreen = async () => {
    setLoading(true);
    try {
      const address = await loadUserInfo();
      console.log("address---->>", address);
      await Promise.all([
        loadBalance(address),
        loadVpnNodes(),
        checkVpnStatus(), // ⬅️ will now have a valid userAddress
      ]);
    } catch (error) {
      console.error("🔴 initScreen error:", error.message);
    } finally {
      setLoading(false);
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
      console.log("✅ Balance fetched:", balance);
      setBalance(balance);
    } catch (e) {
      console.log("❌ VPN status check failed", e);
    }
  };

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
        country: props?.data?.country,
        city: props?.data?.city,
      });

      if (!result.Error) {
        console.log("✅ all VPN Nodes:111", result);
        console.log("✅ VPN Nodes:111", JSON.stringify(result?.data?.nodes));
        setVpnList(result?.data?.nodes);
        setFilteredVpnList(result?.data?.nodes);

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
  const getMnemonics = async () => {
    return new Promise((resolve, reject) => {
      Actions.EnterPinSecurity({
        from: "Security",
        fromScreen: "Security",
        walletPin: async (pin) => {
          setLoading(true);
          try {
            const mnemonics = await getEncryptedData(
              defaultWallet.loginRequest.wallet_address,
              pin
            );
            resolve(mnemonics);
          } catch (error) {
            reject(error);
          }
        },
      });
    });
  };

  const updateSearch = (text) => {
    let list = VpnList.filter(
      (res) =>
        res.id?.toLowerCase().startsWith(text.toLowerCase()) ||
        res.address?.toLowerCase().startsWith(text.toLowerCase())
    );
    setFilteredVpnList(list);
  };

  const connectToVpn = async (item) => {
    let parsedBalance = parseFloat(balance);
    if (parsedBalance <= 0) {
      Alert.alert("Please top-up your account");
      return;
    }
    if (!item) {
      Alert.alert("Please top up you account");
      return;
    }
    const mnemonics = await getMnemonics();
    try {
      if (isConnected) {
        setLoading(true);
        const sessionId = await getData(Constants.CONNECTED_VPN_SESSION_ID);
        await stopVpnSessionOnChain({
          mnemonic: mnemonics?.toLowerCase()?.trim(),
          rpc: Constants.COSMO_RPC_URL,
          id: sessionId,
        });
        await removeStorageItem(Constants.CONNECTED_VPN_SESSION_ID);
        Platform.OS === 'android' ? await disconnectVpn() : await stopVPN();
        // await stopVPN();
        setendpoint(null);
        setTimeout(async () => {
          await checkVpnStatus();
          setLoading(false);
        }, 800);
        setLoading(false);
      } else {
        setLoading(true);
        let subscriptionId;
        let connectedSessionId;
        const subsResponse = await getUserSubscriptions({
          limit: 5,
          order: "DESC",
        });
        console.log("subsResponsesubsResponsesubsResponse->>", subsResponse);
        const sessions = subsResponse?.data?.subscriptions || [];
        console.log("sessionssessionssessions->>", sessions);

        let vpnConfig;
        if (sessions.length > 0) {
          subscriptionId = parseInt(sessions[0].id);
          console.log("<<<---subscriptionId->>", subscriptionId);

          console.log("🟢 Reusing existing subscription:", subscriptionId);
          const { config, sessionId } = await startVpnSessionOnChain({
            mnemonic: mnemonics?.toLowerCase()?.trim(),
            url: item?.remote_url,
            rpc: Constants.COSMO_RPC_URL,
            id: subscriptionId,
            node_address: item?.address,
          });
          vpnConfig = config;
          connectedSessionId = sessionId;
        } else {
          const randomIndex = Math.floor(Math.random() * item.plans.length);
          const randomPlanId = parseInt(item.plans[randomIndex].planId, 10);
          let { config, sessionId } = await startSubscriptionOnChain({
            mnemonic: mnemonics?.toLowerCase()?.trim(),
            url: item?.remote_url,
            rpc: Constants.COSMO_RPC_URL,
            id: randomPlanId,
            node_address: item?.address,
          });
          vpnConfig = config;
          connectedSessionId = sessionId;
        }
        console.log("dynamicConfig---->>>", vpnConfig);
        if (vpnConfig) {
          // await connectVpn(vpnConfig);

         Platform.OS === 'android' ? await connectVpn(vpnConfig) : await createOrUpdateVPN(vpnConfig);
          saveData(Constants.CONNECTED_VPN_SESSION_ID, connectedSessionId);
          Platform.OS === 'ios' && await startVPN();
          setTimeout(async () => {
            // await checkVpnStatus();
            setLoading(false);
          }, 2000);
        } else {
          setLoading(false);
          Alert.alert("Failed to connect VPN");
          console.log("Failed to connect ---->>>", response);
        }
      }
    } catch (e) {
      setLoading(false);
      console.error("VPN toggle error3", e);
    }
  };
  const renderItem = ({ item, index }) => (

    <LocationInfoCard
      location={item.id}
      ip={item.address}
      rightImg={
        selectIndex == index
          ? ThemeManager.ImageIcons.enable_toggle_vpn
          : ThemeManager.ImageIcons.disable_toggle_vpn
      }
      arrowStyle={styles.toggleIcon}
      container={{ marginTop: 8 }}
      isConnectedd={item?.remote_url?.includes(endpoint)}
      onPress={() => {
        setSelectIndex(index);
        connectToVpn(item);
        // Singleton.bottomBar?.navigateTab("WalletMain");
        // setIsToggle(!isToggle);
      }}
    />
  );

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
          <VpnGradientCard
            gradient_View={{ borderRadius: 14 }}
            children={ButtonContent}
          />
        ) : (
          <VpnGradientCard
            isOutLine
            gradient_View={{ borderRadius: 14 }}
            children={ButtonContent}
          />
        )}
      </Pressable>
    );
  };

  return (
    <>
      <ImageBackground
        source={ThemeManager.ImageIcons.mainBgImgNew}
        style={{ flex: 1, backgroundColor: ThemeManager.colors.mainBgNew }}
      >
        <View style={[styles.mainView]}>
          <HeaderMain
            BackButtonText={data?.city}
            customStyle={{ paddingHorizontal: widthDimen(24) }}
          />
          <InputtextSearch
            style={{
              height: 50,
              width: Dimensions.get("screen").width - widthDimen(48),
            }}
            placeholder={vpn.addServers}
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

          <FlatList
            data={filteredVpnList}
            showsVerticalScrollIndicator={false}
            keyExtractor={(item) => item.id}
            renderItem={renderItem}
            contentContainerStyle={styles.listContainer}
            extraData={endpoint}
          />
          <LoaderView isLoading={loading} />
        </View>
      </ImageBackground>
    </>
  );
};

export default connect(undefined, {})(SelectServers);
