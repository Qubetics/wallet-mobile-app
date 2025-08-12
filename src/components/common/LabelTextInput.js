import { StyleSheet, Text, View } from 'react-native'
import React from 'react'
import { ThemeManager } from '../../../ThemeManager'
import { InputCustom } from './InputCustom'
import { dimen } from '../../Utils'
import fonts from '../../theme/Fonts'

const LabelTextInput = ({
    label,
    placeholder,
    value,
    onChangeText,
    customViewStyle = {},
    isEnabled
}) => {
  return (
    <View style={{marginTop:dimen(17),...customViewStyle }}>
    <Text allowFontScaling={false} style={[styles.txtTitle, { color: ThemeManager.colors.blackWhiteText }]}>{label}</Text>
              <InputCustom
                placeHolder={placeholder}
                placeholderTextColor={ThemeManager.colors.darkLighttext}
                maxLength={15}
                onChangeText={onChangeText}
                value={value}
                editable={isEnabled}
                customInputStyle={{ borderWidth: 1, borderColor: "red" }}
              />
            </View>
  )
}

export default LabelTextInput

const styles = StyleSheet.create({
    txtTitle:{
        marginBottom:dimen(10),
        fontSize: dimen(14),
        fontFamily:fonts.dmMedium,
    }
})