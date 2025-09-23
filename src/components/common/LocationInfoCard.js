import React from 'react';
import {Image, StyleSheet, Text, TouchableOpacity, View} from 'react-native';
import {ThemeManager} from '../../../ThemeManager';
import {Fonts} from '../../theme';
import {dimen, widthDimen} from '../../Utils';

const LocationInfoCard = ({
  icon,
  location,
  ip,
  rightImg,
  arrowStyle,
  tintColor,
  container,
  isConnectedd,
  onPress,
  plans,
}) => {
  console.log('asdasdasdasdasdasdasdasd', plans?.length);
  const truncateMiddle = (text = '', startChars = 8, endChars = 6) => {
    if (!text || text.length <= startChars + endChars) return text;
    return `${text.slice(0, startChars)}...${text.slice(-endChars)}`;
  };

  return (
    <View style={[styles.container, container]}>
      {/* Location Info */}
      <View
        style={[
          styles.infoCard,
          {backgroundColor: ThemeManager.colors.mnemonicsBg},
        ]}>
        <View style={styles.infoRow}>
          {icon && (
            <Image
              source={icon} // globe icon
              style={styles.icon}
            />
          )}
          <View style={styles.locationText}>
            {location && (
              <Text
                numberOfLines={1}
                style={[
                  styles.location,
                  {color: ThemeManager.colors.headersTextColor},
                ]}>
                {location}
              </Text>
            )}
            <Text
              numberOfLines={1}
              style={[
                styles.statusLabel,
                {color: ThemeManager.colors.legalGreyColor},
              ]}>
              {ip}
            </Text>
          </View>
          {rightImg && (
            <TouchableOpacity
              onPress={() => {
                if (plans?.length <= 0) {
                } else {
                  onPress();
                }
              }}
              style={[
                styles.button,
                {
                  backgroundColor: isConnectedd
                    ? ThemeManager.colors.blurGreen
                    : ThemeManager.colors.settingIconsBg,
                },
              ]}
              activeOpacity={0.8}>
              {/* <Image
                source={rightImg} // globe icon
                style={[
                  styles.arrowStyle,
                  arrowStyle,
                  { tintColor: tintColor },
                ]}
              /> */}

              <Text
                numberOfLines={1}
                style={[
                  styles.connectedText,
                  {
                    color:
                      plans?.length <= 0
                        ? 'red'
                        : isConnectedd
                        ? ThemeManager.colors.darkGreen
                        : ThemeManager.colors.legalGreyColor,
                  },
                ]}>
                {!plans ? "Connect" : plans?.length <= 0
                  ? '  Offline  '
                  : isConnectedd
                  ? 'Connected'
                  : 'Connect'}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );
};

export default LocationInfoCard;

const styles = StyleSheet.create({
  statusLabel: {
    fontSize: dimen(16),
    fontFamily: Fonts.dmRegular,
  },
  infoCard: {
    padding: dimen(16),
    borderRadius: 14,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  icon: {
    width: dimen(40),
    height: dimen(40),
    marginRight: widthDimen(10),
  },
  locationText: {
    flex: 1,
  },
  location: {
    fontSize: dimen(14),
    fontFamily: Fonts.dmMedium,
  },
  arrowStyle: {
    width: dimen(15),
    height: dimen(15),
    resizeMode: 'contain',
  },
  button: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    marginLeft: 20,
  },
  connectedText: {
    fontSize: dimen(14),
    fontFamily: Fonts.dmMedium,
  },
});
