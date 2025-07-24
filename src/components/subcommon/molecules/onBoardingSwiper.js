import { View, Text, Image, TouchableOpacity, Linking } from "react-native";
import React from "react";
import { StyleSheet } from "react-native";
import Swiper from "react-native-swiper";
import images from "../../../theme/Images";
import { ThemeManager } from "../../../../ThemeManager";
// import Singleswiper from '../atoms/singleSwiper';

const popUpNotify = [
    {
        id: "1",
        message: "Your first notification message goes here.",
        banner_notification_img: images.appLogo1,
    },
    {
        id: "2",
        message: "Another message with an image.",
        banner_notification_img: images.appLogo1,
    },
    {
        id: "3",
        message: "Yet another update with content.",
        banner_notification_img: images.appLogo,
    },
];

const OnboardingSwiper = (props) => {
    const { arr } = props;
    const imgBaseUrl =
        "https://prod-qubetics-wallet.obs.ap-southeast-4.myhuaweicloud.com/";

    return (
        // <Swiper style={styles.wrapper} showsButtons={true}>
        //     {/* <Singleswiper />
        //     <Singleswiper />
        //     <Singleswiper /> */}

        // </Swiper>

        <View
            style={{
                justifyContent: "center",
                height: 130,
            }}
        >
            <Swiper
                loop={true}
                activeDotColor={ThemeManager.colors.mnemonicsBg}
                dotColor={ThemeManager.colors.legalGreyColor}
                paginationStyle={{ marginHorizontal: 5 }}
                autoplay={true}
            >
                {arr?.length > 0 &&
                    arr.map((item, index) => {
                        let imageUrl = imgBaseUrl + item?.image_path;
                        console.log("item---", item);
                        console.log("imageUrl---", imageUrl);


                        return (
                            // <View style={styles.listView}>
                                <TouchableOpacity style={styles.listView} onPress={() => Linking.openURL(item?.link)}>
                                    <Image
                                        // source={item?.banner_notification_img == "" ? Images.logo_pinscreen : {uri: item?.banner_notification_img}}
                                        source={{ uri: imageUrl }}
                                        style={styles.logoStyle}
                                    />
                                </TouchableOpacity>

                            // </View>
                        );
                    })}
            </Swiper>
            <View></View>
        </View>
    );
};

export default OnboardingSwiper;

const styles = StyleSheet.create({
    wrapper: {},
    slide1: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "#9DD6EB",
    },
    slide2: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "#97CAE5",
    },
    slide3: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "#92BBD9",
    },
    text: {
        color: "#fff",
        fontSize: 30,
        fontWeight: "bold",
    },
    listView: {
        alignItems: "center",
        flex: 1,
        // backgroundColor:'orange',
        paddingHorizontal: 5,
    },
    logoStylesec: {
        alignSelf: "center",
        marginVertical: 10,
        height: 100,
        width: "100%",
        resizeMode: "contain",
    },
    logoStyle: {
        alignSelf: "center",
        marginVertical: 10,
        height: 100,
        width: "100%",
        // resizeMode: "contain",
        resizeMode:'stretch',
        borderRadius: 10,
    },
    labelView: {
        width: 250,
        // marginTop: 10,
    },
    labelStyle: {
        // fontFamily: Fonts.regular,
        // fontSize: 16,
        // color: Colors.Black,
        // textAlign: 'center',
    },
});
