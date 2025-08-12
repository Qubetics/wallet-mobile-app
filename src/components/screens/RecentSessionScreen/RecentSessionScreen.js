import React, { useEffect, useState } from "react";
import { Alert, BackHandler, ImageBackground, View } from "react-native";
import { EventRegister } from "react-native-event-listeners";
import { ActionConst, Actions } from "react-native-router-flux";
import { connect } from "react-redux";
import { LanguageManager } from "../../../../LanguageManager";
import { ThemeManager } from "../../../../ThemeManager";
import * as Constants from "../../../Constants";
import Singleton from "../../../Singleton";
import images from "../../../theme/Images";
import { widthDimen } from "../../../Utils";
import { HeaderMain, LoaderView } from "../../common";
import RecentSessions from "../../common/RecentSessions";
import styles from "./RecentSessionScreenStyle";
import { getSessions } from "../../Api/VPN/api/getSessions";
import { stopVpnSessionOnChain } from "../../Api/VPN/api/stopVpnSessionOnChain";
import { startVpnSessionOnChain } from "../../Api/VPN/api/startVpnSessionOnChain";
import { getBalance, startSubscriptionOnChain } from "../../Api/VPN/api/startSubscriptionOnChain";
import {
  createOrUpdateVPN,
  getRuntimeStats,
  startVPN,
  stopVPN,
} from "../../../components/common/WireGuardNative";
import {
  getData,
  getEncryptedData,
  removeStorageItem,
  saveData,
} from "../../../Utils/MethodsUtils";
import { getUserSubscriptions } from "../../Api/VPN/api/getUserSubscriptions";

const RecentSessionScreen = (props) => {
  const { vpn } = LanguageManager;
  const [loading, setLoading] = useState(false);
  const [sessionList, setSessionList] = useState([]);
  const [userAddress, setUserAddress] = useState();
  const [defaultWallet, setDefaultWallet] = useState();
  const [isConnected, setIsConnected] = useState(false);
  const [userSubscription, setUserSubscription] = useState([]);
  const [balance, setBalance] = useState();

  useEffect(() => {
    initScreen();
    EventRegister.addEventListener("getThemeChanged", (data) => {
      // setThemeSelected({ themeSelected: data ? data : 2 });
    });
    BackHandler.addEventListener("hardwareBackPress", handleBackButtonClick);
    const focusListener = props.navigation.addListener("didFocus", () => {
      BackHandler.addEventListener("hardwareBackPress", handleBackButtonClick);
       initScreen();
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

  const handleBackButtonClick = () => {
    Singleton.bottomBar?.navigateTab("WalletMain");
    Actions.Main({ type: ActionConst.RESET });
    return true;
  };

  const initScreen = async () => {
    setLoading(true);
    try {
      const subsResponse = await getUserSubscriptions({
        limit: 5,
        order: "DESC",
      });
      const subscriptions = subsResponse?.data?.subscriptions || [];
      setUserSubscription(subscriptions);

      const address = await loadUserInfo();
      await Promise.all([
        checkVpnStatus(),
        loadBalance(address), // ⬅️ will now have a valid userAddress
        fetchUserSessions(),
      ]);
    } catch (error) {
      console.error("🔴 initScreen error:", error.message);
    } finally {
      setLoading(false);
    }
  };

  const checkVpnStatus = async () => {
    try {
      const stats = await getRuntimeStats();
      console.log("VPN Stats:", stats);
      const status = stats?.status;
      const endpoint = stats?.endpoint;
      const ip = endpoint?.split(":")[0] ?? null;
      setIsConnected(status === "connected");
    } catch (e) {
      await stopVPN();
      console.log("VPN status check failed", e);
      setIsConnected(false);
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

  const loadUserInfo = async () => {
    try {
      const address = await getData(Constants.COSMOS_ADDRESS);
      if (address) {
        setUserAddress(address); // ✅ update state still for later use
      }

      const walletList = await getData(Constants.MULTI_WALLET_LIST);
      const parsed = JSON.parse(walletList)?.find((w) => w?.defaultWallet);
      setDefaultWallet(parsed);

      return address; // ✅ return it
    } catch (err) {
      console.error("❌ Error loading user info:", err.message);
      return null;
    }
  };

  const fetchUserSessions = async () => {
    setLoading(true);
    try {
      const result = await getSessions({
        limit: 100,
        page: 1,
        order: "ASC",
        count_total: true,
      });
      setLoading(false);
      if (!result.Error) {
        console.log("✅ Sessions:>>>>>", result);
        if (result?.data?.total) {
          setSessionList(result?.data?.sessions);
          console.log("Total Sessions:>>>", result?.data?.sessions);
        }
      } else {
        console.warn("⚠️ Failed to fetch sessions:", result?.message);
      }
    } catch (err) {
      setLoading(false);
      console.error("❌ Error:", err?.message);
    }
  };

  const connectToVpn = async (quickConnectNode) => {
    let parsedBalance = parseFloat(balance);
    if (parsedBalance <= 0) {
      Alert.alert("Please top-up your account");
      return;
    }
    if (!quickConnectNode) {
      Alert.alert("Please top up you account");
      return;
    }
    const mnemonics = await getMnemonics();
    try {
      if (isConnected) {
        const sessionId = await getData(Constants.CONNECTED_VPN_SESSION_ID);
        await stopVpnSessionOnChain({
          mnemonic: mnemonics?.toLowerCase()?.trim(),
          rpc: Constants.COSMO_RPC_URL,
          id: sessionId,
        });
        await removeStorageItem(Constants.CONNECTED_VPN_SESSION_ID);
        await stopVPN();
        setLoading(false);
      } else {
        setLoading(true);
        let subscriptionId;
        let connectedSessionId;
        let vpnConfig;
        if (userSubscription.length > 0) {
          subscriptionId = parseInt(userSubscription[0].id);
          console.log("<<<---subscriptionId->>", subscriptionId);

          console.log("🟢 Reusing existing subscription:", subscriptionId);
          const { config, sessionId } = await startVpnSessionOnChain({
            mnemonic: mnemonics?.toLowerCase()?.trim(),
            url: quickConnectNode?.remote_url,
            rpc: Constants.COSMO_RPC_URL,
            id: subscriptionId,
            node_address: quickConnectNode?.address,
          });
          vpnConfig = config;
          connectedSessionId = sessionId;
        } else {
          const randomIndex = Math.floor(
            Math.random() * quickConnectNode.plans.length
          );
          const randomPlanId = parseInt(
            quickConnectNode.plans[randomIndex].planId,
            10
          );
          let { config, sessionId } = await startSubscriptionOnChain({
            mnemonic: mnemonics?.toLowerCase()?.trim(),
            url: quickConnectNode?.remote_url,
            rpc: Constants.COSMO_RPC_URL,
            id: randomPlanId,
            node_address: quickConnectNode?.address,
          });
          vpnConfig = config;
          connectedSessionId = sessionId;
        }
        console.log("dynamicConfig---->>>", vpnConfig);
        if (vpnConfig) {
          await createOrUpdateVPN(vpnConfig);
          saveData(Constants.CONNECTED_VPN_SESSION_ID, connectedSessionId);
          await startVPN();
          setTimeout(async () => {
            const stats = await getRuntimeStats();
            console.log("stats---->>>", stats);
            if (stats?.status === "connected") {
            }
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
      console.error("VPN toggle error4", e);
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

  return (
    <ImageBackground
      source={ThemeManager.ImageIcons.mainBgImgNew}
      style={{ flex: 1, backgroundColor: ThemeManager.colors.mainBgNew }}
    >
      <View style={[styles.mainView]}>
        <HeaderMain
          BackButtonText={vpn.recentSessions}
          customStyle={{ paddingHorizontal: widthDimen(24) }}
          showBackBtn={true}
        />
        <RecentSessions
          sessions={sessionList}
          onReconnectPress={(item) => {
            console.log('12313123',isConnected)
            if(isConnected){
              Alert.alert('Please disconnect active session')
              return
            }
            var quickConnectNode = item;
            connectToVpn(quickConnectNode);
          }}
        />
        <LoaderView isLoading={loading} />
      </View>
    </ImageBackground>
  );
};

export default connect(undefined, {})(RecentSessionScreen);
