import React, { useEffect, useState } from 'react';
import {
  FlatList,
  ImageBackground,
  View,
} from 'react-native';
import { EventRegister } from 'react-native-event-listeners';
import { Actions } from 'react-native-router-flux';
import { connect } from 'react-redux';
import { LanguageManager } from '../../../../LanguageManager';
import { ThemeManager } from '../../../../ThemeManager';
import * as Constants from '../../../Constants';
import { heightDimen, widthDimen } from '../../../Utils';
import {
  HeaderMain,
  DvpnLoader,
} from '../../common';
import styles from './ServiceProviderStyle';
import { consoleLogFunc, getData } from '../../../Utils/MethodsUtils';
import { getUserSubscriptions } from '../../Api/VPN/api/getUserSubscriptions';
import ServerCards from '../../common/ServerCards';
import { getAllProviders } from '../../Api/VPN/api/getAllProviders';

const ServiceProvider = props => {
  const { vpn } = LanguageManager;
  const [loading, setLoading] = useState(true);
  const [defaultWallet, setDefaultWallet] = useState([]);
  const [subscriptions, setSubscriptions] = useState([]);
  const [filteredCountryList, setFilteredCountryList] = useState([]);
  const [planLastId, setPlanLastId] = useState(null)

  const fetchServiceProvider = async () => {
    try {
      const response = await getAllProviders();
      setLoading(false)
      console.log('response--->>', JSON.stringify(response));
      if (response.status == 200) {
        setFilteredCountryList(response?.data);
        const lastPlanId = await getData(Constants.LAST_PLAN_ID_USED)
        if(lastPlanId != null) {
          setPlanLastId(lastPlanId)
        }else{
          const lastProvider = response?.data?.find(res => res?.isUserSubscribed)
          setPlanLastId(lastProvider?.subscribedPlanIds?.[0])
        }
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
      }
      else {
        setSubscriptions([]);
      }
    } catch (err) {
    } finally {
      try {
        console.log('loadVpnNodes planId------>', planId);
       
      } catch (err) {
        console.error('❌ loadVpnNodesa failed:', err.message);
      }
    }
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

        <FlatList
          data={filteredCountryList}
          keyExtractor={(item, index) => index.toString()}
          contentContainerStyle={{ paddingHorizontal: widthDimen(24), paddingTop: heightDimen(20) }}
          showsVerticalScrollIndicator={false}
          renderItem={({ item, index }) => {
            let name = item.identity ? item.identity : item.name ?? "Unknown";
            let subscribedPlans = item?.subscribedPlanIds?.length || 0
            let locationTxt = subscribedPlans > 1 ? vpn.countries : vpn.country
            console.log('planLastId--->>', planLastId, item?.subscribedPlanIds?.[0])
            return (
              <ServerCards
                name={name}
                index={index}
                locations={subscribedPlans}
                isLastPlan={ planLastId != undefined && planLastId === item?.subscribedPlanIds?.[0]}
                locationTxt={locationTxt}
                isUserSubscribed={item?.isUserSubscribed}
                ping={''}
                isFavShow={false}
                chainAddress={item?.address}
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
