import React from "react";
import { Image, StyleSheet, Text, View } from "react-native";
import { LanguageManager } from "../../../../LanguageManager";
import { ThemeManager } from "../../../../ThemeManager";
import { Fonts } from "../../../theme";
import { dimen, heightDimen, widthDimen } from "../../../Utils";
import { Button } from "../../common/Button";

const DVpnView = ({
    country,
    flag,
    city,
    startAt,
    statusAt,
    onReconnectPress,
}) => {
    const { vpn } = LanguageManager;

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

    return (
        <View
            style={[
                styles.sessionCard,
                {
                    backgroundColor: ThemeManager.colors.mnemonicsBg,
                },
            ]}
        >
            <View style={{ flexDirection: "row" }}>
                <Image source={{ uri: flag }} style={styles.flag} />
                <View style={{ marginLeft: widthDimen(10), }}>
                    <Text
                        style={[
                            styles.location,
                            { color: ThemeManager.colors.headersTextColor },
                        ]}
                    >
                        {country} – {city}
                    </Text>
                    <Text
                        style={[styles.time, { color: ThemeManager.colors.legalGreyColor }]}
                    >
                        {formatPrettyDate(startAt)}
                    </Text>
                </View>
            </View>
        </View>
    );
};

export default DVpnView;

const styles = StyleSheet.create({
    sessionCard: {
        borderRadius: 14,
        padding: dimen(16),
        marginBottom: heightDimen(8),
        marginHorizontal: heightDimen(20),

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
    reconnectButton: {
        marginTop: heightDimen(30),
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
