import { View, Text, ImageBackground, Image, FlatList } from 'react-native'
import { useEffect, useRef, useState } from 'react'
import { ThemeManager } from '../../../../ThemeManager'
import { Button, HeaderMain, LoaderView, ManageItem, OnboardingHeadings } from '../../common'
import styles from './WalletConnectionStyle'
import { LanguageManager } from '../../../../LanguageManager'
import images from '../../../theme/Images'
import { dimen, widthDimen } from '../../../Utils'
import QrScanner from './UiComponents/QrScanner'
import NewConnection from './UiComponents/NewConnection'
import ManageConnection from './UiComponents/ManageConnection'
import WalletConnectInstance from '../../../Utils/WalletConnectInstance'
import { EventRegister } from 'react-native-event-listeners'
import Singleton from '../../../Singleton'
import { consoleLogFunc } from '../../../Utils/MethodsUtils'

const WalletConnection = (props) => {
    const { navigation } = props;
    const { walletConnectUri } = props;
    const callLinkRef = useRef();
    const [isLoading, setIsLoading] = useState(false);
    const [activeConnections, setActiveConnections] = useState([]);
    const [isQrScannerVisible, setIsQrScannerVisible] = useState(false);
    const [isNewConnectionVisible, setIsNewConnectionVisible] = useState(false);
    const [approveRequestData, setApproveRequestData] = useState(null);
    const [manageConnectionData, setManageConnectionData] = useState({
        isVisible: false,
        wcData: null,
    });
    useEffect(() => {
        if (walletConnectUri) {
            handleAddNewConnection(walletConnectUri);
        }
        getActiveConnections()
        EventRegister.addEventListener('wallet_connect_event', (link) => {
            handleAddNewConnection(link);
        })

        EventRegister.addEventListener('sessionProposal', (data) => {
        consoleLogFunc("sessionProposal:::111", data);

            sessionProposalV2(data);
        })

        EventRegister.addEventListener('sessionDeleted', (data) => {
        consoleLogFunc("sessionDeleted:::111", data);

            getActiveConnections()
        })

        EventRegister.addEventListener('sessionRequest', (data) => {
            consoleLogFunc('data---SESSION_REQUEST', JSON.stringify(data))
            // allModalClose()
        })
        EventRegister.addEventListener('requestFromDapp', (data) => {
        consoleLogFunc("requestFromDapp:::111", data);

            setManageConnectionData({
                isVisible: false,
            })
        })
        EventRegister.addEventListener('networkSwitched', (data) => {
            consoleLogFunc("networkSwitched:::111", data);
            })
        navigation.addListener('blur', () => {
            setManageConnectionData({
                isVisible: false,
            })
        })
    }, []);

    const getActiveConnections = async () => {
        consoleLogFunc('getActiveConnections----');
        
        let sessions = await WalletConnectInstance.getInstance()?.web3Wallet?.getActiveSessions()
        consoleLogFunc('getActiveConnections----sessions',sessions );

        if (sessions) {
            let keys = Object?.keys(sessions)
            let connectionList = []
            keys?.map(el => {
                connectionList.push(sessions[el])
            })
            setActiveConnections(connectionList)
            return connectionList
        }
    }

    const approveConnection = async (walletAddress, ) => {
        try {
            consoleLogFunc("approveConnection:::", walletAddress);
            setIsNewConnectionVisible(false);
            setIsLoading(true)
            if (WalletConnectInstance.getInstance().web3Wallet) {
                consoleLogFunc("approveRequestData>>>>", JSON.stringify(approveRequestData));
                let optionalChains = []
                let requireChains = []

                if (walletAddress?.solAddress != "") {
                    optionalChains = approveRequestData?.params?.optionalNamespaces?.['solana']?.chains || []
                    requireChains = approveRequestData?.params?.requiredNamespaces?.['solana']?.chains || []
                }

                consoleLogFunc("OPTIONAL>>>", optionalChains, requireChains)
                if(walletAddress?.evmAddress != "") {
                    const opChains = approveRequestData?.params?.optionalNamespaces?.['eip155']?.chains || []
                    const reqChains = approveRequestData?.params?.requiredNamespaces?.['eip155']?.chains || []

                    consoleLogFunc("OPTIONAL111>>>", opChains, reqChains)

                    optionalChains = [...optionalChains,...opChains]
                    requireChains = [...requireChains,...reqChains]
                }
                consoleLogFunc("OPTIONAL111>>>1", optionalChains, requireChains)

                let chainList = [...optionalChains, ...requireChains]

                consoleLogFunc("chainList>>>", chainList)

                chainList = [...new Set(chainList)];
                let solAccount = []
                let evmAccount = []
                consoleLogFunc("chainList:::", chainList);
             

                chainList?.map(chain => {
                    if (walletAddress?.solAddress != "" && chain?.includes("solana")) {
                        solAccount.push(`${chain}:${walletAddress?.solAddress}`)
                    } 
                    if(walletAddress?.evmAddress != "") {
                        if (chain == "eip155:56" || chain == "eip155:1" || chain == "eip155:137" || chain == "eip155:369" || chain == "eip155:9029" || chain == "eip155:9030" || chain == "eip155:undefined") {
                            evmAccount.push(`${chain}:${walletAddress?.evmAddress}`)
                            // evmAccount.push(`eip155:1:${walletAddress?.evmAddress}`)

                        }
                    }
                })
                let namespaces = null
                if (walletAddress?.solAddress != "") {
                    namespaces = {
                        solana: {
                            accounts: solAccount,
                            methods: approveRequestData?.params?.requiredNamespaces['solana']?.methods || approveRequestData?.params?.optionalNamespaces['solana']?.methods,
                            events: approveRequestData?.params?.requiredNamespaces['solana']?.events || approveRequestData?.params?.optionalNamespaces['solana']?.events
                        },
                    }
                } 
                
                if(walletAddress?.evmAddress != ""){
                    namespaces = {
                        ...namespaces,
                        eip155: {
                            // chains: ['eip155:9030'],
                            accounts: evmAccount,
                            methods: approveRequestData?.params?.requiredNamespaces?.['eip155']?.methods
                                || approveRequestData?.params?.optionalNamespaces?.['eip155']?.methods
                                || [
                                    "eth_sendTransaction",
                                    "personal_sign",
                                    "eth_signTypedData",
                                    "eth_signTypedData_v4",
                                    "eth_sign",
                                ],

                            // methods: [
                            //     "eth_sendTransaction",
                            //     "personal_sign",
                            //     "eth_signTypedData",
                            //     "eth_signTypedData_v4",
                            //     "eth_sign",
                            // ],
                            events: approveRequestData?.params?.requiredNamespaces['eip155']?.events || approveRequestData?.params?.optionalNamespaces['eip155']?.events,

                        },

                    }
                }

                consoleLogFunc("namespaces:::>>>", namespaces, approveRequestData?.id);


                await WalletConnectInstance.getInstance()?.web3Wallet?.approveSession({
                    id: approveRequestData?.id,
                    namespaces: namespaces,
                    // relayProtocol: "irn"
                });
                setIsLoading(false)
                getActiveConnections()
                Singleton.getInstance().showToast?.show("       Connected successfully\nYou can go back to your browser.", 4000);
            }
        } catch (e) {
            consoleLogFunc("approveConnection_catch:::", e);
            setIsLoading(false)
        }
    }

    const sessionProposalV2 = (event) => {
        setIsLoading(false)
        consoleLogFunc('event =>>sessionProposalV2', event)
        consoleLogFunc("Object Required>>>", Object.keys(event?.params?.requiredNamespaces));
        consoleLogFunc("Object Optional>>>", Object.keys(event?.params?.optionalNamespaces));
        if (Object.keys(event?.params?.requiredNamespaces)?.toString()?.includes('solana') ||
            Object.keys(event?.params?.optionalNamespaces)?.toString()?.includes('solana') ||
            Object.keys(event?.params?.requiredNamespaces)?.toString()?.includes('eip155') ||
            Object.keys(event?.params?.optionalNamespaces)?.toString()?.includes('eip155')) {
            setApproveRequestData(event)
            setIsLoading(false)
            setIsNewConnectionVisible(true);
        } else {
            Singleton.getInstance().showToast?.show("Unsupported chain", 2000);
        }
    }

    const handleAddNewConnection = (walletUri) => {
        consoleLogFunc("handleAddNewConnection:::", walletUri);

        if (callLinkRef?.current) {
            return
        }
        if (!walletUri.includes('wc')) {
            Singleton.getInstance().showToast?.show("Invalid QR Code.");
            setIsLoading(false)
            return;
        }
        if (walletUri?.includes('relay-protocol')) {
            callLinkRef.current = true;
            Singleton.getInstance().showToast?.show("May take a few seconds to connect", 2000);
            // setIsLoading(true)
            try {
                let interval = setInterval(() => {
                    if (WalletConnectInstance.getInstance()?.web3Wallet != null) {
                        clearInterval(interval)
                        consoleLogFunc("WalletConnectInstance>>>>>>>>", WalletConnectInstance.getInstance(),);
                        consoleLogFunc("walletUri>>>>>>>>", walletUri,);

                        WalletConnectInstance.getInstance().connect(walletUri).then(res => {
                            callLinkRef.current = false;
                            consoleLogFunc("WalletConnect.getInstance().connect_res:::", res);
                            setIsLoading(false)
                        }).catch(err => {
                            consoleLogFunc("connect_catch:::", err);
                            setIsLoading(false)
                        })
                    } else {
                        consoleLogFunc("Not initialized",);
                    }
                }, 1000);
            } catch (e) {
                callLinkRef.current = false;
                consoleLogFunc("Instance initializing_V2", e);
                setIsLoading(false)
            }
        }
    }

    const handleDeleteConnection = async (event) => {
        consoleLogFunc("handleDeleteConnection:::", event);

        try {
            setIsLoading(true)
            if (event) {
                await await WalletConnectInstance.getInstance()?.deleteSession(event)
                Singleton.getInstance().showToast?.show("Disconnected successfully", 2000);
            } else {
                await WalletConnectInstance.getInstance()?.deleteAllSessions()
                Singleton.getInstance().showToast?.show("All connections disconnected successfully", 2000);
            }
            await getActiveConnections()
            setIsLoading(false)
        } catch (e) {
            consoleLogFunc("handleDeleteConnection_catch:::", e);
            setIsLoading(false)
        }
    }

    return (
        <ImageBackground
            source={ThemeManager.ImageIcons.mainBgImgNew}
            style={{ flex: 1, backgroundColor: ThemeManager.colors.mainBgNew }}
        >
            <HeaderMain
                BackButtonText={activeConnections.length === 0 ? LanguageManager.setting.walletConnect : ""}
                imgSecond={activeConnections.length === 0 ? images.add : images.icDeleteWC}
                onPressIcon={() => {
                    if (activeConnections.length === 0) {
                        Singleton.getInstance()
                            .cameraPermission()
                            .then((res) => {
                                if (res == "granted") {
                                    Singleton.isCameraOpen = true;
                                    setIsQrScannerVisible(true);
                                }
                            });
                    } else {
                        handleDeleteConnection()
                    }
                }}
                imgSecondStyle={{ tintColor: ThemeManager.colors.blackWhiteText }}
            />

            <View style={[styles.mainView,]}>
                <View style={[styles.mainView, { padding: widthDimen(25), marginBottom: dimen(20) }]}>
                    {activeConnections.length === 0 ? <View style={[styles.emptyWalletConnectionView,]}>
                        <View style={{ alignItems: 'center', justifyContent: 'center' }}>
                            <Image
                                style={{ position: "absolute", }}
                                source={images.icEmptyWalletConnectionBg} resizeMode="contain" />
                            <Image source={images.icEmptyWalletConnection} resizeMode="contain" />
                        </View>
                        <Text style={[styles.emptyWalletConnectionText, { color: ThemeManager.colors.blackWhiteText }]}>{LanguageManager.walletConnection.noConnection}</Text>
                    </View> : <View style={[styles.mainView, { alignItems: "flex-start", }]}>
                        <OnboardingHeadings
                            title={LanguageManager.setting.walletConnect}
                            subTitle={LanguageManager.walletConnection.manageExistingConnections}
                        />
                        <Text style={[styles.activeConnectionsText, { color: ThemeManager.colors.blackWhiteText }]}>Active Connections</Text>

                        <FlatList
                            data={activeConnections}
                            style={{ marginTop: dimen(10), width: "100%" }}
                            renderItem={({ item }) => {
                                let data = item?.peer?.metadata
                                let iconUrl = null
                                if (data?.name == "dYdX v4") {
                                    iconUrl = data?.url + data?.icons[data?.icons?.length - 1]
                                }
                                let finalIcon = iconUrl != null ? iconUrl : data?.icons[data?.icons.length - 1]

                                return <ManageItem
                                    logo={{ uri: finalIcon }}
                                    logoStyle={{ height: dimen(40), width: dimen(40), borderRadius: dimen(14) }}
                                    nameViewStyle={{ flex: 1 }}
                                    walletName={(data?.name?.toString()?.length > 11 ? data?.name?.substring(0, 20) + "..." : data?.name) || 'Home'}
                                    walletType={data?.url?.toString()?.length > 28 ? data?.url?.substring(0, 27) + "..." : data?.url}
                                    onclickWallet={() => { setManageConnectionData({ isVisible: true, wcData: item }) }} />
                            }}
                        />
                    </View>}
                    <Button
                        buttontext={activeConnections.length === 0 ? LanguageManager.walletConnection.addNewConnection : LanguageManager.walletConnection.newConnection}
                        onPress={() => {    
                        // const deepLink = "wc:3ae593c1f17a71e5c0c19f190c665d54a92febb24098acc8ecac3371903ad7e6@2?relay-protocol=irn&symKey=REDACTED&expiryTimestamp=1770537062"                      
                        // handleAddNewConnection(deepLink);
                          
                             Singleton.getInstance()
                                .cameraPermission()
                                .then((res) => {
                                    if (res == "granted") {
                                        Singleton.isCameraOpen = true;
                                        setIsQrScannerVisible(true);
                                    }
                                });
                        }}
                    />

                </View>

            </View>
            <QrScanner
                isVisible={isQrScannerVisible}
                onClose={() => {
                    setIsQrScannerVisible(false);
                }}
                onRead={event => {
                    consoleLogFunc('s>>>>>>>>>>>>>>', event.data);
                    
                    setIsQrScannerVisible(false);
                    handleAddNewConnection(event.data)
                }}
            />

            {isNewConnectionVisible && <NewConnection
                isVisible={isNewConnectionVisible}
                approveRequestData={approveRequestData}
                onClose={() => {
                    setIsNewConnectionVisible(false);
                    WalletConnectInstance.getInstance()?.rejectSession(approveRequestData?.id)
                    setTimeout(() => {
                        getActiveConnections()
                    }, 1000);
                }}
                approveConnection={approveConnection}
            />}

            <ManageConnection
                isVisible={manageConnectionData.isVisible}
                onClose={() => {
                    setManageConnectionData({ isVisible: false, wcData: null });
                }}
                wcData={manageConnectionData.wcData}
                onDisconnect={() => {
                    const event = manageConnectionData.wcData
                    setManageConnectionData({ isVisible: false, wcData: null })
                    handleDeleteConnection(event)
                }}
            />

            <LoaderView isLoading={isLoading} />
        </ImageBackground>
    )
}

export default WalletConnection