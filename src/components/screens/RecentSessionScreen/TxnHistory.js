import { Alert, FlatList, Image, ImageBackground, Linking, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import React from 'react'
import { ThemeManager } from '../../../../ThemeManager'
import { Colors, Fonts, Images } from '../../../theme'
import { LanguageManager } from '../../../../LanguageManager'
import Singleton from '../../../Singleton'
import moment from 'moment'
import { dimen, getQubeticsEventLabel, getSessionStatus, heightDimen, widthDimen } from '../../../Utils'
import { Button } from '../../common'
import images from '../../../theme/Images'
import Clipboard from '@react-native-clipboard/clipboard'

export default function TxnHistory({
    transactionList,
    handleEndReached,
    loading,
    onCopyAddress
}) {

    const shortenAddress = (address) => {
        if (!address) return '';
        const start = address.slice(0, 6); // first 6 chars
        const end = address.slice(-6);     // last 6 chars
        return `${start}..........${end}`;
    };
    const formatTxUrl = (txHash) => {
        if (!txHash || txHash.length < 3) return "";      
        return `https://dvpn.qubetics.work/tx/${txHash}`;
      };
      

    const renderItem = ({ item }) => {
        const { label: sessionType, status: sessionStatus } = getQubeticsEventLabel(item?.event, item?.status);
        return (
            <TouchableOpacity onPress={()=> Linking.openURL(formatTxUrl(item?.tx_hash?.toUpperCase()))}>
                <View
                    style={[
                        styles.sessionCard,
                        { backgroundColor: ThemeManager.colors.mnemonicsBg },
                    ]}
                >
                    <View style={{ flexDirection: "row", alignItems: 'center' }}>
                        <View style={{ marginLeft: widthDimen(10), flex: 1, }}>
                            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                <Text
                                    style={[
                                        styles.location,
                                        { color: ThemeManager.colors.headersTextColor, textTransform: "capitalize" },
                                    ]}
                                >
                                    {shortenAddress(item?.tx_hash)}
                                </Text>
                                <TouchableOpacity
                                    onPress={() => onCopyAddress(item?.tx_hash)}
                                    hitSlop={{top: 15, bottom: 15, left: 15, right: 15}}
                                >
                                    <Image
                                        source={images.copy_clipboard}
                                        style={{
                                            alignSelf: 'center',
                                            height: heightDimen(15),
                                            width: widthDimen(15),
                                            resizeMode: 'contain',
                                            tintColor: ThemeManager.colors.blackWhiteText,
                                            marginLeft: widthDimen(6),
                                        }}
                                    />
                                </TouchableOpacity>
                            </View>
                            <Text
                                style={[
                                    styles.location,
                                    { color: ThemeManager.colors.headersTextColor, textTransform: "capitalize" },
                                ]}
                            >
                                {sessionType}
                            </Text>
                            <Text
                                style={[styles.time, { color: sessionStatus?.toLowerCase() == "success" ? ThemeManager.colors.darkGreen : ThemeManager.colors.bloodRed }]}
                            >
                                {sessionStatus}
                            </Text>
                        </View>
                    </View>
                </View>
            </TouchableOpacity>
        )
    }

    const renderEmptyComponent = () => (
        <View style={{ flex: 1, marginTop: 30, justifyContent: 'center', }}>
            <Text
                allowFontScaling={false}
                style={[
                    {
                        color: ThemeManager.colors.blackWhiteText,
                        fontFamily: Fonts.dmMedium,
                        fontSize: 15,
                        paddingHorizontal: 8,
                        alignSelf: 'center',
                    },
                ]}>
                {loading ? '' : 'No transaction found'}
            </Text>
        </View>
    );

    return (
        <FlatList
            data={transactionList}
            keyExtractor={item => item.id}
            renderItem={renderItem}
            contentContainerStyle={styles.listContainer}
            onEndReachedThreshold={0.5}
            ListEmptyComponent={renderEmptyComponent}
            onEndReached={() => {
                handleEndReached()
            }}
        />

    )
}

const styles = StyleSheet.create({
    listContainer: {
        marginHorizontal: widthDimen(18),
        marginTop: heightDimen(14),
    },
    sessionCard: {
        borderRadius: 14,
        padding: dimen(16),
        marginBottom: heightDimen(8),
    },
    flag: {
        width: dimen(40),
        height: dimen(40),
        borderRadius: 20,
    },
    location: {
        fontSize: dimen(14),
        fontFamily: Fonts.dmRegular,
    },
    duration: {
        fontSize: dimen(14),
        fontFamily: Fonts.dmRegular,
    },
    time: {
        marginTop: heightDimen(6),
        fontSize: dimen(14),
        fontFamily: Fonts.dmRegular,
    },
    renewButton: {
        marginTop: heightDimen(30),
        marginBottom: heightDimen(5)
    },
    reloadImg: {
        width: dimen(20),
        height: dimen(20),
        resizeMode: "center",
        marginRight: widthDimen(6),
    },
    borderButtonStyle: {
        width: "99%",
        height: "96%",
        alignItems: "center",
        justifyContent: "center",
        borderRadius: dimen(14),
        flexDirection: "row",
    },

    speeds: {
        flexDirection: "row",
        justifyContent: "space-around",
        // marginBottom: 24,
        alignItems: "center",
    },
    speedItem: {
        alignItems: "center",
        flexDirection: "row",
    },
    speed: {
        fontSize: dimen(14),
        fontFamily: Fonts.dmMedium,
        // marginTop: 6,
    },
    label: {
        fontSize: dimen(12),
        fontFamily: Fonts.dmRegular,
    },
    separator: {
        width: 1,
        height: dimen(42),
    },
    seperator: {
        height: 1,
        width: "100%",
        marginVertical: heightDimen(16),
    },
    icons: {
        width: dimen(36),
        height: dimen(36),
    },
});