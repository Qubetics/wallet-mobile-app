import React, { useEffect, useRef, useState } from 'react';
import { TouchableOpacity, View, Text, BackHandler, ImageBackground } from 'react-native';
import { ThemeManager } from '../../../../ThemeManager';
import { Header, HeaderMain } from '../../common';
import Notifications from './Notifications';
import Announcements from './Announcements';
import { EventRegister } from 'react-native-event-listeners';
import { Actions } from '../../../navigation/RootNavigation';
import { getNotiStatus } from '../../../Redux/Actions';
import { useDispatch } from 'react-redux';
import { LanguageManager } from '../../../../LanguageManager';
import { consoleLogFunc, getData } from '../../../Utils/MethodsUtils';
import { Images } from '../../../theme';
import colors from '../../../theme/Colors';
import { heightDimen, widthDimen } from '../../../Utils';

const NotificationsTab = props => {
  const dispatch = useDispatch();
  const [notiEnabled, setNotiEnabled] = useState('noti');
  const [isLoading, setLoading] = useState(false);
  const [isAnnouncement, setIsAnnouncement] = useState(false);
  const backStateRef = useRef(false);
  const { notifications } = LanguageManager;

  /******************************************************************************************/
  useEffect(() => {
    EventRegister.addEventListener('hitWalletApi', () => {
      consoleLogFunc('chk currrentscene::::::', Actions.currentScene);
      Actions.currentScene == 'NotificationsTab' && fetchNotiStatus();
    });
    let focusListener = props.navigation.addListener('focus', () => {
      setIsAnnouncement(false)
      fetchNotiStatus();
      BackHandler.addEventListener('hardwareBackPress', handleBackButtonClick);
    });
    let blurListener = props.navigation.addListener('blur', () => {
      BackHandler?.removeEventListener('hardwareBackPress', handleBackButtonClick);
    });
    return () => {
      (typeof focusListener === 'function' ? focusListener() : focusListener?.remove?.());
      (typeof blurListener === 'function' ? blurListener() : blurListener?.remove?.());
    };
  }, []);



  /******************************************************************************************/
  const handleBackButtonClick = () => {
    consoleLogFunc('Backhandler NotificationsTab');
   
    if (backStateRef.current) {
      backStateRef.current = false
      setIsAnnouncement(false)
    }else{
      Actions.pop()
    }
    // Singleton.bottomBar?.navigateTab('_WalletMain') || Singleton.bottomBar?.navigateTab('WalletMain');
    // Actions.jump('WalletMain');
    return true;
  };

  /******************************************************************************************/
  useEffect(() => {
    global.isPushNotificationEnabled = false;
    setLoading(!isLoading);
  }, [notiEnabled]);


  /******************************************************************************************/
  const backCallBack = () => {
    consoleLogFunc("backStateRef.current>>", backStateRef.current);
    
    if (backStateRef.current) {
      backStateRef.current = false
      setIsAnnouncement(false)
    }else{
      Actions.pop()
    }

    // Actions.jump('WalletMain');
  };

  /******************************************************************************************/
  const fetchNotiStatus = () => {
    const data = {
      key: 0
    };
    dispatch(getNotiStatus({ data })).then(res => {
      consoleLogFunc('chk noti res::::::', res);
    }).catch(err => {
      consoleLogFunc('chk noti err::::::', err);
    });
  };

  /******************************************************************************************/
  return (
    <ImageBackground
      source={ThemeManager.ImageIcons.mainBgImgNew}
      style={{ flex: 1, backgroundColor: ThemeManager.colors.mainBgNew }}
    >
      <HeaderMain
        backCallBack={() => backCallBack()}
        BackButtonText={isAnnouncement ? 'Announcements' : notifications.notifications}
        imgSecond={Images.announce_New}
        onPressIcon={() => {
          setIsAnnouncement(true)
          backStateRef.current = true
        }}
        imgSecondStyle={{
          tintColor: colors.White, width: heightDimen(30),
          height: widthDimen(30),
        }}
        disableTouchDis={true}
      />
      {isAnnouncement ? <>
        <Announcements navigation={props.navigation} /></> : <>
        <Notifications navigation={props.navigation} />
      </>}
      {/* <Notifications navigation={props.navigation} /> */}

    </ImageBackground>
  );
};

export default NotificationsTab;
