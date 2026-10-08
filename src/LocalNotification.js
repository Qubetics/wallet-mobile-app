import notifee, { AndroidImportance, AndroidVisibility, EventType } from '@notifee/react-native';
import { Platform } from 'react-native';
import { PERMISSIONS, request } from 'react-native-permissions';
import { getData } from './Utils/MethodsUtils';
import * as Constants from "./Constants";
import { Actions } from './navigation/RootNavigation';

let lastMessageId = 0
 const notificationState = {
  fromNotificationPress: false,
  skipPinOnce: false,
};
const showNotification = async (title, message, messageId) => {
  if (messageId != lastMessageId) {

    lastMessageId = messageId
    const channelId = await notifee.createChannel({
      id: messageId,
      name: 'Default Channel',
      importance: AndroidImportance.HIGH,
      visibility: AndroidVisibility.PUBLIC,
    });
    await notifee.displayNotification({
      title: title,
      body: message,
      android: {
        timestamp: new Date().getTime(),
        channelId: channelId,
        smallIcon: 'ic_stat_name',
        importance: AndroidImportance.HIGH,
        pressAction: {
          id: 'default',
        },
      },
    });
  }


}

const createNotificationChannel = async () => {
  if (Platform.OS == "ios") {
    await notifee.requestPermission()
  } else {
    await request(PERMISSIONS.ANDROID.POST_NOTIFICATIONS);
    await notifee.createChannel({
      id: 'default',
      name: 'Qubetics',
      vibration: true,
      badge: true,
      soundName: "default",
    });
  }
}

const registerNotifeeListeners = async ()=>{  
   notifee.onForegroundEvent(({ type, detail }) => {
    if (type === EventType.PRESS) {
      notificationState.fromNotificationPress = true;
      notificationState.skipPinOnce = true;
                  getData(Constants.PIN_LOCK).then((pinLock) => {
              const isLoggedIn = pinLock && pinLock != "null";
              isLoggedIn && Actions.currentScene != "Welcome" &&
                Actions.currentScene != "EnterPin" &&
                Actions.currentScene != "NotificationsTab" &&
                Actions.NotificationsTab({ themeSelected: 2 });
            });
    }
  });
}


export {notificationState, showNotification, createNotificationChannel, registerNotifeeListeners }
