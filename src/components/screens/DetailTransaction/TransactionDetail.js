import React, { useState, useEffect, useCallback } from 'react';
import {
    Image,
    TouchableOpacity,
    StyleSheet,
    Text,
    View,
    Linking,
} from 'react-native';
import { ThemeManager } from '../../../../ThemeManager';
import { Fonts, Images } from '../../../theme';
import { AppAlert, Button, FilterList, GradientBorderView, Header, HeaderMain } from '../../common';
import moment from 'moment';
import Singleton from '../../../Singleton';
import { LanguageManager } from '../../../../LanguageManager';
import { dimen, heightDimen, widthDimen } from '../../../Utils';
import images from '../../../theme/Images';
import Clipboard from '@react-native-clipboard/clipboard';
import { TICS_EXPLORER_URL_LINK } from '../../../EndPoint';
import { updateIntentStatus } from '../../../Redux/Actions';
import { useDispatch } from 'react-redux';
import { consoleLogFunc } from '../../../Utils/MethodsUtils';
import { getIntentDetails } from '../../../Utils/chainAbstractionUtils';


const TransactionDetail = ({ item, onClose, onShowAbstractionStatus, onRefresh }) => {
    const dispatch = useDispatch();
    const [intentHash, setIntentHash] = useState('');
    const [showAlertDialog, setShowAlertDialog] = useState(false);
    const [alertTxt, setAlertTxt] = useState('');
    const [status, setStatus] = useState(item?.status);

    const getStatus = useCallback((statusValue) => {
        const value = statusValue?.toLowerCase();
        switch (value) {
            case "rejected":
                return {
                    status: 'failed',
                };
            case "solved":
                return {
                    status: 'completed',
                };
            default:
                return { status: 'pending' };
        }
    }, []);

    const updateIntentFunction = useCallback((status, intentHashValue) => {
        const coinFamily = item?.coin_family;
        const url = coinFamily == 3 ? "bitcoin/btc" : "qubetics/tics";
        dispatch(updateIntentStatus(url, { tx_hash: intentHashValue, tx_status: getStatus(status)?.status })).then(res => {
            consoleLogFunc("res>>", res);
            if (status == "Solved") {
                onRefresh && onRefresh();
            }
        }).catch(err => {
            consoleLogFunc("err>>", err);
        });
    }, [item?.coin_family, dispatch, onRefresh]);

    useEffect(() => {
        const fetchIntentDetails = async () => {
            consoleLogFunc("item.type>>", item?.type);

            setIntentHash(item?.tx_id);

            if (
                item?.type?.toLowerCase() === 'chain_abstraction' &&
                item?.status?.toLowerCase() === 'pending'
            ) {
                try {
                    const intentDetails = await getIntentDetails(item?.tx_id);

                    consoleLogFunc("intentDetails>>", intentDetails);

                    setStatus(
                        getStatus(intentDetails?.intent_status)?.status
                    );

                    updateIntentFunction(
                        intentDetails?.intent_status,
                        item?.tx_id
                    );
                } catch (error) {
                    consoleLogFunc("getIntentDetails error>>", error);
                }
            }
        };

        fetchIntentDetails();
    }, []);
    const handleCopyToClipboard = useCallback(() => {
        Clipboard.setString(item?.tx_id ?? '');
        setShowAlertDialog(true);
        setAlertTxt(LanguageManager.alertMessages.copiedToClipboard);
    }, [item?.tx_id]);

    const handleExplorerPress = useCallback(() => {
        consoleLogFunc('item---address', item);
        if (item?.type?.toLowerCase() == 'chain_abstraction') {
            onShowAbstractionStatus(intentHash);
            return;
        }
        Linking.openURL(TICS_EXPLORER_URL_LINK + item.tx_id);

    }, [item, intentHash, onShowAbstractionStatus]);

    const { detailTrx, merchantCard, walletMain, referral } = LanguageManager;

    return (
        <View style={{ flex: 1, justifyContent: "flex-end", }}>
            {/* <BlurView style={StyleSheet.absoluteFill} blurType="dark" blurAmount={1} reducedTransparencyFallbackColor="white" /> */}

            <TouchableOpacity
                style={{ flex: 1 }}
                activeOpacity={1}
                onPress={onClose}
            />

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
                    {/* <Text style={styles.tokenAmount} >Intent Transaction Hash</Text> */}
                    <Text style={styles.tokenAmount}>Intent ID</Text>
                    <View style={{
                        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
                        paddingTop: heightDimen(15),
                        paddingRight: widthDimen(15)
                    }}>
                        <Text
                            numberOfLines={1}
                            ellipsizeMode='middle'
                            style={[styles.tokenLabel, { paddingRight: widthDimen(10) }]}>{intentHash ?? ''}</Text>

                        <TouchableOpacity onPress={handleCopyToClipboard}>
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
                                    color: Singleton.getInstance().getStatusColor({
                                        trx_type: "cross_chain",
                                        status: status,
                                    }),
                                    textTransform: 'capitalize',
                                },
                            ]}>
                            {status}
                        </Text>
                    </View>

                    <View style={styles.rowView}>
                        <Text style={{ ...styles.tokenAmount, color: ThemeManager.colors.legalGreyColor }} >Time Stamp</Text>
                        <Text style={styles.tokenLabel}>{moment(item?.created_at).format('ll')} |{' '}
                            {moment(item?.created_at).format('LT')}</Text>
                    </View>

                    {/* <View style={styles.rowView}>
                        <Text style={{ ...styles.tokenAmount, color: ThemeManager.colors.legalGreyColor }} >Transaction Fees</Text>
                        <Text style={styles.tokenLabel}>{'50 TICS'}</Text>
                    </View> */}

                </View>

                <View style={{
                    marginTop: 20, justifyContent: "space-between", marginBottom: 40, flexDirection: "row",
                    alignItems: "center",
                }}>
                    <TouchableOpacity onPress={onClose}>

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
                        onPress={handleExplorerPress}
                        buttontext={merchantCard.explorer}
                        customStyle={{ width: widthDimen(180), }}
                    />
                </View>


            </View>

            {/* /****************************************************************************************** */}
            {showAlertDialog && (
                <AppAlert
                    alertTxt={alertTxt}
                    showSuccess={true}
                    hideAlertDialog={() => {
                        setShowAlertDialog(false);
                    }}
                />
            )}
        </View>
    );
};

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
