import { useEffect, useState } from "react";
import {
  BackHandler,
  ImageBackground,
  View
} from "react-native";
import { EventRegister } from "react-native-event-listeners";
import { ActionConst, Actions } from '../../../navigation/RootNavigation';
import { connect } from "react-redux";
import { LanguageManager } from "../../../../LanguageManager";
import { ThemeManager } from "../../../../ThemeManager";
import * as Constants from "../../../Constants";
import Singleton from "../../../Singleton";
import images from "../../../theme/Images";
import { widthDimen } from "../../../Utils";
import { HeaderMain, LoaderView } from "../../common";
import VpnCard from "../../common/VpnCard";
import styles from "./FeeGranterStyle";

const dnsOptions = [
  {
    label: LanguageManager.vpn.noGranter,
  },
  {
    label: LanguageManager.vpn.defaultGranterAddress,
  },
];

const FeeGranter = (props) => {
  const { vpn } = LanguageManager;
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState(LanguageManager.vpn.noGranter);
  const [selectedIndex, setSelectedIndex] = useState(0);

  useEffect(() => {
    BackHandler.addEventListener("hardwareBackPress", handleBackButtonClick);
    const focusListener = props.navigation.addListener('focus', () => {
      BackHandler.addEventListener("hardwareBackPress", handleBackButtonClick);
    });
    const blurListener = props.navigation.addListener('blur', () => {
      BackHandler.removeEventListener(
        "hardwareBackPress",
        handleBackButtonClick
      );
    });

    EventRegister.addEventListener(Constants.DOWN_MODAL, () => {});
    return () => {
      focusListener();
      blurListener();
      BackHandler.removeEventListener(
        "hardwareBackPress",
        handleBackButtonClick
      );
    };
  }, []);

  const handleBackButtonClick = () => {
    Singleton.bottomBar?.navigateTab("WalletMain");
    Actions.Main({ type: ActionConst.RESET });
    return true;
  };

  return (
    <ImageBackground
      source={ThemeManager.ImageIcons.mainBgImgNew}
      style={{ flex: 1, backgroundColor: ThemeManager.colors.mainBgNew }}
    >
      <View style={[styles.mainView]}>
        <HeaderMain
          BackButtonText={vpn.setFeeGranter}
          customStyle={{ paddingHorizontal: widthDimen(24) }}
        />
        {/* **********************************Card View*************************************** */}
        <View style={{ marginHorizontal: widthDimen(24) }}>
          {dnsOptions.map(({ label, index }) => (
            <VpnCard
            isFeegranter
              onSelect={() => {
                setSelectedIndex(index)
                setSelected(label)}}
              selected={selected}
              label={label}
              checkIcon={selected == label? images.radio_enable:images.radio_disable }
            />
          ))}
        </View>
        <LoaderView isLoading={loading} />
      </View>
    </ImageBackground>
  );
};

export default connect(undefined, {})(FeeGranter);
