import React, { useEffect, useState } from 'react';
import {
  BackHandler,
  Dimensions,
  FlatList,
  ImageBackground,
  Pressable,
  ScrollView,
  Text,
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
import { heightDimen, widthDimen } from '../../../Utils';
import {
  HeaderMain,
  InputtextSearch,
  LoaderView,
  DvpnLoader,
} from '../../common';
import RecentServers from '../../common/RecentServers';
import VpnGradientCard from '../../common/VpnGradientCard';
import styles from './ServiceProviderStyle';
import { consoleLogFunc, getData } from '../../../Utils/MethodsUtils';
import { getVpnNodes } from '../../Api/VPN/api/getVpnNodes';
import { getUserSubscriptions } from '../../Api/VPN/api/getUserSubscriptions';
import ServerCards from '../../common/ServerCards';
import { getAllProviders } from '../../Api/VPN/api/getAllProviders';

// const filters1 = ["All", "V2Ray", "Wireguard"];
const filters1 = ['Wireguard'];

const ServiceProvider = props => {
  const { vpn } = LanguageManager;
  const [loading, setLoading] = useState(true);
  const [defaultWallet, setDefaultWallet] = useState([]);
  const [subscriptions, setSubscriptions] = useState([]);
  const [search, setSearch] = useState('');
  const [selected1, setSelected1] = useState('Wireguard');
  const [selected2, setSelected2] = useState('All Locations');
  const [countryList, setCountryList] = useState([]);
  const [filteredCountryList, setFilteredCountryList] = useState([]);
  const [planId, setPlanId] = useState(null)

  const fetchServiceProvider = async () => {
    try {
      const response = await getAllProviders();
      setLoading(false)
      console.log('response--->>', JSON.stringify(response));
      if (response.status == 200) {
        setFilteredCountryList(response?.data);
        // setCountryList(response?.data);
      } 
    } catch (error) {
      setLoading(false)
      console.log('error--->>', error);
    }
  }

  const getDefaultWallet = async () => {
    getData(Constants.MULTI_WALLET_LIST).then(list => {
      let currentWallet = JSON.parse(list);
      currentWallet = currentWallet.find(res => res?.defaultWallet);
      setDefaultWallet(currentWallet);
    });
  }
  useEffect(() => {
    // setFilteredCountryList(providerList)
    // setCountryList(providerList);
    // return;
    if(props?.isFrom != "VPN_SCREEN"){
    fetchServiceProvider();
    getDefaultWallet();
    }
    const focusListener = props.navigation.addListener('didFocus', () => {
      // gerUserSubscrption();
      fetchServiceProvider();
      getDefaultWallet();
    });

    EventRegister.addEventListener(Constants.DOWN_MODAL, () => { });
    gerUserSubscrption();
    return () => {
      focusListener.remove();

    };
  }, []);

  const handleBackButtonClick = () => {
    Singleton.bottomBar?.navigateTab('WalletMain');
    Actions.Main({ type: ActionConst.RESET });
    return true;
  };

  const gerUserSubscrption = async () => {
    let planId = null;

    try {
      const subsResponse = await getUserSubscriptions({
        limit: 5,
        order: 'DESC',
      });
      const subscriptions = subsResponse?.data?.subscriptions || [];

      const validSubscriptions = subscriptions.filter(sub => {
        if (!sub?.inactive_at) return false;
        const inactiveAt = new Date(sub.inactive_at);
        if (isNaN(inactiveAt.getTime())) return false;
        return sub?.status === 'active' && inactiveAt.getTime() > Date.now();
      });

      if (validSubscriptions.length > 0) {
        setSubscriptions(validSubscriptions);
        const subscribedTo = validSubscriptions[0];
        planId = subscribedTo.plan_id; // ✅ capture plan id
        setPlanId(planId)
      }
      else {
        setSubscriptions([]);
      }
    } catch (err) {
    } finally {
      try {
        console.log('loadVpnNodes planId------>', planId);
        await loadVpnNodes(planId); // ✅ pass planId (null if no subscription)
      } catch (err) {
        console.error('❌ loadVpnNodesa failed:', err.message);
      }
    }
  };

  const loadVpnNodes = async (planId = null) => {

    try {
      const params = {
        limit: 10,
        page: 1,
        order: 'DESC', // ✅ fixed typo (was 'DES')
        count_total: true,
        reverse: false,
        protocol: 'wireguard',
      };

      if (planId) {
        params.planId = planId; // ✅ only add if available
      }
      console.log('loadVpnNodes call param ----->>>', params)
      const result = await getVpnNodes(params);
      setLoading(false);
      if (!result.Error) {
        console.log('✅ all VPN Nodes:', result);
        console.log('✅ VPN Nodes:', result?.data?.countries);

        setCountryList(result?.data?.countries);
        setFilteredCountryList(result?.data?.countries);

        if (result?.data?.total) {
          console.log('Total Nodes:', result?.data?.total);
        }
      } else {
        console.warn('⚠️ Failed to fetch nodes:', result.Message);
      }
     
    } catch (err) {
      setLoading(false);
      console.error('❌ Error fetching nodes:', err.message);
    }
  };

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
        ]}>
        {label}
      </Text>
    );

    return (
      <Pressable
        key={label}
        onPress={() => setSelected(label)}
        style={{ marginRight: widthDimen(15) }}>
        {isActive ? (
          <VpnGradientCard children={ButtonContent} />
        ) : (
          <VpnGradientCard isOutLine children={ButtonContent} />
        )}
      </Pressable>
    );
  };
  const updateSearch = text => {
    if (countryList?.length <= 0) {
      return;
    }
    let list = countryList?.filter(res =>
      res?.providerName?.toLowerCase().startsWith(text?.toLowerCase()),
    );
    setFilteredCountryList(list);
  };
  return (
    <ImageBackground
      source={ThemeManager.ImageIcons.mainBgImgNew}
      style={{ flex: 1, backgroundColor: ThemeManager.colors.mainBgNew }}>
      <View style={[styles.mainView]}>
        <HeaderMain
          BackButtonText={vpn.serviceProvider}
          customStyle={{ paddingHorizontal: widthDimen(24) }}
          backCallBack={()=> {
            if(props?.isFrom == "VPN_SCREEN"){
              Actions.pop()
            }
          }}
          showBackBtn={props?.isFrom != "VPN_SCREEN"}
        />

        {/* <InputtextSearch
          style={{
            height: 50,
            width: Dimensions.get('screen').width - widthDimen(48),
          }}
          placeholder={vpn.searchServiceProvider}
          returnKeyType={'done'}
          value={search}
          search={true}
          clear={search ? true : false}
          pressClear={() => {
            setSearch('');
            updateSearch('');
          }}
          onChangeNumber={text => {
            setSearch(text);
            updateSearch(text);
          }}
          onSubmitEditing={() => updateSearch(search)}
        /> */}

        <FlatList
          data={filteredCountryList}
          keyExtractor={(item, index) => index.toString()}
          contentContainerStyle={{ paddingHorizontal: widthDimen(24), paddingTop: heightDimen(20) }}
          showsVerticalScrollIndicator={false}
          renderItem={({ item, index }) => {
            let name = item.identity ? item.identity : item.name ?? "Unknown";
            let subscribedPlans = item?.subscribedPlanIds?.length || 0
            let locationTxt = subscribedPlans > 1 ? vpn.countries : vpn.country
            return (
              <ServerCards
                // flag={item?.img_url}
                name={name}
                index={index}
                locations={subscribedPlans}
                locationTxt={locationTxt}
                isUserSubscribed={item?.isUserSubscribed}
                ping={''}
                isFavShow={false}
                onPress={() => {
                  consoleLogFunc("subscribedPlans>>", subscribedPlans,item)
                  if(item?.isUserSubscribed){
                    Actions.currentScene != "SeverByProvider" && 
                    Actions.SeverByProvider({
                      selectedProvider: item,
                      onBuyPlanPress: () => {
                        Actions.pop();
                        Actions.currentScene != 'BuyCredit' &&
                        Actions.BuyCredit({
                          defaultWallet: defaultWallet,
                          userSubscription: subscriptions ?? {}, //currently no subscription will be shown in this screen
                          serviceProvider: item ?? {},
                        })
                      }
                    })
                  }else{
                    Actions.currentScene != 'BuyCredit' &&
                    Actions.BuyCredit({
                      defaultWallet: defaultWallet,
                      userSubscription: subscriptions ?? {}, //currently no subscription will be shown in this screen
                      serviceProvider: item ?? {},
                  })        
                  }
                }}
              />
            )
          }}
        />


        <DvpnLoader isLoading={loading} />
      </View>
    </ImageBackground>
  );
};

export default connect(undefined, {})(ServiceProvider);
