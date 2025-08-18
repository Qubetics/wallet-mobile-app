import React, { useEffect, useRef, useState } from "react";
import {
  AppState,
  Dimensions,
  Platform,
  StatusBar,
  View
} from "react-native";
import { hasNotch } from "react-native-device-info";
import { EventRegister } from "react-native-event-listeners";
import { Actions } from "react-native-router-flux";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ThemeManager } from "../../../ThemeManager";
import * as Constants from "../../Constants";
import Singleton from "../../Singleton";
import { consoleLogFunc, getData } from "../../Utils/MethodsUtils";

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
      EventRegister?.removeEventListener(turnOffListener);
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
          paddingBottom: Platform.OS === 'android' ? insets.bottom : 0,
          backgroundColor:"#121117",
        }}
      >
        {props.children}
      </View>

    </>
  );
}

export { AppView };
