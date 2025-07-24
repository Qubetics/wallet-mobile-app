import React, { useEffect, useState } from 'react';
import { TouchableOpacity, View, Text, BackHandler, ImageBackground } from 'react-native';
import { ThemeManager } from '../../../../ThemeManager';
import { Header, HeaderMain } from '../../common';
import Notifications from './Notifications';
import Announcements from './Announcements';
import { EventRegister } from 'react-native-event-listeners';
import styles from './NotificationsStyle';
import Singleton from '../../../Singleton';
import { Actions } from 'react-native-router-flux';
import { getNotiStatus } from '../../../Redux/Actions';
import { useDispatch } from 'react-redux';
import { LanguageManager } from '../../../../LanguageManager';
import LinearGradient from 'react-native-linear-gradient';
import * as Constants from "../../../Constants";
import { consoleLogFunc, getData } from '../../../Utils/MethodsUtils';
import { Images } from '../../../theme';
import colors from '../../../theme/Colors';
import { heightDimen, widthDimen } from '../../../Utils';

const NotificationsTab = props => {
  const dispatch = useDispatch();
  const [notiEnabled, setNotiEnabled] = useState('noti');
  const [isLoading, setLoading] = useState(false);
  const [isHardware, setIsHardware] = useState(false);
  const [isAnnouncement, setIsAnnouncement] = useState(false);

  const { notifications } = LanguageManager;

  /******************************************************************************************/
  useEffect(() => {
    checkIsHardware();
    EventRegister.addEventListener('hitWalletApi', () => {
      consoleLogFunc('chk currrentscene::::::', Actions.currentScene);
      Actions.currentScene == 'NotificationsTab' && fetchNotiStatus();
    });
    let focusListener = props.navigation.addListener('didFocus', () => {
      setIsAnnouncement(false)
      checkIsHardware();
      fetchNotiStatus();
      BackHandler.addEventListener('hardwareBackPress', handleBackButtonClick);
    });
    let blurListener = props.navigation.addListener('didBlur', () => {
      BackHandler.removeEventListener('hardwareBackPress', handleBackButtonClick);
    });
    return () => {
      focusListener?.remove();
      blurListener?.remove();
    };
  }, []);

  const checkIsHardware = async () => {
    let tempLoginData = await getData(Constants.LOGIN_DATA);
    const login_data = typeof tempLoginData == 'string' ? JSON.parse(tempLoginData) : tempLoginData
    setIsHardware(!!login_data?.isHardware);
  }

  /******************************************************************************************/
  const handleBackButtonClick = () => {
    consoleLogFunc('Backhandler NotificationsTab');
    Actions.pop()
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
    Actions.pop()
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
        onPressIcon={() => { setIsAnnouncement(true) }}
        imgSecondStyle={{
          tintColor: colors.White, width: heightDimen(30),
          height: widthDimen(30),
        }}
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
