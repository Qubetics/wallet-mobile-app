import React, {useState} from 'react';
import {
  Alert,
  Image,
  ImageBackground,
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
import {getUserSubscriptions} from '../Api/VPN/api/getUserSubscriptions';
import {startVpnSessionOnChain} from '../Api/VPN/api/startVpnSessionOnChain';
import * as Constants from '../../Constants';

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
}) => {
  const connectToVpn = async () => {
    let parsedBalance = parseFloat(balance);
    if (parsedBalance <= 0) {
      Alert.alert('Please top-up your account');
      return;
    }
    if (!quickConnectNode) {
      Alert.alert('VPN plan not available.');
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
        stopLoader();
        setTimeout(() => {
          onPress(false);
        }, 500);
      } else {
        startLoader();
        let subscriptionId;
        let connectedSessionId;
        let vpnConfig;
        if (subscriptions.length > 0) {
          subscriptionId = parseInt(subscriptions[0].id);
          console.log('<<<---subscriptionId->>', subscriptionId);

          console.log('🟢 Reusing existing subscription:', subscriptionId);
          const {config, sessionId} = await startVpnSessionOnChain({
            mnemonic: mnemonics?.toLowerCase()?.trim(),
            url: quickConnectNode?.remote_url,
            rpc: Constants.COSMO_RPC_URL,
            id: subscriptionId,
            node_address: quickConnectNode?.address,
          });
          console.log('<<<---config->>', config);

          vpnConfig = config;
          connectedSessionId = sessionId;
        } else {
          const randomIndex = Math.floor(
            Math.random() * quickConnectNode.plans.length,
          );
          const randomPlanId = parseInt(
            quickConnectNode.plans[randomIndex].planId,
            10,
          );
          let {config, sessionId} = await startSubscriptionOnChain({
            mnemonic: mnemonics?.toLowerCase()?.trim(),
            url: quickConnectNode?.remote_url,
            rpc: Constants.COSMO_RPC_URL,
            id: randomPlanId,
            node_address: quickConnectNode?.address,
          });
          vpnConfig = config;
          connectedSessionId = sessionId;
        }
        console.log('dynamicConfig---->>>', vpnConfig);
        if (vpnConfig) {
          await createOrUpdateVPN(vpnConfig);
          console.log('connectedSessionId---->>>', connectedSessionId);
          saveData(Constants.CONNECTED_VPN_SESSION_ID, connectedSessionId);
          await startVPN();
          setTimeout(async () => {
            const stats = await getRuntimeStats();
            console.log('stats---->>>', stats);
            if (stats?.status === 'connected') {
            }
            onPress(true);
            stopLoader();
          }, 2000);
        } else {
          stopLoader();
          Alert.alert('Failed to connect VPN');
          console.log('Failed to connect ---->>>', response);
        }
      }
    } catch (e) {
      stopLoader();
      Alert.alert('Failed to connect VPN');
      console.error('VPN toggle error55', e);
    }
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
          <View
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
                {remaining == '1' ? 'Day Left' : 'Days Left!'}
              </Text>
            </Text>
          </View>
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
