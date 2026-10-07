import {ImageBackground, Platform, SectionList, Text, View} from 'react-native';
import {useEffect, useState} from 'react';
import {ThemeManager} from '../../../../ThemeManager';
import {DvpnLoader, HeaderMain} from '../../common';
import {LanguageManager} from '../../../../LanguageManager';
import {dimen, widthDimen} from '../../../Utils';
import SettingCards from '../../common/SettingCards';
import styles from './VpnSettingsStyles';
import { Actions } from '../../../navigation/RootNavigation';
import {CURRENT_ANDROID_VERSION, CURRENT_IOS_VERSION, DVPN_PRIVACY_POLICY_LINK, DVPN_TERM_LINK, LAST_PLAN_ID_USED} from '../../../Constants';
import {useSelector} from 'react-redux';
import { getActiveroviders } from '../../Api/VPN/api/getAllProviders';
import { consoleLogFunc, getData } from '../../../Utils/MethodsUtils';

const VpnSettings = () => {
  const [vpnVersion, setVpnVersion] = useState('');
  const [sectionedData, setSectionedData] = useState([]);
  const coinList = useSelector(state => state.walletReducer.coinList);
  const [selectedCoin, setselectedCoin] = useState();
  const [loading, setLoading] = useState(false);
  const [lastProvider, setLastProvider] = useState(null);

  useEffect(() => {
    const filteredCoins =
      coinList?.filter(coin => coin.coin_name == 'Qubetics') || [];
    setselectedCoin(filteredCoins[0]);
    initScreen();

    return () => {};
  }, []);

  const initScreen = async () => {
    let lastProvider = null
    try {
      let activeProvider = await getActiveroviders();
      activeProvider = activeProvider.data
      consoleLogFunc('activeProvider--->>', activeProvider);
      const lastPlanId = await getData(LAST_PLAN_ID_USED)
      consoleLogFunc('lastPlanId--->>', lastPlanId);
      if(lastPlanId != null && activeProvider.length > 0) {
        const activeProvider = activeProvider.find(provider => provider.plan_id == lastPlanId)
        if(activeProvider) {
          lastProvider = activeProvider.name
        }
      }else if(activeProvider.length > 0) {
        lastProvider = activeProvider[0]
      }
      setLastProvider(lastProvider);
      consoleLogFunc('lastProvider--->>', lastProvider);
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
              rightText: Platform.OS == 'android' ? CURRENT_ANDROID_VERSION : CURRENT_IOS_VERSION, // works even if failed
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

      if (lastProvider != null) {
        settingsData.unshift({
          title: 'Choose Provider',
          data: [
            {
              id: 11,
              images: 'accountIcon',
              title: lastProvider?.name || lastProvider?.identity || "Unknown",
              showView: false,  
            },
          ],
        })
      }

      setSectionedData(settingsData);
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
          consoleLogFunc('213123123123123123123', item, index);
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
          if (item?.id == 11) {
            Actions.currentScene != "SeverByProvider" && 
                    Actions.SeverByProvider({
                      selectedProvider: lastProvider,
                    })
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
