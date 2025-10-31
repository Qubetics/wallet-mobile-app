import React, { Component } from 'react';
import {
    Image,
    TouchableOpacity,
    Platform,
    StyleSheet,
    Text,
    View,
    TouchableWithoutFeedback,
    Linking,
} from 'react-native';
import { ThemeManager } from '../../../../ThemeManager';
import { Fonts, Images } from '../../../theme';
import { AppAlert, Button, FilterList, GradientBorderView, Header, HeaderMain } from '../../common';
import FastImage from 'react-native-fast-image';
import DatePicker from 'react-native-date-picker';
import { EventRegister } from 'react-native-event-listeners';
import * as Constants from '../../../Constants';
import moment from 'moment';
import Singleton from '../../../Singleton';
import { Actions } from 'react-native-router-flux';
import { LanguageManager } from '../../../../LanguageManager';
import { consoleLogFunc, getData } from '../../../Utils/MethodsUtils';
import { dimen, heightDimen, widthDimen } from '../../../Utils';
import { BlurView } from '@react-native-community/blur';
import { width } from '../../../resizeHelper';
import images from '../../../theme/Images';
import Clipboard from '@react-native-clipboard/clipboard';


class TransactionDetail extends Component {
    constructor(props) {
        super(props);
        this.state = {

        };
    }
    /******************************************************************************************/
    render() {
        const { item, onClose, onShowAbstractionStatus } = this.props ?? {}
        const { detailTrx, merchantCard, walletMain, referral } = LanguageManager;
        return (
            <View
                style={{ flex: 1, justifyContent: "flex-end", }}>
                {/* <BlurView style={StyleSheet.absoluteFill} blurType="dark" blurAmount={1} reducedTransparencyFallbackColor="white" /> */}

                <TouchableOpacity
                    style={{ flex: 1 }}
                    activeOpacity={1}
                    onPress={() => {
                        this.props.onClose();
                    }} />

                <View style={{ paddingHorizontal: 20, backgroundColor: ThemeManager.colors.mnemonicsBg, borderTopEndRadius: 20, borderTopStartRadius: 20 }}>
                    {/* <HeaderMain BackButtonText={detailTrx.applyFilters} /> */}
                    <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", height: 60 }}>
                        <Text
                            allowFontScaling={false}
                            style={[
                                styles.headerTitle,
                                { color: ThemeManager.colors.blackWhiteText },]}
                        >
                            {detailTrx.transactionDetails}
                        </Text>
                    </View>


                    {/* ----------------------------------------------------------------------- */}
                    {/* Transaction hash view */}
                    <View style={{
                        backgroundColor: ThemeManager.colors.mainBgNew,
                        padding: widthDimen(20),
                        borderRadius: widthDimen(20)
                    }}>
                        <Text style={styles.tokenAmount} >Intent Transaction Hash</Text>
                        <View style={{
                            flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
                            paddingTop: heightDimen(15)
                        }}>
                            <Text style={styles.tokenLabel}>{item?.to_adrs ?? ''}</Text>

                            <TouchableOpacity onPress={() => {
                                Clipboard.setString(item?.to_adrs ?? '');
                                this.setState({
                                    showAlertDialog: true,
                                    alertTxt: LanguageManager.alertMessages.copiedToClipboard,
                                });
                            }}>
                                <Image
                                    source={images.copy_clipboard}
                                    style={{
                                        alignSelf: 'center',
                                        height: 20,
                                        width: 20,
                                        resizeMode: 'contain',
                                        tintColor: ThemeManager.colors.blackWhiteText,
                                    }}
                                />
                            </TouchableOpacity>
                        </View>

                    </View>

                    {/* ----------------------------------------------------------------------- */}
                    {/* Transaction status view */}
                    <View style={{
                        backgroundColor: ThemeManager.colors.mainBgNew,
                        marginTop: heightDimen(20),
                        padding: widthDimen(15),
                        borderRadius: widthDimen(20),
                    }}>

                        <View style={{ ...styles.rowView, paddingTop: heightDimen(0) }}>
                            <Text style={{ ...styles.tokenAmount, color: ThemeManager.colors.legalGreyColor }} >Status</Text>
                            <Text
                                style={[
                                    styles.transStatusStyle,
                                    {
                                        textAlign: 'center',
                                        marginTop: 10,
                                        color: Singleton.getInstance().getStatusColor(item),
                                    },
                                ]}>
                                {Singleton.getInstance().getStatus(item)}
                            </Text>
                        </View>

                        <View style={styles.rowView}>
                            <Text style={{ ...styles.tokenAmount, color: ThemeManager.colors.legalGreyColor }} >Time Stamp</Text>
                            <Text style={styles.tokenLabel}>{moment(item.created_at).format('ll')} |{' '}
                                {moment(item.created_at).format('LT')}</Text>
                        </View>

                        <View style={styles.rowView}>
                            <Text style={{ ...styles.tokenAmount, color: ThemeManager.colors.legalGreyColor }} >Transaction Fees</Text>
                            <Text style={styles.tokenLabel}>{'50 TICS'}</Text>
                        </View>

                    </View>

                    <View style={{
                        marginTop: 20, justifyContent: "space-between", marginBottom: 40, flexDirection: "row",
                        alignItems: "center",
                    }}>
                        <TouchableOpacity onPress={() => {
                            onClose()
                        }}>

                            <GradientBorderView
                                gradientStyle={{
                                    height: widthDimen(50),
                                    width: widthDimen(180),
                                }}
                                mainStyle={{
                                    alignItems: "center",
                                    justifyContent: "center",
                                }}
                            >
                                <Text
                                    style={[
                                        // styles.walletNameIcon,
                                        { color: ThemeManager.colors.blackWhiteText },
                                    ]}
                                >
                                    {
                                        LanguageManager.walletMain.close
                                    }
                                </Text>
                            </GradientBorderView>
                        </TouchableOpacity>

                        <Button
                            onPress={() => {
                                console.log('item---address', item);
                                // if (item.type.toLowerCase() == 'cross_chain' && Singleton.getInstance().getStatus(item)?.toLowerCase() != 'failed') {
                                //   return (Actions.currentScene != 'DetailCrossChain' && Actions.DetailCrossChain({ item: item }));
                                // } else
                                if (item.type.toLowerCase() == 'chain_abstraction') {
                                    onShowAbstractionStatus(item);
                                    return;
                                }

                                if (item.coin_family == 1) {
                                    return Linking.openURL('https://bscscan.com/tx/' + item.tx_id);
                                } else if (item.coin_family == 2) {
                                    return Linking.openURL('https://etherscan.io/tx/' + item.tx_id);
                                } else if (item.coin_family == 3) {
                                    return Linking.openURL(
                                        'https://live.blockcypher.com/btc/tx/' + item.tx_id,
                                    );
                                } else if (item.coin_family == 4) {
                                    return Linking.openURL('https://polygonscan.com/tx/' + item.tx_id);
                                } else if (item.coin_family == 5) {
                                    return Linking.openURL('https://solscan.io/tx/' + item.tx_id);
                                } else if (item.coin_family == 6) {
                                    return Linking.openURL(
                                        'https://tronscan.org/#/transaction/' + item.tx_id,
                                    );
                                } else if (item.coin_family == 7) {
                                    return Linking.openURL(
                                        'https://testnet-v2.qubetics.work/tx/' + item.tx_id,
                                    );
                                    // return Linking.openURL("https://ticsscan.com/tx/" + item.tx_id);
                                }
                            }}
                            buttontext={merchantCard.explorer}
                            customStyle={{ width: widthDimen(180), }}
                        />
                    </View>


                </View>





                {/* /****************************************************************************************** */}
                {this.state.showAlertDialog && (
                    <AppAlert
                        alertTxt={this.state.alertTxt}
                        hideAlertDialog={() => {
                            this.setState({ showAlertDialog: false });
                        }}
                    />
                )}
            </View>
        );
    }
}
export default TransactionDetail;
const styles = StyleSheet.create({
    rowView: {
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
        paddingTop: heightDimen(10)
    },
    tokenAmount: {
        color: ThemeManager.colors.legalGreyColor,
        fontSize: dimen(14),
        fontFamily: Fonts.dmMedium,
    },
    tokenLabel: {
        color: ThemeManager.colors.blackText,
        fontSize: dimen(14),
        fontFamily: Fonts.dmRegular,
        // paddingTop: heightDimen(15)
    },
    ViewStyle2: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 15,
        borderWidth: 1,
        paddingHorizontal: 10,
        height: 55,
        alignItems: 'center',
        borderRadius: 15,
    },
    imgStyle: {
        width: 10,
        height: 5,
        alignSelf: 'center',
        marginRight: 20,
    },
    headerTitle: {
        fontSize: 16,
        fontFamily: Fonts.dmSemiBold,
        textTransform: "capitalize"
    },
    txtTitle: {
        fontSize: 14,
        fontFamily: Fonts.dmMedium,
        marginTop: 15,
        marginBottom: 5,
    },
    txtTitle1: {
        fontSize: 14,
        fontFamily: Fonts.dmRegular,
    },
    tokenImage_style: {
        width: 25,
        height: 25,
        borderRadius: 30,
        backgroundColor: 'white',
        alignSelf: 'center',
        marginLeft: 10,
        resizeMode: 'cover',
    },
    ViewStyle: {
        borderWidth: 1,
        borderRadius: 15,
        flexDirection: 'row',
        justifyContent: 'space-between',
        height: 55,
        alignItems: 'center',
    },
    coinText: {
        fontSize: 16,
        fontFamily: Fonts.dmMedium,
        color: ThemeManager.colors.text_Color,
        paddingLeft: 10,
        alignSelf: 'center',
    },
    ViewStyle1: {
        flexDirection: 'row',
        borderWidth: 1,
        borderRadius: 10,
        height: 55,
        justifyContent: 'space-between',
        position: 'relative',
        marginRight: 7,
        alignItems: 'center',
        paddingHorizontal: 18,
    },
    textStyle: {
        fontFamily: Fonts.dmMedium,
        fontSize: 16,
        textTransform: 'capitalize',
        marginRight: 5,
    },
});
