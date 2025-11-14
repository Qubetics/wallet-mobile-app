import {ImageBackground, SectionList, Text, View} from 'react-native';
import React, {useEffect, useState} from 'react';
import {ThemeManager} from '../../../../ThemeManager';
import {DvpnLoader, HeaderMain} from '../../common';
import {LanguageManager} from '../../../../LanguageManager';
import {dimen, widthDimen} from '../../../Utils';
import SettingCards from '../../common/SettingCards';
import styles from './VpnSettingsStyles';
import {Actions} from 'react-native-router-flux';
import {DVPN_PRIVACY_POLICY_LINK, DVPN_TERM_LINK} from '../../../Constants';
import {getAppVersion} from '../../Api/VPN/api/getAppVersion';
import {useSelector} from 'react-redux';

const VpnSettings = () => {
  const [vpnVersion, setVpnVersion] = useState('');
  const [sectionedData, setSectionedData] = useState([]);
  const coinList = useSelector(state => state.walletReducer.coinList);
  const [selectedCoin, setselectedCoin] = useState();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const filteredCoins =
      coinList?.filter(coin => coin.coin_name == 'Qubetics') || [];
    setselectedCoin(filteredCoins[0]);
    initScreen();

    return () => {};
  }, []);

  const initScreen = async () => {
    setLoading(true);

    let fetchedVersion = '-'; // default fallback
    try {
      const versionResponse = await getAppVersion();
      fetchedVersion = versionResponse?.data?.version || '-';
      setVpnVersion(fetchedVersion);
    } catch (error) {
      setVpnVersion('-');
    } finally {
      // Always build sectionedData, even on failure

      const settingsData = [
        {
          title: 'Connectivity',
          data: [
            {
              id: 2,
              images: 'exchangeRpcIcon',
              title: 'RPC',
              showView: false,
            },
          ],
        },
        {
          title: 'Legal',
          data: [
            {
              id: 4,
              images: 'termsAndServiceIcon',
              title: 'Terms of Service',
              showView: false,
            },
            {
              id: 5,
              images: 'greyPrivacyPolicy',
              title: LanguageManager.setting.privacyPolicy,
              showView: false,
            },
            {
              id: 6,
              images: 'versionFrame',
              title: 'Version',
              showView: true,
              rightText: fetchedVersion, // works even if failed
            },
          ],
        },
        {
          title: 'Account',
          data: [
            {
              id: 9,
              images: 'accountIcon',
              title: 'Account Details',
              showView: false,
            },
            {
              id: 10,
              images: 'accountManageIcon',
              title: 'Account Top-Up',
              showView: false,
            },
          ],
        },
      ]

      if (1 == 1) {
        settingsData.unshift({
          title: 'Choose Provider',
          data: [
            {
              id: 2,
              images: 'accountIcon',
              title: 'Choose Provider',
              showView: false,
            },
          ],
        })
      }

      setSectionedData(settingsData);

      setLoading(false);
    }
  };
  const renderSectionHeader = ({section: {title}}) => {
    if (!title) return null;

    return (
      <Text
        style={[
          styles.sectionHeaderText,
          {color: ThemeManager.colors.blackWhiteText},
        ]}>
        {title}
      </Text>
    );
  };

  const renderItem = ({item, index}) => {
    return (
      <SettingCards
        leftIcon={ThemeManager.ImageIcons?.[item.images]}
        leftText={item?.title}
        showRightText={item?.rightText}
        onPress={() => {
          console.log('213123123123123123123', item, index);
          if (item?.title == 'Account Details') {
            Actions.currentScene != 'VpnAccountDetails' &&
              Actions.VpnAccountDetails();
          }
          if (item?.title == 'RPC') {
            Actions.RpcDetails();
          }
          if (item?.title == 'Privacy Policy') {
            Actions.currentScene != 'PrivacyPolicy' &&
              Actions.PrivacyPolicy({
                Viewtype: 'PrivacyPolicy',
                url: DVPN_PRIVACY_POLICY_LINK,
              });
          }

          if (item?.title == 'Terms of Service') {
            Actions.currentScene != 'PrivacyPolicy' &&
              Actions.PrivacyPolicy({
                Viewtype: 'TermsofService',
                url: DVPN_TERM_LINK,
              });
          }

          if (item?.title == 'Node Access') {
            Actions.currentScene != 'VpnNodeAccess' && Actions.VpnNodeAccess();
          }

          if (item?.title == 'Account Top-Up') {
            Actions.currentScene != 'Receive' &&
              Actions.Receive({
                selectedCoin: selectedCoin,
                themeSelected: 2,
                accouttopup: 'cosmos',
              });
          }
        }}
      />
    );
  };

  return (
    <ImageBackground
      source={ThemeManager.ImageIcons.mainBgImgNew}
      style={{flex: 1, backgroundColor: ThemeManager.colors.mainBgNew}}>
      <View style={[styles.mainView]}>
        <HeaderMain
          BackButtonText={LanguageManager.setting.settings}
          customStyle={{paddingHorizontal: widthDimen(24)}}
          showBackBtn={true}
        />
        <View
          style={{
            flex: 1,
          }}>
          <SectionList
            sections={sectionedData}
            style={{
              marginHorizontal: dimen(24),
            }}
            showsVerticalScrollIndicator={false}
            keyExtractor={item => item.id.toString()}
            contentContainerStyle={{
              paddingBottom: dimen(24),
            }}
            renderItem={renderItem}
            renderSectionHeader={renderSectionHeader}
            stickySectionHeadersEnabled={false}
            ItemSeparatorComponent={() => <View style={{height: dimen(8)}} />}
          />
        </View>
      </View>
      <DvpnLoader isLoading={loading} />
    </ImageBackground>
  );
};

export default VpnSettings;
