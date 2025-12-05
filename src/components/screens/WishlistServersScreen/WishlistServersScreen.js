import React, {useEffect, useState} from 'react';
import {
  BackHandler,
  Dimensions,
  FlatList,
  ImageBackground,
  TouchableOpacity,
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
import {
  DvpnLoader,
  HeaderMain,
  InputtextSearch,
  LoaderView,
} from '../../common';
import RecentSessions from '../../common/RecentSessions';
import styles from './WishlistServersScreenStyle';
import RecentServers from '../../common/RecentServers';
import {getVpnNodes} from '../../Api/VPN/api/getVpnNodes';
import { consoleLogFunc } from '../../../Utils/MethodsUtils';

const WishlistServersScreen = props => {
  const {vpn} = LanguageManager;
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [countryList, setCountryList] = useState([]);
  const [cityFlag, setCityFlag] = useState('');
  const [filteredCountryList, setFilteredCountryList] = useState([]);

  useEffect(() => {

    EventRegister.addEventListener('getThemeChanged', data => {
      // setThemeSelected({ themeSelected: data ? data : 2 });
    });
    BackHandler.addEventListener('hardwareBackPress', handleBackButtonClick);
    const focusListener = props.navigation.addListener('didFocus', () => {
      BackHandler.addEventListener('hardwareBackPress', handleBackButtonClick);
      loadVpnNodes();
    });
    const blurListener = props.navigation.addListener('didBlur', () => {
      BackHandler.removeEventListener(
        'hardwareBackPress',
        handleBackButtonClick,
      );
    });

    EventRegister.addEventListener(Constants.DOWN_MODAL, () => {});
    loadVpnNodes();

    return () => {
      focusListener.remove();
      blurListener.remove();
      BackHandler.removeEventListener(
        'hardwareBackPress',
        handleBackButtonClick,
      );
    };
  }, []);

  const loadVpnNodes = async () => {
    setLoading(true);
    try {
      const reqParams = {
        limit: 10,
        page: 1,
        order: 'ASC',
        count_total: true,
        reverse: false,
        country: props?.country,
        planId: props?.planId,
        protocol: props?.protocol,
      }
      consoleLogFunc('reqParams reqParams--->', reqParams);
      const result = await getVpnNodes(reqParams);
      setLoading(false);
      if (!result.Error) {
        consoleLogFunc('✅ all VPN Nodes:', result);
        consoleLogFunc('✅ VPN Nodes:', result?.data?.cities);
        setCountryList(result?.data?.cities);
        setFilteredCountryList(result?.data?.cities);
        setCityFlag(result?.data?.flag_url);

        if (result?.total) {
          consoleLogFunc('Total Nodes:', result?.data?.total);
        }
      } else {
        console.warn('⚠️ Failed to fetch nodes:', result.Message);
      }
    } catch (err) {
      console.error('❌ Error fetching nodes:', err.message);
    }
  };

  const handleBackButtonClick = () => {
    Singleton.bottomBar?.navigateTab('WalletMain');
    Actions.Main({type: ActionConst.RESET});
    return true;
  };
  const updateSearch = text => {
    let list = countryList.filter(res =>
      res.city?.toLowerCase().startsWith(text.toLowerCase()),
    );
    setFilteredCountryList(list);
  };
  return (
    <ImageBackground
      source={ThemeManager.ImageIcons.mainBgImgNew}
      style={{flex: 1, backgroundColor: ThemeManager.colors.mainBgNew}}>
      <View style={[styles.mainView]}>
        <HeaderMain
          BackButtonText={vpn.servers}
          customStyle={{paddingHorizontal: widthDimen(24)}}
          // imgSecond={images.unfav1}
        />
        <InputtextSearch
          style={{
            height: 50,
            width: Dimensions.get('screen').width - widthDimen(48),
          }}
          placeholder={vpn.searchCity}
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
            consoleLogFunc('SERARCH_____', text);
          }}
          onSubmitEditing={() => updateSearch(search)}
        />
        <View style={{ marginHorizontal: widthDimen(24) }}>

        <RecentServers
          fromServerScreen
          isFavShow={false}
          dataList={filteredCountryList}
          listType={'City'}
          cityFlag={cityFlag}
          onPress={item => {
            Actions.currentScene != 'SelectServers' &&
              Actions.SelectServers({data: item, planId: props?.planId, protocol: props?.protocol});
          }}
        />
        </View>
        <DvpnLoader isLoading={loading} />
      </View>
    </ImageBackground>
  );
};

export default connect(undefined, {})(WishlistServersScreen);
