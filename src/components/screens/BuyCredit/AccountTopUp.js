import styles from "./AccountTopUpStyle";
import { Dimensions, FlatList, Image, ImageBackground, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import React from 'react'
import { ThemeManager } from "../../../../ThemeManager";
import { Button, HeaderMain } from "../../common";
import { LanguageManager } from "../../../../LanguageManager";
import { consoleLogFunc } from "../../../Utils/MethodsUtils";
import CreditSelectionCard from "../../common/CreditSelectionCard";
import { Actions } from "react-native-router-flux";


const AccountTopUp = () => {
    const { vpn, help } = LanguageManager;
    const { colors, ImageIcons } = ThemeManager;
    const [selectedIndex, setSelectedIndex] = React.useState(0);

    const creditPackages = [
        { id: 1, credits: "5,000 Credits", price: "₹1,400", isSelected: true },
        { id: 2, credits: "10,000 Credits", price: "₹2,900" },
        { id: 3, credits: "15,000 Credits", price: "₹4,900" },
        { id: 23, credits: "15,45500000 Credits", price: "₹4,900" },
        { id: 33, credits: "15,000 Credits", price: "₹4,900" },
    ];

    const renderHeader = () => (
        <View style={styles.headerContainer}>
            <Text style={[styles.mainTitle, { color: colors.blackWhiteText }]}>
                {vpn.getSomeCredits}
            </Text>
            <Text style={[styles.subtitle, { color: colors.legalGreyColor }]}>
            {vpn.purchaseCredit}
            </Text>
        </View>
    );

    const renderFooter = () => (
        <View style={styles.footerContainer}>
            <Button 
                buttontext={vpn.buyNow} 
                onPress={() => {
                    consoleLogFunc("Buy Now pressed");
                           Actions.AddCustomDns();
                }} 
                myStyle={styles.buyButton}
            />
            <Text style={[styles.footerText, { color: colors.legalGreyColor }]}>
                {vpn.youPurchaseing}
            </Text>
        </View>
    );

    return (
        <ImageBackground
            source={ThemeManager.ImageIcons.mainBgImgNew}
            style={{ flex: 1, backgroundColor: ThemeManager.colors.mainBgNew }}
        >
            <View style={[styles.mainView]}>
                <HeaderMain
                    BackButtonText={vpn.accTopUp}
                />
                
                <FlatList
                    style={styles.flatList}
                    showsVerticalScrollIndicator={false}
                    data={creditPackages}
                    numColumns={2}
                    contentContainerStyle={styles.contentContainer}
                    ListHeaderComponent={creditPackages.length > 0 ? renderHeader : null}
                    ListFooterComponent={creditPackages.length > 0 ? renderFooter : null}
                    renderItem={({ item, index }) => {
                        return (
                            <CreditSelectionCard 
                            index={index}
                            isSelected={selectedIndex === index}
                            onPress={() => setSelectedIndex(index)}
                            credits={item.credits}
                            price={item.price}
                        />
                        );
                    }}
                    keyExtractor={item => item?.id?.toString()}
                    ListEmptyComponent={() => (
                        <View style={styles.emptyContainer}>
                            <Text style={[styles.emptyText, { color: colors.blackWhiteText }]}>
                                {help.noListFound}
                            </Text>
                        </View>
                    )}
                />
            </View>
        </ImageBackground>
    )
}


export default AccountTopUp