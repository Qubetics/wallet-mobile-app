import { StyleSheet, View } from 'react-native';
import { LanguageManager } from '../../../LanguageManager';
import { dimen, widthDimen } from '../../Utils';
import { ThemeManager } from '../../../ThemeManager';
import { Button } from './Button';

const TwoButtonFooter = ({
    leftLabel = LanguageManager.sendTrx.Cancel,
    rightLabel = LanguageManager.pins.Continue,
    onLeftPress = () => { },
    onRightPress = () => { },
    disableRight = false,
    rightButtonStyle = {},
    containerStyle = {},
}) => {
    return (
        <View style={[{ flexDirection: 'row', justifyContent: 'center' }, containerStyle]}>
            <View style={{ marginRight: dimen(8) }}>
                <Button
                    buttontext={leftLabel}
                    onPress={onLeftPress}
                    myStyle={{ width: widthDimen(182), alignItems: 'center' }}
                    viewStyle={{
                        backgroundColor: ThemeManager.colors.mnemonicsBg,
                        ...styles.leftButtonStyle,
                    }}
                />
            </View>
            <View style={{ marginLeft: dimen(8) }}>
                <Button
                    buttontext={rightLabel}
                    disabled={disableRight}
                    onPress={onRightPress}
                    myStyle={{ width: widthDimen(182), alignItems: 'center' }}
                />
            </View>
        </View>
    );
};

export default TwoButtonFooter;

const styles = StyleSheet.create({
    leftButtonStyle: {
        width: "99%",
        height: "96%",
        alignItems: "center",
        justifyContent: "center",
        borderRadius: dimen(14),
    }
})
