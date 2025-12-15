import React, { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  BackHandler,
  FlatList,
  ImageBackground,
  Platform,
  Text,
  TouchableOpacity,
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
import { dimen, heightDimen, widthDimen } from '../../../Utils';
import { HeaderMain, LoaderView, DvpnLoader, AppAlert } from '../../common';
import RecentSessions from '../../common/RecentSessions';
import styles from './RecentSessionScreenStyle';
import { getSessions } from '../../Api/VPN/api/getSessions';
import { stopVpnSessionOnChain } from '../../Api/VPN/api/stopVpnSessionOnChain';
import { startVpnSessionOnChain } from '../../Api/VPN/api/startVpnSessionOnChain';
import { useFocusEffect } from '@react-navigation/native';
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
  consoleLogFunc,
  getData,
  getEncryptedData,
  removeStorageItem,
  saveData,
} from '../../../Utils/MethodsUtils';
import { getRenewPlanListApi, getUserSubscriptions } from '../../Api/VPN/api/getUserSubscriptions';
import { Fonts } from '../../../theme';
import LinearGradient from 'react-native-linear-gradient';
import PlansHistory from './PlansHistory';
import TxnHistory from './TxnHistory';
import Clipboard from '@react-native-clipboard/clipboard';
import moment from 'moment';
import { APIClient } from '../../Api';
import { GET_SESSION_HISTORY } from '../../../EndPoint';

const RecentSessionScreen = props => {
  const { vpn, merchantCard } = LanguageManager;
  const [loading, setLoading] = useState(false);
  const [sessionList, setSessionList] = useState([]);
  const [userAddress, setUserAddress] = useState();
  const [defaultWallet, setDefaultWallet] = useState();
  const [isConnected, setIsConnected] = useState(false);
  const [userSubscription, setUserSubscription] = useState([]);
  const [renewPlanList, setRenewPlanList] = useState([]);
  const [sessionTrxList, setSessionTrxList] = useState([]);
  const [sessionTrxHistoryPage, setSessionTrxHistoryPage] = useState(1);
  const [sessionTrxHistoryPageHasMore, setSessionTrxHistoryPageHasMore] = useState(true);
  const [balance, setBalance] = useState();
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true); // Track if more pages exist
  const [isFetchingMore, setIsFetchingMore] = useState(false);
  const [selectedTab, setSelectedTab] = useState(1);
  const [showAlertDialog, setShowAlertDialog] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [alertTxt, setAlertTxt] = useState('');



  const historyConstId = {
    Sessions: 1,
    Plans: 2,
    Renew: 3,
    Txn: 4,
  }


  const TABS_LIST = [
    {
      id: historyConstId.Sessions,
      title: 'Sessions'
    },
    {
      id: historyConstId.Plans,
      title: 'Plans'
    },
    {
      id: historyConstId.Renew,
      title: 'Renew'
    },
    {
      id: historyConstId.Txn,
      title: 'Txn'
    },
  ]
  const tx_List = [
    {
      id: 1,
      tx_address: "0xBBD68248A1670C16e50A6343580622C1CA4208dC",
      type: 'Subscription',
      tx_status: true,
      expiryDate: moment().add(20, 'days'),
      isExpired: true,
    },
    {
      id: 2,
      tx_address: "0xBBD68248A1670C16e50A6343580622C1CA4208dC",
      type: 'start Session',
      tx_status: false,
      expiryDate: moment().add(40, 'days'),
      isExpired: false,
    },

  ]



  useEffect(() => {
    getRecentSessions()
    consoleLogFunc('12121212xcxcxcxcxc', page);
    setSelectedTab(1)
    initScreen();
    EventRegister.addEventListener('getThemeChanged', data => {
      // setThemeSelected({ themeSelected: data ? data : 2 });
    });
    BackHandler.addEventListener('hardwareBackPress', handleBackButtonClick);
    const focusListener = props.navigation.addListener('didFocus', () => {
      BackHandler.addEventListener('hardwareBackPress', handleBackButtonClick);
      setPage(1);
      setSessionTrxHistoryPage(1);
      setSessionList([]);
      initScreen();
    });
    const blurListener = props.navigation.addListener('didBlur', () => {
      setSelectedTab(1)
      BackHandler.removeEventListener(
        'hardwareBackPress',
        handleBackButtonClick,
      );
    });

    EventRegister.addEventListener(Constants.DOWN_MODAL, () => { });
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
    Actions.Main({ type: ActionConst.RESET });
    return true;
  };

  const initScreen = async () => {
    setLoading(true);
    try {
 

      // setUserSubscription(subscriptions);
      
      const address = await loadUserInfo();
      await Promise.all([
        checkVpnStatus(),
        loadBalance(address), // ⬅️ will now have a valid userAddress
        fetchUserSessions(1, true),
        fetchSessionTrxHistory(1),
      ]);
    } catch (error) {
      console.error('🔴 initScreen error:', error.message);
    } finally {
      setLoading(false);
    }
  };


  const getRecentSessions = async() => {
    const subsResponse = await getUserSubscriptions({
      limit: 30,
      order: 'DESC',
    });
    const subscriptions = subsResponse?.data?.subscriptions || [];
    consoleLogFunc('getUserSubscriptions--->>', subscriptions);
    if (subscriptions.length > 0) {
      setUserSubscription(subscriptions);
    } else {
      setUserSubscription([]);
    }
  }

  const getRenewPlanList = async() => {
    const subsResponse = await getRenewPlanListApi({
      limit: 30,
      order: 'DESC',
    });
    consoleLogFunc('getRenewPlanList--->>', subsResponse);
    const subscriptions = subsResponse?.data?.subscriptions || [];
    consoleLogFunc('getUserSubscriptions--->>', subscriptions);
    if (subscriptions.length > 0) {
      setRenewPlanList(subscriptions);
    } else {
      setRenewPlanList([]);
    }
  }

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
      const stats =
        Platform.OS === 'android'
          ? await checkAndGetVpnStatus()
          : await getRuntimeStats();
      consoleLogFunc('VPN Stats:', stats);
      const status = Platform.OS === 'android' ? stats : stats?.status;
      const endpoint = stats?.endpoint;
      const actualIP = extractIP(endpoint);

      if (status == 'disconnected' && actualIP != null) {
        Platform.OS === 'android' ? await disconnectVpn() : await stopVPN();
        return;
      }
      setIsConnected(status?.toLowerCase() === 'connected');
    } catch (e) {
      Platform.OS === 'android' ? await disconnectVpn() : await stopVPN();
      consoleLogFunc('VPN status check failed', e);
      setIsConnected(false);
    }
  };

  const loadBalance = async addressParam => {
    const address = addressParam || userAddress;
    consoleLogFunc('✅ Fetching balance for:', address);
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
      consoleLogFunc('✅ Balance fetched:', balance);
      setBalance(balance);
    } catch (e) {
      consoleLogFunc('❌ VPN status check failed', e);
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
      showAlert('Please top-up your account');
      return;
    }
    if (!quickConnectNode) {
      showAlert('Please top up you account');
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
          subscriptionId = parseInt(quickConnectNode.subscription_id);
          consoleLogFunc('<<<---subscriptionId->>', subscriptionId);
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
            setLoading(false);
            Actions.currentScene != 'VpnScreen' && Actions.VpnScreen()
          }, 5000);
        } else {
          setLoading(false);
          Platform.OS === 'android' ? await disconnectVpn() : await stopVPN();
          showAlert("Failed to connect VPN");
          consoleLogFunc('Failed to connect ---->>>', response);
        }
      }
    } catch (e) {
      setLoading(false);
      console.error('VPN toggle error4', e);
    }
  };

  const showAlert = (message) => {
    setShowAlertDialog(true);
    setAlertTxt(message);
  }

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

  const fetchSessionTrxHistory = async(pageNumber = 1) => {
    try{
      if (pageNumber !== 1) setIsFetchingMore(true);
      const token = await getData(Constants.ACCESS_TOKEN);
      const result = await APIClient.getInstance().post(GET_SESSION_HISTORY, {
        limit: 10,
        page: pageNumber,
      } ,token );
      if(result?.code == 200){
        const newSessions = result?.data?.history || [];
        setSessionTrxHistoryPageHasMore(result?.data?.history?.length < 10);
        if(pageNumber == 1){
          setSessionTrxList(newSessions || []);
        } else {
          setSessionTrxList(prev => [...prev, ...newSessions]);
        }
      }
    } catch (error) {
      console.error('❌ Error History Fetch:', error?.message);
    } finally {
      setIsFetchingMore(false);
    }
  }

  const handleMoreSessions = () => {
    if (!isFetchingMore && hasMore) {
      var nextPage = page + 1;
      setPage(nextPage);
      fetchUserSessions(nextPage);
    } else if(selectedTab == 2){
      if (!isFetchingMore && sessionTrxHistoryPageHasMore) {
        var nextPage = sessionTrxHistoryPage + 1;
        setSessionTrxHistoryPage(nextPage);
        fetchSessionTrxHistory(nextPage);
      }
    }
  };



  const renderItem = ({ item }) => (
    <LinearGradient
      colors={item.id != selectedTab ? [ThemeManager.colors.legalGreyColor, ThemeManager.colors.legalGreyColor] : ['#85FFC4', '#5CC6FF', '#6456B2', '#6145EA']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 0 }}
      style={{ padding: 1.5, borderRadius: dimen(14), marginRight: widthDimen(9) }}
    // width: '50%' marginBottom: heightDimen(12),
    >
      <TouchableOpacity onPress={() => {
        consoleLogFunc("RecentProviders Pressed", item)
        setSelectedTab(item.id)
        //ALREADY FETCHED THE DATA
        if(item?.id == 1){
          fetchUserSessions(1, true)
        }else if(item?.id == 2){
          getRecentSessions()
        }else if(item?.id == 3){
          getRenewPlanList()
        }else{
          fetchSessionTrxHistory(1);
        }
      }}
        activeOpacity={1}
        style={{
          backgroundColor: 'black',
          justifyContent: 'center',
          alignItems: 'center',
          borderRadius: dimen(14),
          paddingVertical: heightDimen(12),
          paddingHorizontal: widthDimen(8),
        }}>
        <Text style={{
          fontSize: dimen(14), fontFamily: Fonts.dmMedium, color: item.id == selectedTab ? 'white' : ThemeManager.colors.legalGreyColor,
          paddingHorizontal: widthDimen(10)
        }}>{item?.title}</Text>
      </TouchableOpacity>
    </LinearGradient>
  )


  const onCopyAddress = async (address) => {
    const { alertMessages } = LanguageManager;
    await Clipboard.setString(address);
    setShowAlertDialog(true);
    setAlertTxt(alertMessages.txnAddressCopied)
  };

  return (
    <ImageBackground
      source={ThemeManager.ImageIcons.mainBgImgNew}
      style={{ flex: 1, backgroundColor: ThemeManager.colors.mainBgNew }}>
      <View style={[styles.mainView]}>
        <HeaderMain
          BackButtonText={merchantCard.history}
          customStyle={{ paddingHorizontal: widthDimen(24) }}
          showBackBtn={true}
        />

        <View style={{ flexDirection: 'row', justifyContent: 'center', marginTop: heightDimen(20), gap: widthDimen(12), marginHorizontal: widthDimen(24), }}>
          {/* {providers.map((item, index) => (
                    renderItem({ item, index })))
                } */}

          <FlatList
            data={TABS_LIST}
            renderItem={renderItem}
            horizontal
            keyExtractor={(item, index) => index.toString()}
          />
        </View>

        {
          selectedTab == historyConstId.Sessions &&
          <>
            <RecentSessions
              sessions={sessionList}
              loading={loading}
              handleEndReached={() => handleMoreSessions()}
              onReconnectPress={item => {
                consoleLogFunc('12313123', isConnected);
                if (isConnected) {
                  showAlert('Please disconnect active session');
                  return;
                }
                var quickConnectNode = item;
                connectToVpn(quickConnectNode);
              }}
            />
          </>
        }

{
          selectedTab == historyConstId.Plans &&
          <>
            <PlansHistory
              planList={userSubscription}
              loading={loading}
              handleEndReached={() => {
              }}
            />
          </>
        }

        {
          selectedTab == historyConstId.Renew &&
          <>
            <PlansHistory
              planList={renewPlanList}
              loading={loading}
              handleEndReached={() => {
              }}
              onRenewPress={item => {

                Actions.currentScene != 'BuyCredit' &&
                Actions.BuyCredit({
                  defaultWallet: defaultWallet,
                  serviceProvider: {identity: item?.providers?.name, address: item?.provider_address},
              })     
              }}
            />
          </>
        }
        {
          selectedTab == historyConstId.Txn &&
          <>
            <TxnHistory
              transactionList={sessionTrxList}
              loading={loading}
              handleEndReached={handleMoreSessions}
              onCopyAddress={(address) => { onCopyAddress(address) }}
            />
          </>
        }
      
        {showAlertDialog && (
          <AppAlert
            showSuccess={showSuccess}
            alertTxt={alertTxt}
            hideAlertDialog={() => {
              setShowSuccess(false)
              setShowAlertDialog(false)
            }}
          />
        )}
        <DvpnLoader isLoading={loading} />
      </View>
    </ImageBackground>
  );
};

export default connect(undefined, {})(RecentSessionScreen);
