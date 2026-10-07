import { Component } from 'react';
import {
  BackHandler,
  Dimensions,
  Image,
  ImageBackground,
  Platform,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import DeviceInfo from 'react-native-device-info';
import { Actions } from '../../../navigation/RootNavigation';
import { LanguageManager } from '../../../../LanguageManager';
import { ThemeManager } from '../../../../ThemeManager';
import * as Constants from '../../../Constants';
import Singleton from '../../../Singleton';
import { Colors, Images } from '../../../theme';
import { getDimensionPercentage, widthDimen } from '../../../Utils';
import { consoleLogFunc, getData } from '../../../Utils/MethodsUtils';
import { GradientBorderView } from '../../common';
import WalletStats from '../WalletStats/WalletStats';
import WatchList from '../WatchList/WatchList';
import styles from './PortfolioStyle';
class Portfolio extends Component {
  constructor(props) {
    super(props);
    this.state = {
      selectedIndex: 0,
      walletName: ''
    };
  }

  /******************************************************************************************/
  componentDidMount() {
    this.focusListener = this.props.navigation.addListener('focus', event => {
      getData(Constants.WALLET_NAME).then(async name => {
        this.setState({ walletName: name })
      })

      consoleLogFunc(Singleton.fromWatchList, 'event:::::::');
      this.setState({ selectedIndex: Singleton.fromWatchList == true ? 1 : 0 });
      this.backhandle = BackHandler.addEventListener('hardwareBackPress', this.handleBackButtonClick);
    });
    this.blurListener = this.props.navigation.addListener('blur', () => {
      if (this.backhandle) this.backhandle.remove();
    });
  }

  componentWillUnmount() {
    if (this.focusListener) this.focusListener();
    if (this.blurListener) this.blurListener();
  }


  /******************************************************************************************/
  handleBackButtonClick() {
    consoleLogFunc('Backhandler portfolio');
    Singleton.bottomBar?.navigateTab('WalletMain');
    // Actions.jump('WalletMain');
    Actions.pop();

    return true;
  }

  notiPressed() {
    Singleton.isNotification = false
    this.setState({ is_notification: false });
    Actions.currentScene != "NotificationsTab" &&
      Actions.NotificationsTab({ themeSelected: this.state.themeSelected });
  }

  /******************************************************************************************/
  render() {
    const { portfolio } = LanguageManager;
    return (
      <ImageBackground
        source={ThemeManager.ImageIcons.mainBgImgNew}
        style={{ flex: 1, backgroundColor: ThemeManager.colors.mainBgNew }}
      >
        <View style={{ flex: 1, }}>
          <View
            style={{
              width: Dimensions.get('screen').width,
              paddingTop: Platform.OS == 'ios'
                ? DeviceInfo.hasNotch() || DeviceInfo.hasDynamicIsland()
                  ? getDimensionPercentage(50)
                  : getDimensionPercentage(20)

                : getDimensionPercentage(0),
            }}
          >
            <View style={[styles.ViewStyle2]}>
              <View style={[styles.ViewStyle, {}]}>

                <TouchableOpacity
                  onPress={() => {
                    if (Actions.currentScene !== "MyWalletList") {
                      Actions.MyWalletList();
                    }
                  }}
                >
                  <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "center" }}>

                    <GradientBorderView
                      gradientStyle={{ height: widthDimen(46), width: widthDimen(46) }}
                      mainStyle={{ alignItems: "center", justifyContent: "center" }}
                    >
                      <Text style={[styles.walletNameIcon, { color: ThemeManager.colors.blackWhiteText }]}>{this.state.walletName?.charAt(0)?.toUpperCase()}</Text>

                    </GradientBorderView>

                    <Text
                      ellipsizeMode="tail"
                      style={[styles.walletName, { color: ThemeManager.colors.blackWhiteText }]}
                    >
                      {this.state.walletName}
                    </Text>
                    <Image source={ThemeManager.ImageIcons.newDropDown}
                      style={{ resizeMode: "contain", marginLeft: widthDimen(8) }} />

                  </View>
                </TouchableOpacity>

                <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "center" }}>
                <TouchableOpacity
                  onPress={() => Actions.currentScene != "Settings" && Actions.Settings()}
                >
                  <Image source={ThemeManager.ImageIcons.inActiveSetting}
                    style={{ tintColor: Colors.White,  resizeMode: "contain", marginRight: widthDimen(8) }} />
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => this.notiPressed()}
                  style={[styles.touchableStyle]}
                >

                  <Image
                    style={[styles.imgNoti]}
                    source={
                      // Images.notiDot
                      Singleton.isNotification
                        ? Images.notiDot
                        : Images.noti
                    }
                  />
                </TouchableOpacity>
              </View>
              </View>
            </View>
          </View>
          <View style={[styles.tab_wrapstyle]}>

            <View style={[styles.tabsWrap]}>
              <TouchableOpacity onPress={() => { this.setState({ selectedIndex: 0 }) }} style={this.state.selectedIndex == 0 ? [styles.tab_isActiveStyle, { backgroundColor: 'transparent', borderBottomWidth: 2, borderColor: ThemeManager.colors.primaryColor }] : [styles.tab_inActiveStyle,]}>
                <Text allowFontScaling={false} style={[styles.tab_isActiveTextStyle, { color: this.state.selectedIndex == 0 ? ThemeManager.colors.primaryColor : ThemeManager.colors.legalGreyColor }]}>{portfolio.walletStats}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={this.state.selectedIndex == 1 ? [styles.tab_isActiveStyle, { backgroundColor: 'transparent', borderBottomWidth: 2, borderColor: ThemeManager.colors.primaryColor }] : styles.tab_inActiveStyle} onPress={() => { this.setState({ selectedIndex: 1 }) }}>
                <Text allowFontScaling={false} style={[styles.tab_isActiveTextStyle, { color: this.state.selectedIndex == 1 ? ThemeManager.colors.primaryColor : ThemeManager.colors.legalGreyColor }]}>{portfolio.watchlist}</Text>
              </TouchableOpacity>
            </View>

            <View>
              <WalletStats
                navigation={this.props.navigation}
                isVisible={this.state.selectedIndex == 0}
              />
              <WatchList
                navigation={this.props.navigation}
                isVisible={this.state.selectedIndex == 1}
              />
            </View>
          </View>
        </View>
      </ImageBackground>
    );
  }
}

export default Portfolio;
