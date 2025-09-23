import React, {useState} from 'react';
import {
  Alert,
  Image,
  ImageBackground,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {ThemeManager} from '../../../ThemeManager';
import {dimen, heightDimen, widthDimen} from '../../Utils';
import {Fonts, Images} from '../../theme';
import {
  startVPN,
  stopVPN,
  getRuntimeStats,
  createOrUpdateVPN,
  connectVpn,
  disconnectVpn,
  checkVpnStatus,
} from './WireGuardNative';
import {startSubscriptionOnChain} from '../Api/VPN/api/startSubscriptionOnChain';
import {stopVpnSessionOnChain} from '../Api/VPN/api/stopVpnSessionOnChain';
import {Actions} from 'react-native-router-flux';
import {
  getData,
  getEncryptedData,
  removeStorageItem,
  saveData,
} from '../../Utils/MethodsUtils';
import {startVpnSessionOnChain} from '../Api/VPN/api/startVpnSessionOnChain';
import * as Constants from '../../Constants';
import {AppAlert} from './AppAlert';
import {connected} from 'process';

const VpnGlobeComp = ({
  text,
  defaultWallet,
  src,
  onPress,
  isConnected,
  quickConnectNode,
  startLoader,
  stopLoader,
  balance,
  subscriptions,
  remaining,
  buyaPlan
}) => {
  const [alertModal, setAlertModal] = useState(false);
  const [alertText, setAlertText] = useState('');

  const connectToVpn = async () => {
    try {
      // ✅ Pre-checks only if NOT connected
      if (!isConnected) {
        if (!subscriptions?.length) {
          return showAlert('Please purchase an available plan.');
        }

        if (parseFloat(balance) <= 0) {
          return showAlert('Please top-up your account.');
        }
      }

      const mnemonics = await getMnemonics();

      if (isConnected) {
        await handleDisconnect(mnemonics);
      } else {
        await handleConnect(mnemonics);
      }
    } catch (e) {
      console.error('VPN connection error:', e);
      stopLoader();
      showAlert('Failed to connect VPN');
    }
  };

  /** 🔹 Disconnect Flow */
  const handleDisconnect = async mnemonics => {
    const sessionId = await getData(Constants.CONNECTED_VPN_SESSION_ID);

    await stopVpnSessionOnChain({
      mnemonic: mnemonics?.toLowerCase()?.trim(),
      rpc: Constants.COSMO_RPC_URL,
      id: sessionId,
    });

    await removeStorageItem(Constants.CONNECTED_VPN_SESSION_ID);

    Platform.OS === 'android' ? await disconnectVpn() : await stopVPN();

    stopLoader();
    setTimeout(() => onPress(false), 500);
  };

  /** 🔹 Connect Flow */
  const handleConnect = async mnemonics => {
    startLoader();

    const subscriptionId = parseInt(subscriptions[0]?.id, 10);
    const {config: vpnConfig, sessionId} = await startVpnSessionOnChain({
      mnemonic: mnemonics?.toLowerCase()?.trim(),
      url: quickConnectNode?.remote_url,
      rpc: Constants.COSMO_RPC_URL,
      id: subscriptionId,
      node_address: quickConnectNode?.address,
    });

    if (!vpnConfig) {
      stopLoader();
      return showAlert('Failed to connect VPN');
    }

    if (Platform.OS === 'android') {
      await connectVpn(vpnConfig);
    } else {
      await createOrUpdateVPN(vpnConfig);
      await startVPN();
    }

    saveData(Constants.CONNECTED_VPN_SESSION_ID, sessionId);

    setTimeout(() => {
      onPress(true);
      stopLoader();
    }, 2000);
  };

  /** 🔹 Reusable helper */
  const showAlert = message => {
    setAlertText(message);
    setAlertModal(true);
  };

  const getMnemonics = async () => {
    return new Promise((resolve, reject) => {
      Actions.EnterPinSecurity({
        from: 'Security',
        fromScreen: 'Security',
        walletPin: async pin => {
          startLoader();
          try {
            const mnemonics = await getEncryptedData(
              defaultWallet.loginRequest.wallet_address,
              pin,
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
    <View>
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'center',
          alignContent: 'center',
          paddingHorizontal: widthDimen(15),
        }}>
        <View style={{position: 'absolute'}} />
        <Text
          style={[
            styles.statusText,
            {
              color: isConnected
                ? ThemeManager.colors.darkGreen
                : ThemeManager.colors.bloodRed,
            },
          ]}>
          {text}
        </Text>
        {remaining && (
          <TouchableOpacity
          onPress={() =>{
            if(remaining == 'Buy a plan'){
                buyaPlan()
            }
          }}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              position: 'absolute',
              right: 20,
            }}>
            <Image source={Images.icon_wallet_validity} />
            <Text style={{color: 'white'}}>
              {remaining}
              <Text style={{color: '#98969B'}}>
                {' '}
                {remaining == 'Buy a plan'
                  ? ''
                  : remaining == '1'
                  ? 'Day Left!'
                  : 'Days Left!'}
              </Text>
            </Text>
          </TouchableOpacity>
        )}
      </View>

      <ImageBackground
        source={ThemeManager.ImageIcons.globe_img}
        style={styles.background}
        resizeMode="contain">
        <TouchableOpacity
          style={styles.powerButton}
          onPress={async () => {
            connectToVpn();
          }}
          activeOpacity={0.8}>
          <Image source={src} style={styles.circleImage} />
        </TouchableOpacity>
        {!isConnected && (
          <Text
            style={{
              marginTop: 12,
              color: 'white',
              fontSize: 18,
              fontFamily: Fonts.dmMedium,
            }}>
            Quick Connect
          </Text>
        )}
      </ImageBackground>
      {/* <View style={{ backgroundColor: "#101010", height: 55 }}>
        <View>

        </View>
        <View style={{ justifyContent: "space-between", flexDirection: "row" }}>
          <Text
            style={{
              fontFamily: Fonts.dmSemiBold,
              fontSize: 14,
              color: "#FFFFFF",
            }}
          >
            100 Credit
          </Text>
          <Text
            style={{
              fontFamily: Fonts.dmRegular,
              fontSize: 14,
              color: "#98969B",
            }}
          >
            35 Credit Left!
          </Text>
        </View>
      </View> */}
      {alertModal && (
        <AppAlert
          alertTxt={alertText}
          hideAlertDialog={() => {
            setAlertModal(false);
            if (alertText == 'Please purchase an available plan.') {
              Actions.BuyCredit({
                defaultWallet: defaultWallet,
                userSubscription: subscriptions,
              });
            }
          }}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  background: {
    alignItems: 'center',
    width: '100%',
    height: dimen(213),
    marginTop: heightDimen(30),
  },
  statusContainer: {
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 30,
    // paddingVertical: heightDimen(10),
    // paddingHorizontal: widthDimen(15),
    position: 'absolute',
    top: 0,
    zIndex: 1,
  },
  statusText: {
    fontSize: dimen(15),
    fontFamily: Fonts.dmSemiBold,
  },
  powerButton: {
    alignItems: 'center',
    marginTop: heightDimen(36),
  },
  circleImage: {
    height: dimen(118),
    width: dimen(118),
    resizeMode: 'contain',
  },
});

export {VpnGlobeComp};
