import { useEffect, useState } from 'react';
import {
  StyleSheet,
  View
} from 'react-native';
import { EventRegister } from 'react-native-event-listeners';
import { ThemeManager } from '../../../ThemeManager';
import * as Constants from '../../Constants';
import { getData } from '../../Utils/MethodsUtils';

export const Divider = props => {
  const [themeSelected, setThemeSelected] = useState();

  //******************************************************************************************/
  useEffect(() => {
    EventRegister.addEventListener('getThemeChanged', data => {
      setThemeSelected(data);
    });
    getData(Constants.DARK_MODE_STATUS).then(async theme => {
      setThemeSelected(theme);
    })
  }, []);

  /******************************************************************************************/
  return (

    <View style={[styles.dividerView, { backgroundColor: ThemeManager.colors.dividerColor }, props.customStyle]}>
    </View>

  );
};

/******************************************************************************************/
const styles = StyleSheet.create({

  dividerView: {
    height: 1,

  },

});
