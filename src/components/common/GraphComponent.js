import { View, Modal, SafeAreaView, StyleSheet, Image, Text, TouchableOpacity, Dimensions } from 'react-native'
import React, { useEffect, useState } from 'react'
import { ThemeManager } from '../../../ThemeManager'
import { BlurView } from '@react-native-community/blur'
import { Fonts, Images } from '../../theme'
import WebView from 'react-native-webview'
import { LoaderView } from './LoaderView'
import { areaChartView, bigNumberFormat, bigNumberSafeMath, consoleLogFunc, toFixedExp, tradingWebView } from '../../Utils/MethodsUtils'
import { GradientBorderView } from './GradientBorderView'
import LinearGradient from 'react-native-linear-gradient'
import Singleton from '../../Singleton'
import moment from 'moment'
import { useDispatch, useSelector } from 'react-redux'
import { getCoinGraph } from '../../Redux/Actions'
const GraphComponent = React.memo(({ headerText, openModel, onPressClose, graphData, selectedCoin }) => {
    const tabData = ["1D", "1W", "1M", "1Y",];
    const dispatch = useDispatch()
    const currencyList = useSelector(state => state?.walletReducer?.currencyList)

    const [isTradingView, setTradingView] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const [selectedIndex, setSelectedIndex] = useState(0)
    const [chartData, setChartData] = useState({
        data: [],
        label: [],
        index: 0
    })

    consoleLogFunc("GraphComponent>>>>>>>>>RENDER");

    useEffect(() => {
        if (graphData?.graph) {
            updateGraphData(graphData?.graph, selectedIndex)
        }
    }, [graphData])

    const updateGraphData = (data, index) => {
        let label = []
        let graphData = []
        const currencyData = currencyList?.find(res => res?.currency_code == Singleton.getInstance().CurrencySelected)

        data = data?.filter(res => res != null)
        data?.map((item, index) => {
            label.push((bigNumberSafeMath(item?.price, "*", currencyData?.price_in_usd || "1")))
            graphData.push(item?.timestamp)
        })
        // consoleLogFunc("graphData>>", graphData);
        // consoleLogFunc("label>>", label);

        setChartData({
            data: graphData,
            label: label,
            index: index
        })
    }



    const onPressDuration = (duration, index) => {
        setSelectedIndex(index)
        setIsLoading(true)
        dispatch(getCoinGraph({
            "cmc_id": graphData?.cmc_id,
            "fiat_currency": "USD",
            "duration": duration
        })).then(res => {
            setIsLoading(false)
            updateGraphData(res?.data || [], index)

        })
            .catch(err => {
                setIsLoading(false)
            })

    }


    return (
        <Modal
            statusBarTranslucent
            animationType="fade"
            transparent={true}
            visible={openModel}
            onRequestClose={onPressClose}>

            <BlurView
                style={StyleSheet.absoluteFillObject}
                blurType="light"
                blurAmount={2}
                reducedTransparencyFallbackColor="white"
            />
            <View style={{ flex: 0.1, }} />
            <SafeAreaView style={[styles.mainView, { backgroundColor: ThemeManager.colors.mnemonicsBg, }]}>
                <View style={styles.headerView}>
                    <View />
                    <Text style={[styles.headerText, { color: ThemeManager.colors.blackWhiteText }]}>{headerText}</Text>
                    <TouchableOpacity onPress={onPressClose}>
                        <Image source={Images.close_icon} style={[styles.closeIcon, { tintColor: ThemeManager.colors.blackWhiteText }]} />
                    </TouchableOpacity>
                </View>

                <View style={[styles.buttonBg, { borderColor: ThemeManager.colors.mnemonicsBorder }]}>
                    <TouchableOpacity
                        onPress={() => {
                            setTradingView(false)

                        }}
                        style={styles.button}>
                        <Text
                            style={[styles.buttonText, {
                                fontFamily: isTradingView ? Fonts.dmMedium : Fonts.dmBold,
                                color: isTradingView ? ThemeManager.colors.legalGreyColor : ThemeManager.colors.blackWhiteText
                            }]}
                        >Qubetics Chart</Text>
                    </TouchableOpacity>
                    <View style={[styles.buttonLine, { backgroundColor: ThemeManager.colors.mnemonicsBorder }]} />
                    <TouchableOpacity
                        onPress={() => {
                            setTradingView(true)
                        }}
                        style={styles.button}>
                        <Text
                            style={[styles.buttonText, {
                                fontFamily: isTradingView ? Fonts.dmBold : Fonts.dmMedium,
                                color: isTradingView ? ThemeManager.colors.blackWhiteText : ThemeManager.colors.legalGreyColor
                            }]}
                        >{graphData?.pair_address ? "Moralis" : "Trading View"}</Text>
                    </TouchableOpacity>
                </View>




                {isTradingView ? null : 
                <View style={styles.sliderView}>
                    {tabData.map((item, index) => (
                        <TouchableOpacity
                            key={index + ""}
                            onPress={async () => onPressDuration(item, index)}
                            style={[styles.tabsViewTwo,]}
                        >
                            {selectedIndex == index ? <LinearGradient
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 1 }}
                                colors={["#73C9E2", "#6C8DC5", "#6456B2", "#6145EA"]}

                                style={[styles.tabsViewTwo, { height: 30 }]}
                            >
                                <Text
                                    allowFontScaling={false}
                                    style={{
                                        color: ThemeManager.colors.blackWhiteText,
                                        fontSize: 16,
                                        fontFamily: Fonts.dmSemiBold,
                                    }}
                                >
                                    {item}
                                </Text>
                            </LinearGradient> :
                                <GradientBorderView
                                    gradientStyle={{ height: 30 }}
                                    mainStyle={[styles.tabsViewTwo]}
                                >
                                    <Text
                                        allowFontScaling={false}
                                        style={{
                                            color: ThemeManager.colors.TextColor,
                                            fontSize: 16,
                                            fontFamily: Fonts.dmSemiBold,
                                        }}
                                    >
                                        {item}
                                    </Text>
                                </GradientBorderView>
                            }
                        </TouchableOpacity>
                    ))}
                </View>
                }


                <WebView
                    style={{ flex: 1, backgroundColor: "transparent" }}
                    source={{
                        html: isTradingView ? tradingWebView('dark', ThemeManager.colors.mnemonicsBg, graphData, selectedCoin?.coin_family) :
                            areaChartView(chartData),

                    }}
                    javaScriptEnabled={true}
                    originWhitelist={["*"]}
                    overScrollMode={"never"}
                    setSupportMultipleWindows={false}
                    scalesPageToFit={true}
                    domStorageEnabled={true}
                    cacheEnabled={false}
                    bounces={false}
                    hardwareAccelerated={true}
                    scrollEnabled={false}
                    showsVerticalScrollIndicator={false}
                    showsHorizontalScrollIndicator={false}
                    injectedJavaScript={` 
                        const meta = document.createElement('meta');
                        meta.setAttribute('name', 'viewport');
                        meta.setAttribute('content', 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no');
                        document.getElementsByTagName('head')[0].appendChild(meta);
                        `}

                />
                <LoaderView isLoading={isLoading} />
            </SafeAreaView>
        </Modal>
    )
})
const styles = StyleSheet.create({
    mainView: {
        flex: 1,
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,

    },
    headerView: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 10,
    },
    headerText: {
        fontSize: 20,
        fontFamily: Fonts.dmMedium,
    },
    buttonText: {
        fontSize: 15,
        fontFamily: Fonts.dmRegular,
    },
    closeIcon: {
        width: 20,
        height: 20,
        resizeMode: 'contain',
    },
    buttonBg: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderBottomWidth: 1,

    },
    buttonLine: { height: 40, width: 1 },
    button: { alignItems: "center", justifyContent: "center", flex: 1 },
    sliderView: {
        width: '100%',
        flexDirection: 'row',
        justifyContent: 'space-around',
        paddingHorizontal: 50,
        marginTop: 5
        // height:50
    },
    tabsViewTwo: {
        width: 50,
        paddingVertical: 5,
        borderRadius: 14,
        alignItems: 'center',

    },
})

export default GraphComponent