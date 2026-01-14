import React, { useEffect, useState } from 'react';
import { Alert, Platform, StyleSheet, Text, View } from 'react-native';
import { LanguageManager } from '../../../../LanguageManager';
import { ThemeManager } from '../../../../ThemeManager';
import { dimen, heightDimen, widthDimen } from '../../../Utils';
import { Fonts } from '../../../theme';
import QuickConnect from '../../common/QuickConnect';
import RecentSessions from '../../common/RecentSessions';
import { Actions } from 'react-native-router-flux';
import {
  consoleLogFunc,
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
import { EventRegister } from 'react-native-event-listeners';

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
  const [lastPlanId, setLastPlanId] = useState(0);
  useEffect(async () => {
    const lastPlanId = await getData(Constants.LAST_PLAN_ID_USED);
    if (lastPlanId != null) {
      setLastPlanId(lastPlanId);
    }
  }, [])
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
          subscriptionId = parseInt(quickConnectNode.subscription_id);
          consoleLogFunc('<<<---subscriptionId->>', subscriptionId);
          consoleLogFunc('<<<---quickConnectNode->>', quickConnectNode);

          consoleLogFunc('🟢 Reusing existing subscription:', subscriptionId);
          const { config, sessionId } = await startVpnSessionOnChain({
            mnemonic: mnemonics?.toLowerCase()?.trim(),
            url: quickConnectNode?.["nodes.remote_url"],
            rpc: Constants.COSMO_RPC_URL,
            id: subscriptionId,
            node_address: quickConnectNode?.["nodes.address"],
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
        consoleLogFunc('dynamicConfig---->>>', vpnConfig);
        if (vpnConfig) {
          Platform.OS === 'android'
            ? await connectVpn(vpnConfig)
            : await createOrUpdateVPN(vpnConfig);
          saveData(Constants.CONNECTED_VPN_SESSION_ID, connectedSessionId);
          saveData(Constants.LAST_PLAN_ID_USED, quickConnectNode?.plan_id);
          Platform.OS === 'ios' && (await startVPN());
          setTimeout(async () => {
            // const stats = await getRuntimeStats();
            // consoleLogFunc("stats---->>>", stats);
            // if (stats?.status === "connected") {
            // }
            onPress(true);
            stopLoader();
          }, 8000);
        } else {
          stopLoader();
          Platform.OS === 'android' ? await disconnectVpn() : await stopVPN();
          Alert.alert('Failed to connect VPN');
          // consoleLogFunc('Failed to connect ---->>>', response);
        }
      }
    } catch (e) {
      stopLoader();
      console.error('VPN toggle error2', e);
    }
  };

  const getMnemonics = async () => {
    return new Promise((resolve, reject) => {
      Actions.currentScene != 'EnterPinSecurity' && Actions.EnterPinSecurity({
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
  // consoleLogFunc("providers---->>>", providers);

  return (
    <>
      {/* <QuickConnect countries={countries} /> */}
      <RecentProviders
        providers={providers}
        onPressViewAll={() => {
          Actions.currentScene != 'ServiceProvider' &&
            Actions.ServiceProvider({ isFrom: "VPN_SCREEN" })
        }}
        onPressProvider={(item) => {
          // consoleLogFunc("RecentProviders onPressProvider>>", item);
          Actions.currentScene != 'SeverByProvider' &&
            Actions.SeverByProvider({ selectedProvider: item })
        }}
        lastPlanId={lastPlanId}
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
          onPress={() => {
            EventRegister.emit("isHistoryClicked")
            Actions.currentScene != 'RecentSessionScreen' &&
              Actions.RecentSessionScreen()
          }}
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
