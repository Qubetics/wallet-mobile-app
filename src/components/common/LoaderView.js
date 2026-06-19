import React, { Component } from 'react';
import {
  ActivityIndicator,
  BackHandler,
  Dimensions,
  StyleSheet,
  View
} from 'react-native';
import { ThemeManager } from '../../../ThemeManager';
export { LoaderView };
class LoaderView extends Component {
  constructor(props) {
    super(props);
    this.state = {
    };
  }

  //******************************************************************************************/
  componentDidMount() {
    BackHandler.addEventListener('hardwareBackPress', this.backAction);
  }

  //******************************************************************************************/
  componentWillUnmount() {
    BackHandler?.removeEventListener('hardwareBackPress', this.backAction);
  }

  //******************************************************************************************/
  backAction = () => {
    return this.props.isLoading ? true : false;
  };

  //******************************************************************************************/
  render() {
    return (
      this.props.isLoading == true && (
        <View style={[styles.ViewStyle, this.props.customStyle]}>
          <View style={styles.ViewStyle2} />
          <View style={[styles.ViewStyle1, { marginBottom: this.props.isSwap ? Dimensions.get('window').height / 2.5 : 0 }]}>
            <ActivityIndicator size="large" color={ThemeManager.colors.primaryColor} />
            {/* <View style={{ height: '50%', width: '50%' }}>
              <LottieView source={ThemeManager.ImageIcons.loader} autoPlay loop />
            </View> */}
          </View>
        </View>
      )
    );
  }
}

//******************************************************************************************/
const styles = StyleSheet.create({
  ViewStyle2: {
    width: Dimensions.get('window').width,
    height: Dimensions.get('window').height,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
    position: 'absolute',
  },
  ViewStyle1: {
    width: Dimensions.get('window').width,
    height: Dimensions.get('window').height,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent', // 'rgba(52, 52, 52, 0.4)'
  },
  ViewStyle: {
    width: Dimensions.get('window').width,
    height: Dimensions.get('window').height,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'absolute',
    backgroundColor: 'rgba(52, 52, 52, 0.1)',
  },
});


