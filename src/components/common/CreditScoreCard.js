import { Dimensions, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import React from 'react'
import { LanguageManager } from '../../../LanguageManager';
import { ThemeManager } from '../../../ThemeManager';
import { dimen, widthDimen } from '../../Utils';
import fonts from '../../theme/Fonts';
import { Button } from './Button';
const { width: screenWidth } = Dimensions.get('window');

const CreditScoreCard = ({
    index,
    onPress,
    disabled = false,
    onPressBtn,

}) => {
    const { vpn, help } = LanguageManager;
    const { colors, ImageIcons } = ThemeManager;
    const cardMargin = widthDimen(7);
    const totalHorizontalMargin = widthDimen(34);
    const cardSpacing = cardMargin * 3;
    const cardWidth = (screenWidth - totalHorizontalMargin - cardSpacing) / 2;
  return (
    <TouchableOpacity style={[styles.card, {
        backgroundColor: colors.mnemonicsBg,
        width: cardWidth,
        marginLeft: index % 2 === 0 ? 0 : cardMargin,
        marginRight: index % 2 === 0 ? cardMargin : 0,
    }]}
    onPress={onPress}
    disabled={disabled}
    >

        <Image source={ImageIcons.creditScore} style={styles.icon} />
        <View style={styles.contentContainer}>

            <Text style={[styles.creditsText, {
                color: colors.blackWhiteText,
                fontFamily: fonts.dmMedium,
            }]}> {'100 Credits'}</Text>
            <Text numberOfLines={1} style={[styles.priceText, {
                color: colors.blackWhiteText,
                fontFamily: fonts.dmMedium,
            }]}>$50200</Text>
        </View>

        <View style={styles.buttonContainer}>
            <Button buttontext={vpn.Purchase} onPress={onPressBtn} myStyle={styles.button} />
        </View>

    </TouchableOpacity>
  )
}

export default CreditScoreCard

const styles = StyleSheet.create({
    card: {
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginHorizontal: dimen(10),
        paddingVertical: dimen(20),
        paddingHorizontal: dimen(16),
        borderRadius: dimen(14),
        // minHeight: dimen(200),
    },
    icon: {
        width: dimen(44),
        height: dimen(44),
    },
    contentContainer: {
        flex: 1, 
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: dimen(8),
    },
    creditsText: {
        fontSize: dimen(18),
        marginTop: dimen(7),
        textAlign: 'center',
        numberOfLines: 2,
    },
    priceText: {
        fontSize: dimen(34),
        textAlign: 'center',
        numberOfLines: 1,
        // adjustsFontSizeToFit: true, 
        // minimumFontScale: 0.7,
    },
    buttonContainer: {
        width: '100%', 
        marginTop: dimen(8)
    },
    button: {
        height: dimen(40)
    }
})