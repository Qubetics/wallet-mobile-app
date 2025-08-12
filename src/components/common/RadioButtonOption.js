import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import React from 'react'
import fonts from '../../theme/Fonts'
import { dimen } from '../../Utils'
import { ThemeManager } from '../../../ThemeManager'

const RadioButtonOption = ({
    image,
    onpress,
    text,
    viewStyle={}
}) => {
    return (
        <View style={{
            flexDirection: "row",
            alignItems: "center",
            ...viewStyle
        }}>
            <TouchableOpacity 
            onPress={onpress}
            style={{
                flexDirection: "row",
                marginRight:dimen(8)
            }}>
                <Image resizeMode="contain" style={{
                    width:dimen(18),
                    height:dimen(18)
                }} source={image} />
            </TouchableOpacity>
            <Text style={{
                color: ThemeManager.colors.legalGreyColor,
                fontSize: dimen(16),
                fontFamily: fonts.dmRegular
            }}>{text}</Text>
        </View>
    )
}

export default RadioButtonOption

const styles = StyleSheet.create({})