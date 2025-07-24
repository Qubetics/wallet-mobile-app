import { View, Text, Modal, ImageBackground, ScrollView, Image } from 'react-native'
import React, { useEffect, useState } from 'react'
import { Button, HeaderMain, ManageItem } from '../../../common'
import { LanguageManager } from '../../../../../LanguageManager'
import { ThemeManager } from '../../../../../ThemeManager'
import styles from '../WalletConnectionStyle'
import images from '../../../../theme/Images'
import { consoleLogFunc, getData } from '../../../../Utils/MethodsUtils'
import * as Constants from '../../../../Constants'
import { SvgUri } from 'react-native-svg'

const NewConnection = ({ isVisible, onClose, approveRequestData, approveConnection }) => {
    let data = approveRequestData?.params?.proposer ? approveRequestData?.params?.proposer?.metadata : approveRequestData?.params?.[0]?.peerMeta;

    console.log("DATA>>>>>>1234", approveRequestData);
    
    let isSolana = false;
    let isEVM = false;
    if (Object.keys(approveRequestData?.params?.requiredNamespaces)?.toString()?.includes('solana') || Object.keys(approveRequestData?.params?.optionalNamespaces)?.toString()?.includes('solana')) {
        isSolana = true
    }
    if(Object.keys(approveRequestData?.params?.requiredNamespaces)?.toString("eip155") || Object.keys(approveRequestData?.params?.optionalNamespaces)?.toString()?.includes('eip155')){
        isEVM = true;
    }
    const [walletData, setWalletData] = useState("");
    useEffect(() => {
        getData(Constants.MULTI_WALLET_LIST)
            .then(list => {
                let currentWallet = JSON.parse(list)
                currentWallet = currentWallet.find(res => res?.defaultWallet)
                // consoleLogFunc("currentWallet:::", currentWallet);
                setWalletData(currentWallet);
            })
    }, [approveRequestData]);

    consoleLogFunc("data>>>", data);

    const InfoComponent = ({ image, text }) => {
        return (
            <View style={{ alignItems: "center", flexDirection: "row", justifyContent: "center" }}>
                <Image source={image} />
                <Text style={[styles.ethWallet, { color: ThemeManager.colors.blackWhiteText, marginLeft: 10, lineHeight: 24 }]}>{text}</Text>
            </View>
        )
    }

    if (!approveRequestData) {
        return null;
    }
    return (
        <Modal transparent={true} visible={isVisible} onRequestClose={onClose}>
            <ImageBackground
                source={ThemeManager.ImageIcons.mainBgImgNew}
                style={{ flex: 1, backgroundColor: ThemeManager.colors.mainBgNew }}
            >
                <HeaderMain
                    backCallBack={onClose}
                    BackButtonText={LanguageManager.walletConnection.connectDApp} />

                <View style={{ flex: 0.9 }}>
                    <ScrollView>
                        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', marginTop: 40 }}>
                            {data?.icons?.[0]?.includes(".svg") ?
                                <View style={[styles.dappImage, { overflow: "hidden" }]}>
                                    <SvgUri
                                        width="100%"
                                        height="100%"
                                        uri={data?.icons?.[0]}
                                    />
                                </View> :
                                <Image
                                    style={styles.dappImage}
                                    source={{ uri: data?.icons?.[0] }} />}
                            <Text style={[styles.dappName, { color: ThemeManager.colors.blackWhiteText }]}>{data?.name || ""}</Text>
                            <Text style={[styles.dappUrl, { color: ThemeManager.colors.primaryColor }]}>{data?.url}</Text>
                        </View>
                        <View style={{ marginTop: 30, paddingHorizontal: 20, alignItems: "flex-start" }}>
                            <Text style={[styles.ethWallet, { color: ThemeManager.colors.blackWhiteText }]}>Wallet</Text>
                          {isSolana &&  <ManageItem
                                walletName={walletData?.walletName}
                                walletType={(walletData?.login_data?.["defaultSolAddress" ])}
                            />}

                          {isEVM && <ManageItem
                                walletName={walletData?.walletName}
                                walletType={(walletData?.login_data?.["defaultEthAddress"])}
                            />}


                            <InfoComponent image={images.icWalletActivity} text={"View your wallet balance and activity"} />
                            <InfoComponent image={images.icReqApproval} text={"Request approval for transaction"} />
                        </View>

                    </ScrollView>
                </View>
                <View style={{ flex: 0.1, paddingHorizontal: 20, marginBottom: 10 }}>
                    <Button
                        onPress={() => {

                            let address = {
                                evmAddress: isEVM ?  walletData?.login_data?.["defaultEthAddress"] : "",
                                solAddress: isSolana ? walletData?.login_data?.["defaultSolAddress"] : ""
                            }
                            
                            approveConnection(address)}}
                        buttontext={LanguageManager.walletConnection.connect} />
                </View>
            </ImageBackground>
        </Modal>
    )
}

export default NewConnection