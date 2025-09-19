import { BlurView } from "@react-native-community/blur";
import Lottie from "lottie-react-native";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Linking,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { EventRegister } from "react-native-event-listeners";
import { Actions } from "react-native-router-flux";
import { ThemeManager } from "../../../ThemeManager";
import * as Constants from "../../Constants";
import { CHAIN_ABSTRACTION_URL } from "../../EndPoint";
import { Colors, Fonts, Images } from "../../theme";
import images from "../../theme/Images";
import { dimen, heightDimen, screenWidth, widthDimen } from "../../Utils";
import SuccessAbstraction from "./SuccessAbstraction";
import Singleton from "../../Singleton";
import Clipboard from "@react-native-clipboard/clipboard";

const ProcessingTransaction = ({
  item,
  visible,
  onClose,
  intentHash,
  isFromSwap,
  fees,
}) => {
  // console.log('item----ProcessingTransaction', fees,item);

  const txnFees =
    fees || "0.001" + " " + (item?.coin_data?.coin_symbol || item?.coin_symbol)?.toUpperCase();
  const timerRef = useRef(null);
  const [isLoading, setIsLoading] = useState(true);
  const [swapStatusData, setSwapStatusData] = useState(null);
  const [successAbstractionVisible, setSuccessAbstractionVisible] = useState(false);

  useEffect(() => {
    EventRegister.addEventListener(Constants.DOWN_MODAL, () => {
      setSuccessAbstractionVisible(false);
    });
    return () => {};
  }, []);

  useEffect(() => {
    if (visible) {
      console.log(
        "CHAIN_ABSTRACTION_URL + intentHash>>",
        CHAIN_ABSTRACTION_URL + intentHash
      );
      setSuccessAbstractionVisible(false);
      setIsLoading(true);
      setTimeout(() => {
        getSwapStatus()
      }, 2000);
    } else {
      timerRef.current && clearTimeout(timerRef.current)
    }
  }, [visible]);

  const getSwapStatus = () => {
    console.log("getSwapStatus>>11");
    if (visible) {
      console.log("getSwapStatus>>222");

      fetch(CHAIN_ABSTRACTION_URL + intentHash)
        .then((res) => res.json())
        .then((data) => {
          setIsLoading(false);
          console.log("data>>222",data);

          if (data?.error) {
            timerRef.current = setTimeout(() => {
              getSwapStatus();
            }, 5000);
          } else {
            setSwapStatusData(data?.data);
            setSuccessAbstractionVisible(true);
          }
        })
        .catch((err) => {
          console.log("ERR>>", err);
          setIsLoading(false);
          if (isFromSwap) {
            timerRef.current = setTimeout(() => {
              getSwapStatus();
            }, 5000);
          }
        })
        .catch((err) => {
          console.log("OTHER ERR>>", err);
        });
    }
  };

  return (
    <Modal
      onRequestClose={onClose}
      visible={visible}
      transparent
      animationType="fade"
    >
      <BlurView
        style={styles.blurView}
        blurType="light"
        blurAmount={2}
        reducedTransparencyFallbackColor="white"
      />
      <View style={styles.overlay}>
        <View
          style={[
            styles.modal,
            { backgroundColor: ThemeManager.colors.mnemonicsBg },
          ]}
        >
          <TouchableOpacity onPress={onClose}
          style={{position: 'absolute', top: dimen(10), right: dimen(10), padding: 20, zIndex: 2}}
          >
            <Image source={images.closeIcon} style={{ width: dimen(25), height: dimen(25) }} />
          </TouchableOpacity>
          {isLoading ? (
            <ActivityIndicator size="large" color="#00bfff" />
          ) : successAbstractionVisible && +swapStatusData?.status >= 0 ? (
            <SuccessAbstraction
              visible={successAbstractionVisible}
              onClose={() => {
                onClose();
                isFromSwap && Actions.jump("WalletMain");
              }}
              txnFees={txnFees}
              swapStatusData={swapStatusData}
            />
          ) : (
            <View
              style={{
                alignItems: "center",
                justifyContent: "center",
                width: "100%",
              }}
            >
              <Lottie
                style={{ height: heightDimen(150), width: widthDimen(150) }}
                source={Images.blueLoader}
                autoPlay
                loop={true}
              />
              <Text
                onPress={onClose}
                style={[
                  styles.title,
                  { color: ThemeManager.colors.blackWhiteText },
                ]}
              >
                Processing Transaction
              </Text>
              <Text style={[styles.subtitle, { color: Colors.grayIcon }]}>
                Transaction under confirmation...
              </Text>

              <View style={styles.stepContainer}>
                <StepItem
                  label="Validating transaction"
                  checked={"validating"}
                  inProgress={"validating"}
                />
                <StepItem
                  label="Broadcasting to network"
                  checked={""}
                  inProgress={"broadcasting"}
                />
                {/* <StepItem
                  label="Confirming on blockchain"
                  checked={'confirming'}
                  inProgress={'confirming'}
                /> */}
              </View>

              <View style={{
                 marginTop: dimen(10), 
                 marginHorizontal: dimen(25),
                backgroundColor: ThemeManager.colors.inputBgNew,
                 padding: dimen(10),
                  borderRadius: dimen(10),
                  flexDirection: "row" }}>
                <Text
                numberOfLines={1}
                ellipsizeMode="middle"
                style={[styles.transactionHash, { color: ThemeManager.colors.blackWhiteText }]}>
                  {intentHash}
                </Text>

                <TouchableOpacity
                onPress={() => {
                  Clipboard.setString(intentHash);
                  Singleton.getInstance().showToast?.show("Copied to clipboard", 2000);
                }}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Image source={images.copyNew}
                   style={{
                    resizeMode: "contain",
                    width: dimen(15), height: dimen(15), tintColor: ThemeManager.colors.blackWhiteText }} />
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => {
                    Linking.openURL("https://testnet.qubetics.work/tx/" + intentHash);
                  }}
                style={{ marginLeft: dimen(10) }}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Image source={images.sendOutlined}
                   style={{
                    resizeMode: "contain",
                    width: dimen(15), height: dimen(15), tintColor: ThemeManager.colors.blackWhiteText }} />
                </TouchableOpacity>
              </View>

              <Text style={[styles.note, { color: Colors.grayIcon }]}>
                This may take a few minutes depending on network congestion
              </Text>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
};

export default ProcessingTransaction;

const StepItem = ({ label, checked, inProgress }) => (
  <View style={styles.stepItem}>
    <Text
      style={[styles.stepLabel, { color: ThemeManager.colors.blackWhiteText }]}
    >
      {label}
    </Text>
    {checked ? (
      <Image
        source={images.tickIcon}
        style={{ tintColor: Colors.profitColor }}
      />
    ) : inProgress ? (
      <Lottie
        style={{
          height: heightDimen(50),
          width: widthDimen(50),
          marginBottom: dimen(10),
        }}
        source={Images.blueLoader}
        autoPlay
        loop={true}
      />
    ) : (
      <Image
        source={images.tickIcon}
        style={{ tintColor: Colors.profitColor }}
      />
    )}
  </View>
);

const styles = StyleSheet.create({
  blurView: {
    position: "absolute",
    top: 0,
    left: 0,
    bottom: 0,
    right: 0,
    flex: 1,
  },
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.8)",
    justifyContent: "center",
    alignItems: "center",
  },
  modal: {
    width: screenWidth - dimen(60),
    minHeight: screenWidth - dimen(60),
    borderRadius: dimen(30),
    padding: dimen(20),
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    marginTop: dimen(12),
    fontSize: dimen(20),
    fontFamily: Fonts.dmBold,
  },
  subtitle: {
    fontSize: dimen(14),
    color: "#444",
    marginVertical: dimen(10),
    textAlign: "center",
    fontFamily: Fonts.dmRegular,
  },
  stepContainer: {
    width: "100%",
    marginTop: dimen(10),
    paddingHorizontal: dimen(10),
  },
  stepItem: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: dimen(10),
    justifyContent: "space-between",
  },
  stepLabel: {
    marginLeft: dimen(10),
    fontSize: dimen(16),
    color: "#333",
  },
  note: {
    fontSize: dimen(12),
    color: Colors.textColor,
    textAlign: "center",
    marginVertical: dimen(30),
    maxWidth: "80%",
  },

  transactionHash: {
    fontSize: dimen(12),
    color: ThemeManager.colors.blackWhiteText,
    fontFamily: Fonts.dmRegular,
  },
});
