import React, { useEffect, useState } from 'react';
import { Image, StyleSheet, View } from 'react-native';
import { EventRegister } from 'react-native-event-listeners';
import { getDimensionPercentage } from "../../Utils";
import { Fonts } from '../../theme';
import colors from '../../theme/Colors';

const TabIconCustom = props => {
  const [themeSelected, setThemeSelected] = useState(0);

  /******************************************************************************************/
  useEffect(() => {
    EventRegister.addEventListener('getThemeChanged', data => {
      setThemeSelected(data);
    });
  }, [props]);

  /******************************************************************************************/
  return (
    <View style={[styles.viewMainContainer, props.marginView]}>
      <Image source={props.activeImg} style={[props.ImgSize, { resizeMode: 'contain', tintColor: props?.focused ? colors.White : colors.placeHolderText }]} />
    </View>
  );
};

/******************************************************************************************/
const styles = StyleSheet.create({
  viewMainContainer: {
    paddingHorizontal: 5,
    justifyContent: 'center',
    alignItems: 'center',
    // marginVertical: 0,
    // marginTop: DeviceInfo.hasNotch() ? 10 : 7,
    // bottom: Platform.OS == 'ios' ? -11 : -13,
  },
  titleText: {
    fontSize: getDimensionPercentage(12),
    fontFamily: Fonts.dmBold,

    // marginBottom: 18,
    // fontWeight: '400',
  },
});

export { TabIconCustom };
