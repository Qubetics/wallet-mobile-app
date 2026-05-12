import React, { useState } from "react";
import { BackHandler, ImageBackground } from "react-native";
import { EventRegister } from "react-native-event-listeners";
import { Actions } from '../../../navigation/RootNavigation';
import { useDispatch } from "react-redux";
import { LanguageManager } from "../../../../LanguageManager";
import { ThemeManager } from "../../../../ThemeManager";
import * as Constants from "../../../Constants";
import Singleton from "../../../Singleton";
import { Images } from "../../../theme";
import { heightDimen, widthDimen } from "../../../Utils";
import { consoleLogFunc, getData } from "../../../Utils/MethodsUtils";
import { AppAlert, HeaderMain } from "../../common";
import ChainAbstractionSwap from "./ChainAbstractionSwap";

const ChainAbstraction = (props) => {
  const [themeSelected, SetThemeSelected] = useState("");
  const [alertData, setAlertData] = useState({
    isShow: false,
    msg: "",
  });
  // const [selectedCoin, setSelectedCoin] = useState(props.selectedCoin);

  /******************************************************************************************/
  React.useEffect(() => {
    EventRegister.addEventListener("getThemeChanged", (data) => {
      SetThemeSelected(data);
    });
    BackHandler.addEventListener("hardwareBackPress", handleBackButtonClick);
    const focusListener = props.navigation.addListener('focus', () => {
      getData(Constants.DARK_MODE_STATUS).then(async (theme) => {
        SetThemeSelected(theme);
      });
      BackHandler.addEventListener("hardwareBackPress", handleBackButtonClick);
    });
    const blurListener = props.navigation.addListener('blur', () => {
      BackHandler.removeEventListener(
        "hardwareBackPress",
        handleBackButtonClick
      );
    });
    return () => {
      (typeof focusListener === 'function' ? focusListener() : focusListener?.remove?.());
      (typeof blurListener === 'function' ? blurListener() : blurListener?.remove?.());
    };
  }, []);

  /******************************************************************************************/
  const handleBackButtonClick = () => {
    consoleLogFunc("Backhandler Swap");
    Singleton.bottomBar?.navigateTab("WalletMain");
    // Actions.jump("WalletMain");
    Actions.pop();
    return true;
  };



  /******************************************************************************************/
  return (
      <ImageBackground
        source={ThemeManager.ImageIcons.mainBgImgNew}
        style={{ flex: 1, backgroundColor: ThemeManager.colors.mainBgNew }}
      >
      

        <ChainAbstractionSwap  navigation={props.navigation} />

        {alertData.isShow && (
          <AppAlert
            alertTxt={alertData.msg}
            hideAlertDialog={() => {
              setAlertData({ isShow: false, msg: "" });
            }}
          />
        )}

      </ImageBackground>
  );
};

export default ChainAbstraction;
