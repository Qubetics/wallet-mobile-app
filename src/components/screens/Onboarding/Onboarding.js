import React, { useEffect, useRef, useState } from "react";
import {
  View,
  TouchableOpacity,
  Text,
  Image,
  ImageBackground,
  Alert,
  NativeEventEmitter,
  NativeModules,
} from "react-native";
import styles from "./OnboardingStyles";
import { ThemeManager } from "../../../../ThemeManager";
import { LanguageManager } from "../../../../LanguageManager";
import { Button, GradientText } from "../../common";
import { Actions } from "react-native-router-flux";
import images from "../../../theme/Images";
import { heightDimen } from "../../../Utils";
import Lottie from 'lottie-react-native';
import { Images } from "../../../theme";
import { ethers } from "ethers";
import { consoleLogFunc } from "../../../Utils/MethodsUtils";
import { generateCosmosWallet } from "../../../Utils/cosmos";

const { WireGuardVPN } = NativeModules;

const wireGuardConfig = `
[Interface]
PrivateKey = REDACTED
Address = 10.0.0.12/24
DNS = 1.1.1.1,8.8.8.8
MTU = 1420

[Peer]
PublicKey = jl1izrFK+fEAX1HHWCT+54+8NnYFxJAyOszQrK2nCUo=
AllowedIPs = 0.0.0.0/0
Endpoint = 110.238.104.33:51820
PersistentKeepalive = 25
`.trim();

const Onboarding = (props) => {
  const lottieRef = useRef()
  const [vpnStatus, setVpnStatus] = useState('Disconnected');

  useEffect(() => {
    const focusListener = props.navigation.addListener("didFocus", () => {
      lottieRef.current?.play()
    });
    const blurListener = props.navigation.addListener("didBlur", () => {
      lottieRef.current?.pause()
    });

    return () => {
      focusListener.remove();
      blurListener.remove();
    }
  }, []);
// Setup event listener for VPN status
useEffect(() => {
  const eventEmitter = new NativeEventEmitter(WireGuardVPN);
  const subscription = eventEmitter.addListener('VpnStatus', (event) => {
    setVpnStatus(event.status);
  });

  // Check initial VPN status
  WireGuardVPN.getVpnStatus()
    .then((status) => setVpnStatus(status))
    .catch((error) => console.error('Error fetching VPN status:', error));

  return () => subscription.remove();
}, []);


// Handle VPN connection
const connectVpn = async () => {
  try {
    // Check if VPN permission is needed
    const needsPermission = await WireGuardVPN.prepareVpn();
    if (needsPermission) {
      // Start activity to request VPN permission
      Alert.alert(
        'VPN Permission Required',
        'Please grant VPN permission to proceed.',
        [
          {
            text: 'OK',
            onPress: async () => {
             
              await WireGuardVPN.connectVpn(wireGuardConfig);
             
            },
          },
        ]
      );
    } else {
      await WireGuardVPN.connectVpn(wireGuardConfig);
    }
  } catch (error) {
    console.error('VPN connection error:', error);
  }
};

// Handle VPN disconnection
const disconnectVpn = async () => {
  try {
    // await WireGuardVPN.getVpnConfig()
    await WireGuardVPN.disconnectVpn();
  } catch (error) {
    console.error('VPN disconnection error:', error);
  }
};
  const getTotalGasFee = async () => {
    try {
      const testnetUrlEth = "https://chain.instanodes.io/eth-mainnet/?apikey=REDACTED";
      consoleLogFunc("testnetUrlEth", testnetUrlEth);
      // const provider = new ethers.providers.JsonRpcProvider(testnetUrlEth);
      const provider = getDappProvider(testnetUrlEth);

      const network = await provider.getNetwork(); // Check if it connects
      consoleLogFunc("Connected to network:", network);

      const gasPrice = await provider.getGasPrice();
      consoleLogFunc("Gas Price:", gasPrice.toString());
    } catch (error) {
      console.error("Error fetching network or gas price:", error);
    }
  };

  return (

    <ImageBackground
      source={ThemeManager.ImageIcons.mainBgImgNew}
      style={{ flex: 1 }}
    >
      <View style={{ alignItems: "center", justifyContent: "center", flex: 1, }}>
        <Lottie
          ref={lottieRef}
          style={{ height: 280, }}
          source={Images.welcomeAnimation}
          autoPlay
        />

        <View style={{ paddingHorizontal: 40 }}>
          <Text
            style={[
              styles.headerText,
              { color: ThemeManager.colors.blackWhiteText },
            ]}
          >{LanguageManager.onboarding.welcome}</Text>
          <Text style={[styles.boldText, { color: ThemeManager.colors.legalGreyColor }]}>{LanguageManager.onboarding.nonCustodial}</Text>
        </View>


      </View>

      <View style={{ ...styles.btnView }}>
        <TouchableOpacity
          style={{ paddingVertical: 10, alignSelf: "center" }}
          onPress={() => {
            Actions.currentScene != "Legal" &&
              Actions.Legal({ from: "ImportWallet" });
          }}
        >

          <Image resizeMode="contain" source={images.alreadyWalletText} />

        </TouchableOpacity>
        <Button
          myStyle={{
            marginBottom: heightDimen(20),
            marginTop: heightDimen(10),
          }}
          onPress={() => {
            vpnStatus === 'Connected' ? disconnectVpn() : connectVpn()
            // Actions.currentScene != "Legal" &&
            //   Actions.Legal({ from: "createwallet" });
          }}

          buttontext={LanguageManager.onboarding.createWallet}
        />

      </View>

    </ImageBackground>
  );
};

export default Onboarding;
