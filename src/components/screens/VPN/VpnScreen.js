import React, { useEffect, useState } from 'react';
import {
  Alert,
  BackHandler,
  ImageBackground,
  NativeEventEmitter,
  NativeModules,
  Platform,
  ScrollView,
  View,
} from 'react-native';
import { EventRegister } from 'react-native-event-listeners';
import { ActionConst, Actions } from 'react-native-router-flux';
import { connect } from 'react-redux';
import { LanguageManager } from '../../../../LanguageManager';
import { ThemeManager } from '../../../../ThemeManager';
import * as Constants from '../../../Constants';
import Singleton from '../../../Singleton';
import images from '../../../theme/Images';
import { widthDimen } from '../../../Utils';
import { HeaderMain, LoaderView, VpnGlobeComp } from '../../common';
import ConnectContainer from './ConnectContainer';
import DisconnectContainer from './DisconnectContainer';
import styles from './VpnScreenStyle';
import { checkAndGetVpnStatus, disconnectVpn, getEndpointFromConfig, getRunningVpnConfig, getRuntimeStats, stopVPN } from '../../common/WireGuardNative';
import { getSessions } from '../../Api/VPN/api/getSessions';
import { getBalance } from '../../Api/VPN/api/startSubscriptionOnChain';
import { getVpnNodes } from '../../Api/VPN/api/getVpnNodes';
import { fetchAndSaveWGKeyPair } from '../../Api/VPN/api/fetchAndSaveWGKeyPair';
import { getData } from '../../../Utils/MethodsUtils';
import { getRandomNode } from '../../Api/VPN/api/getRandomNode';
import { getUserSubscriptions } from '../../Api/VPN/api/getUserSubscriptions';
const { WireGuardVPNModule } = NativeModules;

const VpnScreen = props => {
  const { vpn } = LanguageManager;
  const [loading, setLoading] = useState(false);
  const [countryList, setCountryList] = useState([]);
  const [sessionList, setSessionList] = useState([]);
  const [vpnIP, setVpnIP] = useState('IP: N/A');
  const [vpnLocation, setVpnLocation] = useState('Unknown');
  const [isConnected, setIsConnected] = useState(false);
  const [defaultWallet, setDefaultWallet] = useState();
  const [quickConnectNode, setQuickConnectNode] = useState();
  const [userAddress, setUserAddress] = useState();
  const [balance, setBalance] = useState();
  const [userSubscription, setUserSubscription] = useState([]);
  const [vpnStatus, setVpnStatus] = useState('disconnected');
  const [remaining, setremaining] = useState('');

  useEffect(() => {
    initScreen();

    const focusListener = props.navigation.addListener('didFocus', () => {
      updateBalance();
    });
    const blurListener = props.navigation.addListener('didBlur', () =>
      BackHandler.removeEventListener(
        'hardwareBackPress',
        handleBackButtonClick,
      ),
    );

    EventRegister.addEventListener(Constants.DOWN_MODAL, () => { });
    BackHandler.addEventListener('hardwareBackPress', handleBackButtonClick);

    return () => {
      focusListener.remove();
      blurListener.remove();
      BackHandler.removeEventListener(
        'hardwareBackPress',
        handleBackButtonClick,
      );
    };
  }, []);

  const updateBalance = async () => {
    await loadVpnNodes();
    await loadUserSessions();
    const address = await loadUserInfo();
    loadBalance(address);
    await checkVpnStatus();
  };
  const formatDate = isoDate => {
    return new Date(isoDate).toLocaleString(); // or toLocaleDateString()
  };

  const getDaysLeftText = inactive_at => {
    if (!inactive_at) return 'No expiry date';

    const now = new Date();
    const inactiveDate = new Date(inactive_at);
    const diffMs = inactiveDate.getTime() - now.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return 'Expired';
    if (diffDays === 0) return 'Expires today';
    if (diffDays === 1) return '1';

    return `${diffDays}`;
  };

  const initScreen = async () => {
    setLoading(true);
    try {
      const subsResponse = await getUserSubscriptions({
        limit: 5,
        order: 'DESC',
      });
      console.log('subsResponsesubsResponsesubsResponse->>', subsResponse);
      const subscriptions = subsResponse?.data?.subscriptions || [];
      if (subscriptions.length > 0) {
        const subscribedTo = subscriptions[0];
        if (subscriptions.length > 0) {
          const subscribedTo = subscriptions[0];
          setremaining(getDaysLeftText(subscribedTo?.inactive_at));
        }
      }
      setUserSubscription(subscriptions);

      const address = await loadUserInfo();
      console.log('address---->>', address);
      await Promise.all([
        checkVpnStatus(),
        loadQuickConnectNode(),
        loadBalance(address), // ⬅️ will now have a valid userAddress
        loadVpnNodes(),
        loadUserSessions(),
      ]);
    } catch (error) {
      console.error('🔴 initScreen error:', error.message);
    } finally {
      setLoading(false);
    }
  };

  const loadUserInfo = async () => {
    try {
      const address = await getData(Constants.COSMOS_ADDRESS);
      console.log('✅ address----->>>', address);

      if (address) {
        setUserAddress(address); // ✅ update state still for later use
      }

      const walletList = await getData(Constants.MULTI_WALLET_LIST);
      const parsed = JSON.parse(walletList)?.find(w => w?.defaultWallet);
      setDefaultWallet(parsed);

      return address; // ✅ return it
    } catch (err) {
      console.error('❌ Error loading user info:', err.message);
      return null;
    }
  };

  const loadQuickConnectNode = async () => {
    try {
      const node = await getRandomNode();
      console.log('Random Node:', JSON.stringify(node));
      setQuickConnectNode(node?.data);
    } catch (err) {
      console.error('Failed to get random node:', err);
    }
  };

  const loadBalance = async addressParam => {
    const address = addressParam || userAddress;
    console.log('✅ Fetching balance for:', address);
    if (!address) {
      console.warn('🚫 Cannot load balance: address is undefined');
      return;
    }

    try {
      // const response = await fetchAndSaveWGKeyPair();

      let balance = await getBalance({
        denom: 'tics',
        address: address,
        rcp: Constants.COSMO_RPC_URL,
      });
      console.log('✅ Balance fetched:', balance);
      setBalance(balance);
    } catch (e) {
      console.log('❌ VPN status check failed', e);
    }
  };

  const loadVpnNodes = async () => {
    try {
      const result = await getVpnNodes({
        limit: 10,
        page: 1,
        order: 'DES',
        count_total: true,
        reverse: false,
      });
      if (!result.Error) {
        console.log('✅ all VPN Nodes:', result);
        console.log('✅ VPN Nodes:', result?.data?.countries);
        setCountryList(result?.data?.countries);

        if (result?.total) {
          console.log('Total Nodes:', result?.data?.total);
        }
      } else {
        console.warn('⚠️ Failed to fetch nodes:', result.Message);
      }
    } catch (err) {
      console.error('❌ Error fetching nodes:', err.message);
    }
  };

  const loadUserSessions = async () => {
    try {
      const result = await getSessions({
        limit: 4,
        page: 1,
        order: 'DES',
        count_total: true,
      });

      if (!result.Error) {
        console.log('✅ Sessions:>>>>>', result);
        if (result?.data?.total) {
          setSessionList(result?.data?.sessions);
          console.log(
            '✅ result?.data?.sessions:>>>>>',
            result?.data?.sessions,
          );
          console.log('Total Sessions:>>>', result?.data?.total);
        }
      } else {
        console.warn('⚠️ Failed to fetch sessions:', result?.message);
      }
    } catch (err) {
      console.error('❌ Error:', err?.message);
    }
  };
  const extractIP = endpoint => {
    if (!endpoint) return null;

    // Check for NAT64 IPv6 format like: [64:ff9b::bcef:2152]:51820
    const ipv6Match = endpoint.match(/\[64:ff9b::([0-9a-f]+):([0-9a-f]+)\]/i);
    if (ipv6Match) {
      const part1 = parseInt(ipv6Match[1], 16);
      const part2 = parseInt(ipv6Match[2], 16);
      return `${(part1 >> 8) & 0xff}.${part1 & 0xff}.${(part2 >> 8) & 0xff}.${part2 & 0xff
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
      // const stats = await getRuntimeStats();
      // console.log('VPN Stats:', stats);
      // const status = stats?.status;
      // const endpoint = stats?.endpoint;
      // const actualIP = extractIP(endpoint);
      // setIsConnected(status === 'connected');
      // setVpnIP(actualIP || 'N/A');
      // setVpnLocation('New York, USA'); 
      if(Platform.OS === 'ios'){
        const stats = await getRuntimeStats();
      console.log("VPN Stats:", stats);
      const status = stats?.status;
      const endpoint = stats?.endpoint;
      const actualIP = extractIP(endpoint);
            console.log("actualIP actualIP:", actualIP);
      setVpnIP(actualIP);
      setIsConnected(status === "connected");
      setVpnLocation('New York, USA')
      }else{
        const status = await checkAndGetVpnStatus()
        const currentVpnConfig = await getRunningVpnConfig()
        const endpoint = getEndpointFromConfig(currentVpnConfig)
        const actualIP = extractIP(endpoint);
        setVpnIP(actualIP);
        setIsConnected(status?.toLowerCase() === "connected");
      }
    } catch (e) {
      Platform.OS === 'android' ? await disconnectVpn() : await stopVPN();
      // await stopVPN();
      console.log('VPN status check failed', e);
      setIsConnected(false);
      setVpnIP('IP: N/A');
      setVpnLocation('Disconnected');
    }
  };

  const handleBackButtonClick = () => {
    Singleton.bottomBar?.navigateTab('WalletMain');
    Actions.Main({ type: ActionConst.RESET });
    return true;
  };

  return (
    <ImageBackground
      source={ThemeManager.ImageIcons.mainBgImgNew}
      style={{ flex: 1, backgroundColor: ThemeManager.colors.mainBgNew }}>
      <View style={[styles.mainView]}>
        <HeaderMain
          BackButtonText={vpn.trueVPN}
          customStyle={{ paddingHorizontal: widthDimen(24) }}
          showBackBtn={true}
          // imgSecond={
          //   isConnected ? images.unfav1 : ThemeManager.ImageIcons.crown_icon
          // }
          onPressIcon={() => {
            Actions.BuyCredit();
          }}
        />

        <VpnGlobeComp
          text={isConnected ? vpn.connected : vpn.disconnected}
          defaultWallet={defaultWallet}
          isConnected={isConnected}
          remaining={remaining}
          startLoader={() => {
            setLoading(true);
          }}
          stopLoader={() => {
            setLoading(false);
          }}
          quickConnectNode={quickConnectNode}
          subscriptions={userSubscription}
          onPress={res => {
            if (res) {
              setIsConnected(true);
              checkVpnStatus();
            } else {
              setIsConnected(false);
            }
          }}
          src={
            isConnected
              ? ThemeManager.ImageIcons.connect_icon
              : ThemeManager.ImageIcons.disconnect_icon
          }
          imgSecond={ThemeManager.ImageIcons.crown_icon}
          balance={balance}
        />
        {/* <ScrollView> */}
        {isConnected ? (
          <ConnectContainer
            countryList={countryList}
            // vpnLocation={vpnLocation}
            vpnIP={vpnIP}
          />
        ) : (
          <DisconnectContainer
            countries={countryList}
            sessions={sessionList}
            defaultWallet={defaultWallet}
            isConnected={isConnected}
            startLoader={() => {
              setLoading(true);
            }}
            stopLoader={() => {
              setLoading(false);
            }}
            quickConnectNode={quickConnectNode}
            subscriptions={userSubscription}
            onPress={res => {
              if (res) {
                setIsConnected(true);
                checkVpnStatus();
              } else {
                setIsConnected(false);
              }
            }}
            balance={balance}
          />
        )}
        {/* </ScrollView> */}
        {/* <ConnectContainer countryList={countryList} /> */}

        <LoaderView isLoading={loading} />
      </View>
    </ImageBackground>
  );
};

export default connect(undefined, {})(VpnScreen);
