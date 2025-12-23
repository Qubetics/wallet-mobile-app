import React from 'react';
import {Image, StyleSheet, Text, TouchableOpacity, View} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import {ThemeManager} from '../../../ThemeManager';
import {dimen} from '../../Utils';
import fonts from '../../theme/Fonts';
import colors from '../../theme/Colors';
import Accordion from './Accordion';
import { bigNumberSafeMath, toFixedExp } from '../../Utils/MethodsUtils';

const cardWidth = dimen(382);
const cardHeight = dimen(75);
const CreditScoreCard = ({
  index,
  onPressBtn,
  item,
  disabled = false,
  expanded,
}) => {
  const {colors, ImageIcons} = ThemeManager;

  const price = toFixedExp(bigNumberSafeMath(item?.prices?.[0]?.quote_value, "/", 10 ** 18), 2);
  const denom = item?.prices?.[0]?.denom ?? '';
  const formattedDenom = denom.charAt(0).toUpperCase() + denom.slice(1);
  const hours = Number(item?.hours ?? 0);
  const daysValue =
    hours >= 24
      ? `${Math.floor(hours / 24)} Day${Math.floor(hours / 24) > 1 ? 's' : ''}`
      : `${hours} Hour${hours !== 1 ? 's' : ''}`;
  const countryNodes = item?.country !== null;
  const isOpen = expanded[item?.plan_id] ?? false;

  const planSelected = i => {
    onPressBtn(i);
  };

  // // --- existing formatter (keeps your logic) ---
  // const formatTics = (amount, decimals = 18) => {
  //   if (amount === undefined || amount === null) return '0';
  //   const s = amount.toString();
  //   const padded = s.padStart(decimals + 1, '0');
  //   const whole = padded.slice(0, -decimals);
  //   let fraction = padded.slice(-decimals).replace(/0+$/, '');
  //   // Remove leading zeros in whole part but keep single zero if required
  //   const wholeClean = whole.replace(/^0+(?=\d)/, '') || '0';
  //   return fraction ? `${wholeClean}.${fraction}` : wholeClean;
  // };

  // // --- convert to a short display when extremely tiny ---
  // const shortenIfNeeded = (valueStr, maxLeadingZeros = 6, sigDigits = 3) => {
  //   if (!valueStr) return valueStr;
  //   const s = valueStr.replace(/,/g, '').trim();
  //   if (!s.includes('.')) return s;

  //   const [whole, frac] = s.split('.');
  //   if (whole === '0') {
  //     const firstNonZero = frac.search(/[^0]/);
  //     if (firstNonZero === -1) return '0';
  //     if (firstNonZero > maxLeadingZeros) {
  //       const sig = frac.slice(firstNonZero, firstNonZero + sigDigits);
  //       const mantissa = sig.length > 1 ? `${sig[0]}.${sig.slice(1)}` : sig;
  //       const exponent = firstNonZero + 1;
  //       return `${mantissa}e-${exponent}`;
  //     }
  //   }
  //   return valueStr;
  // };

  // // --- compute a font size based on numeric magnitude (not only length) ---
  // const computeMagnitudeFont = valueStr => {
  //   const base = dimen(30);
  //   const min = dimen(12);
  //   const max = dimen(34);

  //   if (!valueStr) return base;
  //   const s = valueStr.replace(/,/g, '').trim();
  //   if (/[eE]/.test(s)) {
  //     // scientific notation -> don't use large fonts
  //     return Math.round(base * 0.95);
  //   }

  //   if (s.includes('.')) {
  //     const [whole, frac] = s.split('.');
  //     if (whole === '0') {
  //       const firstNonZero = frac.search(/[^0]/);
  //       const leadZeros = firstNonZero === -1 ? frac.length : firstNonZero;
  //       const shrink = Math.min(leadZeros * 1.6, base - min);
  //       return Math.max(min, Math.round(base - shrink));
  //     } else {
  //       const growth = Math.min(
  //         (whole.replace(/^0+/, '').length - 1) * 1.4,
  //         max - base,
  //       );
  //       return Math.min(max, Math.round(base + Math.max(0, growth)));
  //     }
  //   }

  //   // integer
  //   const whole = s.replace(/^0+/, '') || '0';
  //   if (whole === '0') return base;
  //   const growth = Math.min((whole.length - 1) * 1.6, max - base);
  //   return Math.min(max, Math.round(base + growth));
  // };

  // --- final computed display string and font size that also respects card width ---
  // const {displayValue, finalFontSize} = useMemo(() => {
  //   const formattedValue = formatTics(item?.quoteValue);
  //   const display = formattedValue; //shortenIfNeeded(formattedValue);

  //   // magnitude based font
  //   const magFont = computeMagnitudeFont(formattedValue);

  //   // Now clamp to available width so text never overflows the card.
  //   // Estimate char width factor — digits in your font roughly ~0.55-0.6 * fontSize
  //   const approxCharFactor = 0.58;
  //   const suffix = ' TICS';
  //   const fullText = `${display}${suffix}`;
  //   const charCount = fullText.length;

  //   // available width inside card (subtract padding & tiny margin)
  //   const availableWidth = Math.max(
  //     20,
  //     cardWidth - paddingHorizontal - dimen(6),
  //   );

  //   // compute largest font that fits: font <= availableWidth / (charCount * approxCharFactor)
  //   const fontFit = Math.floor(availableWidth / (charCount * approxCharFactor));

  //   // clamp fontFit to a reasonable range using the same min/max from computeMagnitudeFont
  //   const minFont = dimen(12);
  //   const maxFont = dimen(40); // allow a bit bigger if needed, but magFont will usually cap it
  //   const fitClamped = Math.max(minFont, Math.min(maxFont, fontFit || minFont));

  //   // choose the smaller of magnitude-desired and fitClamped (so it won't overflow)
  //   const chosen = Math.min(magFont, fitClamped);

  //   return {displayValue: display, finalFontSize: chosen};
  // }, [item?.quoteValue, cardWidth]);

  const CommonView = ({
    viewStyle,
    ImgSrc,
    leftText,
    bottomText,
    dropDownIcon,
  }) => {
    return (
      <View style={viewStyle}>
        <Image source={ImgSrc || ImageIcons.creditScore} style={styles.icon} />
        <View style={styles.contentContainer}>
          <Text
            style={[
              styles.creditsText,
              {color: colors.blackWhiteText, fontFamily: fonts.dmMedium},
            ]}>
            {leftText || `${toFixedExp(price, 18)} ${formattedDenom}`}
          </Text>
          <Text
            numberOfLines={1}
            allowFontScaling={false}
            style={[
              styles.priceText,
              {
                color: colors.blackWhiteText,
                fontFamily: fonts.dmMedium,
              },
            ]}>
            {bottomText || daysValue}
          </Text>
        </View>
        {dropDownIcon && (
          <Image
            source={ImageIcons.creditDropDown}
            style={styles.dropDownIcon}
          />
        )}
      </View>
    );
  };

  return (
    <>
      <TouchableOpacity
        onPress={() => planSelected(item)}
        disabled={disabled}
        style={{
          alignSelf: 'center',
          marginBottom: dimen(10),
        }}>
        {isOpen ? (
          <LinearGradient
            colors={['#85FFC4', '#5CC6FF', '#BC85FF']}
            style={[
              styles.gradientBorder,
              {width: cardWidth, borderRadius: dimen(14), height: cardHeight},
            ]}>
            <CommonView
              viewStyle={[styles.card, styles.LinearGradient]}
              dropDownIcon={isOpen}
            />
          </LinearGradient>
        ) : (
          <CommonView
            viewStyle={[styles.card, styles.subPlanCard]}
            dropDownIcon={isOpen}
          />
        )}
      </TouchableOpacity>
      <Accordion isExpanded={isOpen} viewKey={`plan_${item.plan_id}`}>
        {item?.countries?.map((country, index) => (
            <CommonView
              key={index}
              viewStyle={[styles.card, styles.subPlanCard]}
              ImgSrc={{uri: country?.flag_url}}
              leftText={country?.country}
              bottomText={country?.node_count}
              dropDownIcon={false}
            />
          ))}
      </Accordion>
    </>
  );
};

export default CreditScoreCard;

const styles = StyleSheet.create({
  gradientBorder: {
    padding: 2,
    borderRadius: dimen(14),
  },
  card: {
    flexDirection: 'row',
    paddingHorizontal: dimen(16),
    borderRadius: dimen(14),
  },
  icon: {
    width: dimen(46),
    height: dimen(46),
    borderRadius: dimen(23),
    resizeMode: 'contain',
  },
  subPlanCard: {
    backgroundColor: ThemeManager.colors.mnemonicsBg,
    width: cardWidth,
    borderColor: ThemeManager.colors.borderGrey,
    borderWidth: 1,
    height: cardHeight,
    alignItems: 'center',
    alignSelf: 'center',
  },
  LinearGradient: {
    width: cardWidth - 4,
    backgroundColor: ThemeManager.colors.mnemonicsBg,
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: dimen(20),
    flex: 1,
    borderRadius: dimen(14) - 2,
  },
  dropDownIcon: {
    width: dimen(13),
    height: dimen(7.5),
    resizeMode: 'contain',
  },
  contentContainer: {
    flex: 1,
    marginLeft: dimen(10),
    // justifyContent: 'center',
    // alignItems: 'center',
    // marginTop: 10,
  },
  creditsText: {
    fontSize: dimen(16),
    // textAlign: 'center',
  },
  priceText: {
    fontSize: dimen(14), // default fallback; actual used font is set inline
    // textAlign: 'center',
    color: colors.placeHolderText,
  },
});
