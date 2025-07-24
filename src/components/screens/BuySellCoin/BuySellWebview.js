import { View, Text, ImageBackground } from "react-native";
import React, { useEffect, useState } from "react";
import { HeaderMain, LoaderView } from "../../common";
import { widthDimen } from "../../../Utils";
import WebView from "react-native-webview";
import { ThemeManager } from "../../../../ThemeManager";
import { MERCURYO_REDIRECT_URL } from "../../../EndPoint";
import { useDispatch } from "react-redux";
import { onOffRampCreateOrder } from "../../../Redux/Actions";
import { Actions } from "react-native-router-flux";
import Singleton from "../../../Singleton";
import { consoleLogFunc } from "../../../Utils/MethodsUtils";
let isMercuryoApiDelivered = false
const BuySellWebview = (props) => {
  const dispatch = useDispatch()
  const [loading, setLoading] = useState(false);
  useEffect(() => {
    isMercuryoApiDelivered = false

    // setTimeout(() => {
    //   consoleLogFunc("STSRT");

    //   dispatch(onOffRampCreateOrder(props?.apiReq))
    //     .then(res => {
    //       consoleLogFunc("onNavigationStateChange res======", res);
    //       setLoading(false);
    //       Singleton.getInstance().showToast?.show("Transaction executed successfully", 2000);

    //       Actions.pop()
    //     })
    //     .catch(err => {
    //       Singleton.getInstance().showToast?.show("Transaction failed", 2000);

    //       setLoading(false);
    //     })
    // }, 10000);
  }, [])

  return (
    <ImageBackground
      source={ThemeManager.ImageIcons.mainBgImgNew}
      style={{ flex: 1, backgroundColor: ThemeManager.colors.mainBgNew }}
    >
      <HeaderMain
        BackButtonText={props?.providerName}
        customStyle={{ paddingHorizontal: widthDimen(24) }}
        showBackBtn={false}
        customMainStyle={{
          borderBottomEndRadius: 0,
          borderBottomStartRadius: 0,
        }}
      />
      <WebView
        style={{ flex: 1 }}
        source={{ uri: props?.redirectLink }}
        onMessage={(event) => {
          consoleLogFunc("onMessage event ======", event);
          const onMessageData = event.nativeEvent.data;
          consoleLogFunc("onMessage onMessageData 2222======", onMessageData);
        }}
        onNavigationStateChange={(navState) => {
          let successBuyUrl = `${MERCURYO_REDIRECT_URL}`;
          consoleLogFunc("onNavigationStateChange ======", navState.url, successBuyUrl, isMercuryoApiDelivered);

          if (navState.url == successBuyUrl && !isMercuryoApiDelivered) {
            setLoading(true);
            isMercuryoApiDelivered = true
            dispatch(onOffRampCreateOrder(props?.apiReq))
              .then(res => {
                consoleLogFunc("onNavigationStateChange res======", res);
                setLoading(false);
                Singleton.getInstance().showToast?.show("Transaction executed successfully", 2000);
                setTimeout(() => {
                  props.onSuccess()
                  Actions.pop()
                }, 1000)

              })
              .catch(err => {
                Singleton.getInstance().showToast?.show("Transaction failed", 2000);

                setLoading(false);
              })

          }
        }}
      />
      {loading == true && <LoaderView isLoading={loading} />}
    </ImageBackground>
  );
};

export default BuySellWebview;
