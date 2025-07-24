import React, { useEffect, useRef, useState } from "react";
import {
  Alert,
  AppState,
  Dimensions,
  Platform,
  StatusBar,
  View,
} from "react-native";
import { EventRegister } from "react-native-event-listeners";
import { Actions } from "react-native-router-flux";
import { ThemeManager } from "../../../ThemeManager";
import * as Constants from "../../Constants";
import Singleton from "../../Singleton";
import { consoleLogFunc, getData } from "../../Utils/MethodsUtils";
import { SafeAreaView } from "react-native-safe-area-context";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { hasDynamicIsland, hasNotch } from "react-native-device-info";

function AppView(props) {
  const { width, height } = Dimensions.get("window");
  consoleLogFunc("height--SCREEN--", height);
  const insets = useSafeAreaInsets();
  const [screen, setscreen] = useState("");
  const [themeSelected, setThemeSelected] = useState(1);
  const [time, setTime] = useState(0);

  const accessTokenRef = useRef(null);
  const timeoutRef = useRef(null);

  /******************************************************************************************/
  useEffect(() => {
    EventRegister.addEventListener("fromscreen", (data) => {
      setscreen(data);
    });
    EventRegister.addEventListener("theme", (data) => {
      getData(Constants.PIN_LOCK).then((pin) => {
        getData(Constants.DARK_MODE_STATUS).then(async (theme) => {
          // consoleLogFunc("RES>>>>>>>", theme);

          setThemeSelected(theme);
        });
        // consoleLogFunc('chk data::::::theme', data);
      });
    });
    getData(Constants.ACCESS_TOKEN).then((token) => {
      if (!!token) {
        accessTokenRef.current = token;
      }
    });
  }, [screen]);

  useEffect(() => {
    const turnOffListener = EventRegister.addEventListener(
      "turnOffDapp",
      () => {
        const timeout = Singleton.getInstance().dappDisconnectTimeout || 0;
        setTime(timeout);
        clearTimeout(timeoutRef.current);
        // consoleLogFunc('here::::2')
        lastTouchTime(timeout);
      }
    );

    return () => {
      EventRegister.removeEventListener(turnOffListener);
    };
  }, []);

  useEffect(() => {
    const timeout = Singleton.getInstance().dappDisconnectTimeout || 0;
    setTime(timeout);
  }, []);

  const lastTouchTime = (customTime) => {
    const currentTime = customTime !== undefined ? customTime : time;
    if (currentTime > 0 && accessTokenRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(async () => {
        setTimeout(() => {
          if (
            Actions.currentScene != "EnterPin" &&
            Actions.currentScene != "Welcome" &&
            AppState.currentState == "active"
          ) {
            EventRegister.emit(Constants.DOWN_MODAL, "yes");
            Actions.EnterPin();
          }
        }, 800);
      }, currentTime);
    }
  };

  console.log("StatusBar?.currentHeight", !hasNotch());
  return (
    <>
      <StatusBar
        backgroundColor="transparent"
        barStyle={
          ThemeManager.colors.mode == "light" ? "dark-content" : "light-content"
        }
        translucent={true}
      />

      <View
        onTouchStart={() => {
          clearTimeout(timeoutRef.current);
          lastTouchTime();
        }}
        style={{
          flex: 1,
          backgroundColor:
            themeSelected == 1 ? "#121117" : "rgba(244, 245, 247, 1)",
        }}
      >
        {props.children}
      </View>
      {Platform.OS == "android" ? (
        <SafeAreaView
          style={{
            paddingBottom:
              height <= 840 ? -insets.bottom : -(insets.bottom - 10),
          }}
        />
      ) : null}
    </>
  );
}

export { AppView };
