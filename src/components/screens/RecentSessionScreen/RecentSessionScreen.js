import React, {useEffect, useState} from 'react';
import {
  Alert,
  BackHandler,
  ImageBackground,
  Platform,
  Text,
  View,
} from 'react-native';
import {EventRegister} from 'react-native-event-listeners';
import {ActionConst, Actions} from 'react-native-router-flux';
import {connect} from 'react-redux';
import {LanguageManager} from '../../../../LanguageManager';
import {ThemeManager} from '../../../../ThemeManager';
import * as Constants from '../../../Constants';
import Singleton from '../../../Singleton';
import images from '../../../theme/Images';
import {widthDimen} from '../../../Utils';
import {HeaderMain, LoaderView, DvpnLoader} from '../../common';
import RecentSessions from '../../common/RecentSessions';
import styles from './RecentSessionScreenStyle';
import {getSessions} from '../../Api/VPN/api/getSessions';
import {stopVpnSessionOnChain} from '../../Api/VPN/api/stopVpnSessionOnChain';
import {startVpnSessionOnChain} from '../../Api/VPN/api/startVpnSessionOnChain';
import {
  getBalance,
  startSubscriptionOnChain,
} from '../../Api/VPN/api/startSubscriptionOnChain';
import {
  checkAndGetVpnStatus,
  connectVpn,
  createOrUpdateVPN,
  disconnectVpn,
  getRuntimeStats,
  startVPN,
  stopVPN,
} from '../../../components/common/WireGuardNative';
import {
  getData,
  getEncryptedData,
  removeStorageItem,
  saveData,
} from '../../../Utils/MethodsUtils';
import {getUserSubscriptions} from '../../Api/VPN/api/getUserSubscriptions';
import {Fonts} from '../../../theme';

const RecentSessionScreen = props => {
  const {vpn} = LanguageManager;
  const [loading, setLoading] = useState(false);
  const [sessionList, setSessionList] = useState([]);
  const [userAddress, setUserAddress] = useState();
  const [defaultWallet, setDefaultWallet] = useState();
  const [isConnected, setIsConnected] = useState(false);
  const [userSubscription, setUserSubscription] = useState([]);
  const [balance, setBalance] = useState();
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true); // Track if more pages exist
  const [isFetchingMore, setIsFetchingMore] = useState(false);

  useEffect(() => {
    console.log('12121212xcxcxcxcxc', page);

    initScreen();
    EventRegister.addEventListener('getThemeChanged', data => {
      // setThemeSelected({ themeSelected: data ? data : 2 });
    });
    BackHandler.addEventListener('hardwareBackPress', handleBackButtonClick);
    const focusListener = props.navigation.addListener('didFocus', () => {
      BackHandler.addEventListener('hardwareBackPress', handleBackButtonClick);
      setPage(1);
      setSessionList([]);
      initScreen();
    });
    const blurListener = props.navigation.addListener('didBlur', () => {
      BackHandler.removeEventListener(
        'hardwareBackPress',
        handleBackButtonClick,
      );
    });

    EventRegister.addEventListener(Constants.DOWN_MODAL, () => {});
    return () => {
      focusListener.remove();
      blurListener.remove();
      BackHandler.removeEventListener(
        'hardwareBackPress',
        handleBackButtonClick,
      );
    };
  }, []);

  const handleBackButtonClick = () => {
    Singleton.bottomBar?.navigateTab('WalletMain');
    Actions.Main({type: ActionConst.RESET});
    return true;
  };

  const initScreen = async () => {
    setLoading(true);
    try {
      const subsResponse = await getUserSubscriptions({
        limit: 5,
        order: 'DESC',
      });
      const subscriptions = subsResponse?.data?.subscriptions || [];
      console.log('getUserSubscriptions--->>', subscriptions);
      const validSubscriptions = subscriptions.filter(sub => {
        const inactiveAt = new Date(sub?.inactive_at);
        return sub?.status === 'active' && inactiveAt.getTime() > Date.now();
      });

      if (validSubscriptions.length > 0) {
        setUserSubscription(validSubscriptions);
      } else {
        setUserSubscription([]);
      }

      // setUserSubscription(subscriptions);

      const address = await loadUserInfo();
      await Promise.all([
        checkVpnStatus(),
        loadBalance(address), // ⬅️ will now have a valid userAddress
        fetchUserSessions(1, true),
      ]);
    } catch (error) {
      console.error('🔴 initScreen error:', error.message);
    } finally {
      setLoading(false);
    }
  };

  const checkVpnStatus = async () => {
    try {
      const stats =
        Platform.OS === 'android'
          ? await checkAndGetVpnStatus()
          : await getRuntimeStats();
      console.log('VPN Stats:', stats);
      const status = Platform.OS === 'android' ? stats : stats?.status;
      setIsConnected(status?.toLowerCase() === 'connected');
    } catch (e) {
      Platform.OS === 'android' ? await disconnectVpn() : await stopVPN();
      // await stopVPN();
      console.log('VPN status check failed', e);
      setIsConnected(false);
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

  const loadUserInfo = async () => {
    try {
      const address = await getData(Constants.COSMOS_ADDRESS);
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

  const fetchUserSessions = async (pageNumber = 1, replace = false) => {
    if (pageNumber !== 1) setIsFetchingMore(true);

    try {
      const result = await getSessions({
        limit: 10,
        page: pageNumber,
        order: 'DEC',
        count_total: true,
      });

      if (!result.Error) {
        const newSessions = result?.data?.sessions || [];
        setHasMore(newSessions.length > 0); // Stop pagination when no more data

        if (replace) {
          setSessionList(newSessions);
        } else {
          setSessionList(prev => [...prev, ...newSessions]);
        }
      } else {
        console.warn('⚠️ Failed to fetch sessions:', result?.message);
      }
    } catch (err) {
      console.error('❌ Error:', err?.message);
    } finally {
      setIsFetchingMore(false);
    }
  };
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
        setLoading(false);
      } else {
        setLoading(true);
        let subscriptionId;
        let connectedSessionId;
        let vpnConfig;
        if (userSubscription.length > 0) {
          subscriptionId = parseInt(userSubscription[0].id);
          console.log('<<<---subscriptionId->>', subscriptionId);
          console.log('🟢 Reusing existing subscription:', subscriptionId);
          const {config, sessionId} = await startVpnSessionOnChain({
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
            setLoading(false);
          }, 2000);
        } else {
          setLoading(false);
          Alert.alert('Failed to connect VPN');
          console.log('Failed to connect ---->>>', response);
        }
      }
    } catch (e) {
      setLoading(false);
      console.error('VPN toggle error4', e);
    }
  };

  const getMnemonics = async () => {
    return new Promise((resolve, reject) => {
      Actions.EnterPinSecurity({
        from: 'Security',
        fromScreen: 'Security',
        walletPin: async pin => {
          setLoading(true);
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
  const handleLoadMore = () => {
    console.log('12121212', page);
    if (!isFetchingMore && hasMore) {
      var nextPage = page + 1;
      setPage(nextPage);
      fetchUserSessions(nextPage);
    }
  };

  return (
    <ImageBackground
      source={ThemeManager.ImageIcons.mainBgImgNew}
      style={{flex: 1, backgroundColor: ThemeManager.colors.mainBgNew}}>
      <View style={[styles.mainView]}>
        <HeaderMain
          BackButtonText={vpn.recentSessions}
          customStyle={{paddingHorizontal: widthDimen(24)}}
          showBackBtn={true}
        />
        {sessionList?.length > 0 ? (
          <RecentSessions
            sessions={sessionList}
            handleEndReached={() => {
              handleLoadMore();
            }}
            onReconnectPress={item => {
              console.log('12313123', isConnected);
              if (isConnected) {
                Alert.alert('Please disconnect active session');
                return;
              }
              var quickConnectNode = item;
              connectToVpn(quickConnectNode);
            }}
          />
        ) : (
          <View style={{flex: 1, marginTop: 30, justifyContent: 'center'}}>
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
              {loading ? '' : 'No session found'}
            </Text>
          </View>
        )}
        <DvpnLoader isLoading={loading} />
      </View>
    </ImageBackground>
  );
};

export default connect(undefined, {})(RecentSessionScreen);
