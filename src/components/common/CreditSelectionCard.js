import { Dimensions, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import React from 'react'
import { LanguageManager } from '../../../LanguageManager';
import { ThemeManager } from '../../../ThemeManager';
import { dimen, widthDimen } from '../../Utils';
import fonts from '../../theme/Fonts';
import LinearGradient from 'react-native-linear-gradient';

const { width: screenWidth } = Dimensions.get('window');

const CreditSelectionCard = ({
    index,
    onPress,
    disabled = false,
    isSelected = false,
    credits ,
    price ,
}) => {
    const { vpn, help } = LanguageManager;
    const { colors, ImageIcons } = ThemeManager;
    const cardMargin = widthDimen(7);
    const totalHorizontalMargin = widthDimen(34);
    const cardSpacing = cardMargin * 3;
    const cardWidth = (screenWidth - totalHorizontalMargin - cardSpacing) / 2;

    return (
        <View style={{
            width: cardWidth,
            marginLeft: index % 2 === 0 ? 0 : cardMargin,
            marginRight: index % 2 === 0 ? cardMargin : 0,
            marginBottom: dimen(16),
        }}>
            <LinearGradient
                colors={isSelected ? colors.linearBorder : [colors.mnemonicsBg, colors.mnemonicsBg,colors.mnemonicsBg]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={[styles.gradientBorder, {
                    // minHeight: dimen(158), 
                }]}
            >
                <TouchableOpacity 
                activeOpacity={1}
                    style={[
                        styles.card,
                        {
                            backgroundColor: colors.mnemonicsBg,
                            width: cardWidth - dimen(4), 
                            // minHeight: dimen(154), 
                        }
                    ]}
                    onPress={onPress}
                    disabled={disabled}
                >
                    <Image source={ImageIcons.creditScore} style={styles.icon} />
                    <View style={styles.contentContainer}>
                        <Text numberOfLines={1} style={[styles.creditsText, {
                            color: colors.blackWhiteText,
                            fontFamily: fonts.dmMedium,
                        }]}>{credits}</Text> 
                                         
                        <Text numberOfLines={1} style={[styles.priceText, {
                            color: colors.blackWhiteText,
                            fontFamily: fonts.dmMedium,
                        }]}>{price}</Text>
                    </View>
                </TouchableOpacity>
            </LinearGradient>
        </View>
    )
}

export default CreditSelectionCard

const styles = StyleSheet.create({
    gradientBorder: {
        borderRadius: dimen(14),
        justifyContent: "center",
        alignItems: "center",
        padding: dimen(2),
    },
    card: {
        justifyContent: 'space-between', 
        alignItems: 'center',
        paddingVertical: dimen(24),
        paddingHorizontal: dimen(16),
        borderRadius: dimen(14), 
    },
    contentContainer: {
        alignItems: 'center',
        flex: 1,
        justifyContent: 'center',
        paddingHorizontal: dimen(8), 
    },
    icon: {
        width: dimen(44),
        height: dimen(44),
    },
    creditsText: {
        fontSize: dimen(18), 
        marginTop: dimen(8),
        textAlign: 'center',
        flexShrink: 1,
    },
    priceText: {
        fontSize: dimen(34), 
        textAlign: 'center',
        marginTop: dimen(4),
    },
})