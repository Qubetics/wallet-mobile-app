import React, {useEffect, useState} from 'react';
import {BackHandler, ImageBackground, View} from 'react-native';
import {EventRegister} from 'react-native-event-listeners';
import {ActionConst, Actions} from 'react-native-router-flux';
import {connect} from 'react-redux';
import {LanguageManager} from '../../../../LanguageManager';
import {ThemeManager} from '../../../../ThemeManager';
import * as Constants from '../../../Constants';
import Singleton from '../../../Singleton';
import {widthDimen} from '../../../Utils';
import {HeaderMain, LoaderView} from '../../common';
import VpnCard from '../../common/VpnCard';
import styles from './VpnNodeAccessStyle';
import {getUserSubscriptions} from '../../Api/VPN/api/getUserSubscriptions';
import fonts from '../../../theme/Fonts';
import WalletMain from '../WalletMain/WalletMain';

const VpnNodeAccess = props => {
  const {vpn} = LanguageManager;
  const [loading, setLoading] = useState(false);
  const [userSubscription, setUserSubscription] = useState(null);

  useEffect(() => {
    initScreen();
    BackHandler.addEventListener('hardwareBackPress', handleBackButtonClick);
    const focusListener = props.navigation.addListener('didFocus', () => {
      BackHandler.addEventListener('hardwareBackPress', handleBackButtonClick);
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
  const formatDate = isoDate => {
    return new Date(isoDate).toLocaleString(); // or toLocaleDateString()
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
      setLoading(false);
      var remaining = '';
      if (subscriptions.length > 0) {
        const subscribedTo = subscriptions[0];
        console.log('subscribedTo->>', subscribedTo);
        remaining = getDaysLeftText(subscribedTo?.inactive_at);
        console.log(`⏳ Days left: ${remaining}`);
              setUserSubscription(remaining);

      }else{
      setUserSubscription('No Active Node');
      }
    } catch (error) {
      setLoading(false);
      console.error('🔴 initScreen error:', error?.message);
    }
  };

  const getDaysLeftText = inactive_at => {
    if (!inactive_at) return 'No expiry date';

    const now = new Date();
    const inactiveDate = new Date(inactive_at);
    const diffMs = inactiveDate.getTime() - now.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return 'Expired';
    if (diffDays === 0) return 'Expires today';
    if (diffDays === 1) return '1 day left';

    return `${diffDays} days left`;
  };
  const renderEmptyComponent = () => (
    <View style={{alignItems: 'center', justifyContent: 'center', flex: 1}}>
      <Text
        allowFontScaling={false}
        style={{
          fontSize: 18,
          fontFamily: fonts.dmMedium,
          color: ThemeManager.colors.subTextColor,
        }}>
        {"No Data Found"}
      </Text>
    </View>
  );

  return (
    <ImageBackground
      source={ThemeManager.ImageIcons.mainBgImgNew}
      style={{flex: 1, backgroundColor: ThemeManager.colors.mainBgNew}}>
      <View style={[styles.mainView]}>
        <HeaderMain
          BackButtonText={vpn.nodeAccess}
          customStyle={{paddingHorizontal: widthDimen(24)}}
        />
        {/* **********************************Card View*************************************** */}

        <View style={[styles.mainView_2]}>
          <VpnCard
            daysLeft={userSubscription}
            // onPress={() =>
            //   Actions.currentScene != 'DnsDetails' && Actions.DnsDetails()
            // }
          />
        </View>
        <LoaderView isLoading={loading} />
      </View>
    </ImageBackground>
  );
};

export default connect(undefined, {})(VpnNodeAccess);
