import styles from "./AddCustomDnsStyle";
import { Dimensions, ImageBackground, Text, View } from 'react-native'
import { useState } from 'react'
import { HeaderMain } from "../../common";
import { LanguageManager } from "../../../../LanguageManager";
import { dimen } from "../../../Utils";
import LabelTextInput from "../../common/LabelTextInput";
import TwoButtonFooter from "../../common/TwoRowButtons";
import { ThemeManager } from "../../../../ThemeManager";
import { Actions } from '../../../navigation/RootNavigation';
import images from "../../../theme/Images";
import RadioButtonOption from "../../common/RadioButtonOption";
import { consoleLogFunc } from "../../../Utils/MethodsUtils";
const { width: screenWidth } = Dimensions.get('window');
const AddCustomDns = () => {
    const { vpn, help, placeholderAndLabels } = LanguageManager;
    const { colors, ImageIcons } = ThemeManager;
    const [protocol,setProtocol] = useState(1)
    return (
        <ImageBackground
            source={ThemeManager.ImageIcons.mainBgImgNew}
            style={{ flex: 1, backgroundColor: ThemeManager.colors.mainBgNew }}
        >
            <View style={[styles.mainView]}>
                <HeaderMain
                    BackButtonText={vpn.addCustomDNS}
                />
                <View style={{
                    marginHorizontal: dimen(24),
                }}>
                    <LabelTextInput
                        label={vpn.dnsName}
                        placeholder={placeholderAndLabels.enterNamehere}
                        value={''}
                        onChangeText={(value) => { }}
                        customViewStyle={{
                            marginTop: 0
                        }}
                    />
                    <LabelTextInput
                        label={vpn.preferredIpAddress}
                        placeholder={vpn.enterIpAddressHere}
                        value={''}
                        onChangeText={(value) => { }}
                    />
                    <LabelTextInput
                        label={vpn.alternateIpAddress}
                        placeholder={vpn.enterIpAddressHere}
                        value={''}
                        onChangeText={(value) => { }}
                    />
                    <Text style={{
                        color: colors.blackWhiteText,
                        ...styles.radioTextStyle,
                    }}>{vpn.internetProtocol}</Text>
                    <View style={{
               ...styles.radioBtnContainer
                    }}>
                        <RadioButtonOption
                            image={protocol ? images.radio_enable : images.radio_disable}
                            onpress={() => {
                                setProtocol(1)

                            }}
                            text={vpn.ipv4}
                            viewStyle={{
                                marginRight:dimen(60)
                            }}
                        />
                        <RadioButtonOption
                            image={protocol ? images.radio_disable : images.radio_enable}
                            onpress={() => {
                                setProtocol(0)
                            }}
                            text={vpn.ipv}
                        />

                     
                    </View>
                </View>
                <View style={{
                    ...styles.buttonContainer
                }}>
                    <View style={[styles.btnViewModal]}>
                        <TwoButtonFooter
                            onLeftPress={() => {
                                consoleLogFunc('Cancel pressed'),
                                Actions.VpnSettings()
                            }}
                            onRightPress={() => {
                                consoleLogFunc('Continue pressed');
                                Actions.RpcDetails();
                            }}
                            leftLabel={LanguageManager.commonText.clear}
                            rightLabel={LanguageManager.commonText.save}
                        />
                    </View>

                </View>
            </View>
        </ImageBackground>
    )
}

export default AddCustomDns
