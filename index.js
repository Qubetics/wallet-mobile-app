/**
 * @format
 */
/**
 * @format
 */
import 'react-native-get-random-values';
import 'whatwg-fetch';
import 'text-encoding-polyfill'
import 'react-native-url-polyfill/auto';
import messaging from '@react-native-firebase/messaging';
import './shim';
import '@react-native-anywhere/polyfill-base64';
import { AppRegistry, LogBox, Platform, Text, TextInput } from 'react-native';
import 'react-native-get-random-values';
import "@ethersproject/shims"
import { name as appName } from './app.json';
export const crypt = crypto;
import SplashScreen from 'react-native-splash-screen'
import 'react-native-randombytes';
import App from './src/App.js';

if (Text.defaultProps == null) {
  Text.defaultProps = {};
  Text.defaultProps.allowFontScaling = false;
}

if (TextInput.defaultProps == null) {
  TextInput.defaultProps = {};
  TextInput.defaultProps.allowFontScaling = false;
}

if (!messaging().isDeviceRegisteredForRemoteMessages) {
  messaging().registerDeviceForRemoteMessages();
}
messaging().setBackgroundMessageHandler(async remoteMessage => {
  try {
    console.log('Message handled in the background!', remoteMessage);
  } catch (error) {
    console.log(' Message handled error ', error);
  }
});
LogBox.ignoreAllLogs();
SplashScreen.hide();


AppRegistry.registerComponent(appName, () => App);