import { Component } from "react";
import {
  Animated,
  Easing,
  Platform,
  SafeAreaView,
  StyleSheet,
  TouchableOpacity,
  View
} from "react-native";
import { EventRegister } from "react-native-event-listeners";
import { Actions } from '../../navigation/RootNavigation';
import { connect } from "react-redux";
import { ThemeManager } from "../../../ThemeManager";
import * as Constants from "../../Constants";
import Singleton from "../../Singleton";
import { Fonts, Images } from "../../theme";
import { dimen } from "../../Utils";
import { getData } from "../../Utils/MethodsUtils";
import { TabIconCustom } from "./TabIconCustom";

class CustomTabBarVpn extends Component {
  constructor(props) {
    super(props);
    this.state = {
      show: true,
      refresh: true,
      activeScene: "WalletMain",
      themeSelected: "",
      isDapSwapDisabled: false,
      isBtcTrxPrivateKey: false,
      isMakerWallet: false,
      forceRefresh: false, // need to check if active tab bar icon is highlighted corrected without this or not
      activeTabIndex: 0
    };
    this.translateY = new Animated.Value(20);
  }

  //******************************************************************************************/
  componentDidMount() {
    this.startAnimation();
    this.checkPrivateKeyWallet();
    EventRegister.addEventListener("isHistoryClicked", () => {
      this.setState({ activeTabIndex: 2 });
    });
    EventRegister.addEventListener("getThemeChanged", (data) => {
      this.setState({ themeSelected: data ? data : 2 });
    });
    getData(Constants.DARK_MODE_STATUS).then(async (theme) => {
      this.setState({ themeSelected: theme });
    });
  }

  checkPrivateKeyWallet() {
    getData(Constants.MULTI_WALLET_LIST).then((list) => {
      const currentWalletList = JSON.parse(list);
      let currentWallet = currentWalletList.find((res) => res?.defaultWallet);
      if (currentWallet?.isPrivateKey) {
        if (currentWallet?.coinFamily == 3 || currentWallet?.coinFamily == 6) {
          if (Actions.currentScene == "DefiAccessMain") {
            Actions.pop();
          } else if (Actions.currentScene == "Swap") {
            Actions.pop();
          }
          this.setState({
            isBtcTrxPrivateKey: true,
          });
        } else {
          this.setState({
            isBtcTrxPrivateKey: false,
          });
        }
      } else {
        this.setState({
          isBtcTrxPrivateKey: false,
        });
      }
    });
  }
  startAnimation() {
    this.bouncyAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(this.translateY, {
          toValue: 50,
          duration: 1000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(this.translateY, {
          toValue: 20,
          duration: 1000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );
    this.bouncyAnimation.start();
  }

  componentDidUpdate(prevProps) { }

  //******************************************************************************************/

  //******************************************************************************************/

  //******************************************************************************************/
  navigateTab = (scene) => {
    this.setState({ activeScene: scene });
  };

  //******************************************************************************************/
  getTextColor(item, isActive) {
    const { themeSelected } = this.state;
    let color = "";
    if (themeSelected == 2) {
      color = isActive
        ? ThemeManager.colors.colorVariation
        : "rgba(79, 83, 83, 1)";
    } else {
      color = isActive ? "#24A09D" : ThemeManager.colors.lightGrayTextColor;
    }
    return color;
  }

  //******************************************************************************************/
  render() {
    const imgArr = [
      {
        scene: "VpnScreen",
        label: "VpnScreen",
        inactive: Images.home2,
      },
      {
        scene: "Main",
        label: "Main",
        inactive: ThemeManager.ImageIcons.vpn_wallet,
      },
      {
        scene: "RecentSessionScreen",
        label: "RecentSessionScreen",
        inactive: ThemeManager.ImageIcons.vpn_session,
      },
      {
        scene: "ServersScreen",
        label: "ServersScreen",
        inactive: ThemeManager.ImageIcons.vpn_globe_tab,
      },
      {
        scene: "VpnSettings",
        label: "VpnSettings",
        inactive: ThemeManager.ImageIcons.vpn_setting_tab,
      },

    ];

    if (!this.state.show) return null;
    const { themeSelected } = this.state;
    const animatedStyle = {
      transform: [{ translateY: this.translateY }],
    };
    const { state } = this.props;
    const activeTabIndex = state.index;

    return (
      <>
        <SafeAreaView
          style={{ backgroundColor: ThemeManager.colors.tabBarBgColor }}
        >
          <View
            style={[
              styles.ViewStyle1,
              { backgroundColor: ThemeManager.colors.tabBarBgColor },
            ]}
          >
            {imgArr.map((item, index) => {
              return (
                <TouchableOpacity
                  key={"key" + index}
                  // disabled={
                  //   (index == 1 && this.state.isBtcTrxPrivateKey)
                  //     (index == 3 && this.state.isBtcTrxPrivateKey)
                  // }
                  onPress={() => {
                    Actions.currentScene != "jump" &&
                      Actions.jump(item.scene, { wc_url: "" });
                    Singleton.fromWatchList = false;
                    this.setState({ activeScene: item.scene, activeTabIndex: index });
                  }}
                >
                  <TabIconCustom
                    focused={this.state.activeTabIndex == index}
                    themeSelected={this.state.themeSelected}
                    activeImg={item.inactive}
                    title={item.label}
                    titleColor={{
                      color: this.getTextColor(item, this.state.activeTabIndex == index),
                    }}
                    ImgSize={{}}
                  />
                </TouchableOpacity>
              );
            })}
          </View>
        </SafeAreaView>
        {/* <SafeAreaView style={{ backgroundColor: ThemeManager.colors.tabBarBgColor }} /> */}
      </>
    );
  }
}

//******************************************************************************************/
const styles = StyleSheet.create({
  titleTex: {
    fontSize: 10,
    marginTop: 25,
    // bottom: 10,
    fontFamily: Fonts.dmMedium,
    textAlign: "center",
  },
  ViewStyle: {
    shadowColor: Platform.OS == "ios" ? "#404D61" : "#4825251A",
    shadowOffset: {
      width: 0,
      height: 0,
    },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 1,
    zIndex: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  requestBounceView: {
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.22,
    shadowRadius: 2.22,

    elevation: 3,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    paddingBottom: dimen(30),
    paddingTop: dimen(12),
  },
  ViewStyle1: {
    flexDirection: "row",
    justifyContent: "space-around",
    width: "100%",
    alignItems: "center",
    height: 65,
  },
  linearGradient: {
    height: 65,
    width: 65,
    borderRadius: 35,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "transparent",
  },
  HeaderStyle: {},

  viewMainContainer: {
    justifyContent: "center",
    alignItems: "center",
    // bottom: Platform.OS == "ios" ? -11 : -13,
  },
  titleTextTwo: {
    fontSize: 10,
    fontFamily: Fonts.dmBold,
    marginTop: 25,
    fontWeight: "400",
  },
});

const CustomTabBar = connect(null)(CustomTabBarVpn);

export { CustomTabBarVpn };