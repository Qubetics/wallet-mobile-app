import { useEffect, useState } from 'react';
import { StyleSheet, TouchableOpacity } from 'react-native';
import { EventRegister } from 'react-native-event-listeners';
import * as Constants from '../../Constants';
import { Colors, Fonts } from '../../theme/';
import { consoleLogFunc } from '../../Utils/MethodsUtils';
import { AppAlert } from './AppAlert';

const ButtonNew = props => {
  const [AlertDialog, showAlertDialog] = useState(false);
  const [alertTxt, setAlertText] = useState('');

  /******************************************************************************************/
  useEffect(() => {
    EventRegister.addEventListener(Constants.DOWN_MODAL, () => {
      showAlertDialog(false);
    });
  }, []);

  /******************************************************************************************/
  return (
    <>
      <TouchableOpacity
        activeOpacity={0.9}
        disabled={props.disabled}
        style={[styles.buttonStyle, props.style]}
        onPress={() => {
          consoleLogFunc('global.isConnected::::', global.isConnected);
          // if ((global.isConnected || props.isNeedToClose) && props.onPress != undefined) { //isNeedToClose for no internet connection
            props.onPress();
          // } else {
          //   setAlertText(Constants.NO_NETWORK);
          //   showAlertDialog(true);
          // }
        }}>
        {props.children}
      </TouchableOpacity>

      <AppAlert
        visible={AlertDialog}
        alertTxt={alertTxt}
        hideAlertDialog={() => { showAlertDialog(false) }}
      />
    </>
  );
};

/******************************************************************************************/
const styles = StyleSheet.create({
  buttonStyle: {
  },
  viewStyle: {
    flexDirection: 'column',
    paddingLeft: 29,
  },
  btnTextWrapStyle: {
    alignItems: 'center',
    marginVertical: 8,
  },
  textStyle: {
    fontFamily: Fonts.dmRegular,
    color: Colors.White,
    fontSize: 10,
    marginTop: 5,
  },
  textStyle1: {
    fontFamily: Fonts.dmMedium,
    color: Colors.themeColor,
    fontSize: 14,
  },
});

export { ButtonNew };
