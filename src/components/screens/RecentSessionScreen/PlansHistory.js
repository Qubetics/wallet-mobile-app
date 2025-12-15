import { FlatList, Image, ImageBackground, StyleSheet, Text, View } from 'react-native'
import React from 'react'
import { ThemeManager } from '../../../../ThemeManager'
import { Colors, Fonts, Images } from '../../../theme'
import { LanguageManager } from '../../../../LanguageManager'
import Singleton from '../../../Singleton'
import moment from 'moment'
import { dimen, getDaysLeftOnPlan, heightDimen, widthDimen } from '../../../Utils'
import { Button } from '../../common'
import { consoleLogFunc, toFixedExp } from '../../../Utils/MethodsUtils'

export default function PlansHistory({
    planList,
    handleEndReached,
    loading,
    onRenewPress
}) {
    const formatPrettyDate = (isoString) => {
        const date = new Date(isoString);

        const options = {
            month: "long",
            day: "numeric",
            year: "numeric",
        };

        const datePart = date.toLocaleDateString("en-US", options);
        const timePart = date.toLocaleTimeString("en-US", {
            hour: "numeric",
            minute: "2-digit",
            hour12: true,
        });
        return `${datePart} • ${timePart}`;
    };




    const renderItem = ({ item }) => {
        return (
            <>
                <View
                    style={[
                        styles.sessionCard,
                        { backgroundColor: ThemeManager.colors.mnemonicsBg },
                    ]}
                >
                    <View style={{ flexDirection: "row", alignItems: 'center' }}>
                        {/* <Image source={{ uri: flag }} style={styles.flag} /> */}
                        <View style={{ marginLeft: widthDimen(10), flex: 1 }}>
                            <Text
                            ellipsizeMode='middle'
                            numberOfLines={1}
                                style={[
                                    styles.location,
                                    { color: ThemeManager.colors.headersTextColor, textTransform: "capitalize" },
                                ]}
                            >
                                {item?.plans?.provider_address}
                            </Text>
                            <Text
                                style={[
                                    styles.location,
                                    { color: ThemeManager.colors.headersTextColor },
                                ]}
                            >
                                {toFixedExp(item?.price?.base_value, 0)} {"TICS"}
                            </Text>
                            <Text
                                style={[styles.time, { color: ThemeManager.colors.legalGreyColor }]}
                            >
                                {formatPrettyDate(item.start_at)}
                            </Text>
                        </View>
                        <Text
                            style={[
                                styles.duration,
                                { color: ThemeManager.colors.legalGreyColor },
                            ]}
                        >
                            {item.status != "active" ? "Expired" : getDaysLeftOnPlan(item.inactive_at)}
                        </Text>
                    </View>
                    {
                       item.status != "active" && onRenewPress &&
                        (
                            <View style={styles.renewButton}>
                                <Button
                                    imgStyle={styles.reloadImg}
                                    buttontext={LanguageManager.vpn.renew}
                                    onPress={() => {
                                        onRenewPress(item?.plans);
                                    }}
                                    myStyle={{ width: "100%", alignItems: "center" }}
                                    viewStyle={{
                                        backgroundColor: ThemeManager.colors.mnemonicsBg,
                                        ...styles.borderButtonStyle,
                                    }}
                                />
                            </View>

                        )
                    }
                </View>
            </>
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
                {loading ? '' : 'No plans found'}
            </Text>
        </View>
    );

    return (
        <FlatList
        // data={[]}
            data={planList}
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
        marginTop: heightDimen(3),
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