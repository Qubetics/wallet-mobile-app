import React from 'react';
import { Alert, Platform, StyleSheet, Text, View } from 'react-native';
import { LanguageManager } from '../../../../LanguageManager';
import { ThemeManager } from '../../../../ThemeManager';
import { dimen, heightDimen, widthDimen } from '../../../Utils';
import { Fonts } from '../../../theme';
import QuickConnect from '../../common/QuickConnect';
import RecentSessions from '../../common/RecentSessions';
import { Actions } from 'react-native-router-flux';
import {
  getData,
  getEncryptedData,
  removeStorageItem,
  saveData,
} from '../../../Utils/MethodsUtils';
import { stopVpnSessionOnChain } from '../../Api/VPN/api/stopVpnSessionOnChain';
import * as Constants from '../../../Constants';
import { startVpnSessionOnChain } from '../../Api/VPN/api/startVpnSessionOnChain';
import { startSubscriptionOnChain } from '../../Api/VPN/api/startSubscriptionOnChain';
import {
  connectVpn,
  createOrUpdateVPN,
  disconnectVpn,
  getRuntimeStats,
  startVPN,
  stopVPN,
} from '../../../components/common/WireGuardNative';
import RecentProviders from '../../../../assets/RecentProviders';
import { getAllProviders } from '../../Api/VPN/api/getAllProviders';

const DisconnectContainer = ({
  countries,
  sessions,
  balance,
  isConnected,
  onPress,
  stopLoader,
  startLoader,
  subscriptions,
  defaultWallet,
  providers = []
}) => {
  const connectToVpn = async quickConnectNode => {
    let parsedBalance = parseFloat(balance);
    if (parsedBalance <= 0) {
      Alert.alert('Please top-up your account');
      return;
    }
    if (!quickConnectNode) {
      Alert.alert('Please top up you account');
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
        Platform.OS === 'android' ? await disconnectVpn() : await stopVPN();
        // await stopVPN();
        onPress(false);
        stopLoader();
      } else {
        startLoader();
        let subscriptionId;
        let connectedSessionId;
        let vpnConfig;
        if (subscriptions.length > 0) {
          subscriptionId = parseInt(subscriptions[0].id);
          console.log('<<<---subscriptionId->>', subscriptionId);

          console.log('🟢 Reusing existing subscription:', subscriptionId);
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
            Math.random() * quickConnectNode.plans.length,
          );
          const randomPlanId = parseInt(
            quickConnectNode.plans[randomIndex].planId,
            10,
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
        console.log('dynamicConfig---->>>', vpnConfig);
        if (vpnConfig) {
          Platform.OS === 'android'
            ? await connectVpn(vpnConfig)
            : await createOrUpdateVPN(vpnConfig);
          saveData(Constants.CONNECTED_VPN_SESSION_ID, connectedSessionId);
          Platform.OS === 'ios' && (await startVPN());
          setTimeout(async () => {
            // const stats = await getRuntimeStats();
            // console.log("stats---->>>", stats);
            // if (stats?.status === "connected") {
            // }
            onPress(true);
            stopLoader();
          }, 2000);
        } else {
          stopLoader();
          Platform.OS === 'android' ? await disconnectVpn() : await stopVPN();
          Alert.alert('Failed to connect VPN');
          // console.log('Failed to connect ---->>>', response);
        }
      }
    } catch (e) {
      stopLoader();
      console.error('VPN toggle error2', e);
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
  // console.log("providers---->>>", providers);

  return (
    <>
      {/* <QuickConnect countries={countries} /> */}
      <RecentProviders
        providers={providers}
        onPressViewAll={() => {
          Actions.currentScene != 'ServiceProvider' &&
            Actions.ServiceProvider()
        }}
        onPressProvider={(item) => {
          // console.log("RecentProviders onPressProvider>>", item);
          Actions.currentScene != 'SeverByProvider' &&
            Actions.SeverByProvider({ selectedProvider: item })
        }}
      />
      <View style={styles.subHeaderView}>
        <Text
          style={[
            styles.leftText,
            { color: ThemeManager.colors.headersTextColor },
          ]}>
          {LanguageManager.vpn.recentSessions}
        </Text>
        <Text
          onPress={() =>
            Actions.currentScene != 'RecentSessionScreen' &&
            Actions.RecentSessionScreen()
          }
          style={[
            styles.rightText,
            { color: ThemeManager.colors.legalGreyColor },
          ]}>
          {LanguageManager.vpn.viewAll}
        </Text>
      </View>
      {sessions?.length > 0 ? (
        <RecentSessions
          sessions={sessions}
          handleEndReached={() => { }}
          onReconnectPress={item => {
            var quickConnectNode = item;
            connectToVpn(quickConnectNode);
          }}
        />
      ) : (
        <View style={{ flex: 1, marginTop: 30, justifyContent: 'center' }}>
          <Text
            allowFontScaling={false}
            style={[
              {
                color: ThemeManager.colors.blackWhiteText,
                fontFamily: Fonts.dmMedium,
                fontSize: 15,
                paddingHorizontal: 8,
                alignSelf: 'center',
              },
            ]}>
            {'No session found'}
          </Text>
        </View>
      )}
    </>
  );
};

export default DisconnectContainer;

const styles = StyleSheet.create({
  subHeaderView: {
    flexDirection: 'row',
    justifyContent: 'space-between',
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
