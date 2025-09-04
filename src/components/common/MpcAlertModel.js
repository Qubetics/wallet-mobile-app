import { BlurView } from "@react-native-community/blur";
import React from "react";
import { Modal, StyleSheet, Text, View } from "react-native";
import { ThemeManager } from "../../../ThemeManager";
import { getDimensionPercentage } from "../../Utils";
import { Button } from "./Button";

const MpcAlertModel = ({ visible, message, onContinue }) => {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucentßß
    >
            <BlurView
        style={styles.blurView}
        blurType="light"
        blurAmount={3}
        reducedTransparencyFallbackColor="white"
      />
      <View style={styles.overlay}>
      <View style={[styles.modalView, { backgroundColor: ThemeManager.colors.whiteBlacktext, borderColor: ThemeManager.colors.whiteBlacktext }]}>

          <Text style={[styles.message,{ color: ThemeManager.colors.blackWhiteText }]}>{message}</Text>

          <Button
            isNeedToClose={true}
            onPress={() => {
              onContinue()
            }}
            buttontext={'Continue'}
          />
        </View>
      </View>
    </Modal>
  );
};

export default MpcAlertModel;

const styles = StyleSheet.create({
  overlay: {
    backgroundColor: 'rgba(0,0,0,0.2)',
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 18,
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    elevation: 1,
  },
  container: {
    width: "80%",
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 20,
    alignItems: "center",
    elevation: 5,
  },
  message: {
    textAlign: 'center',
    fontSize: 16,
    marginTop: 10,
    marginBottom: 15,
  },
  button: {
    backgroundColor: "#007BFF",
    paddingVertical: 10,
    paddingHorizontal: 30,
    borderRadius: 8,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  blurView: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    right: 0,
    flex: 1,
  },
  modalView: {
    // backgroundColor: Colors.successColor,
    borderRadius: 12,
    padding: getDimensionPercentage(20),
    width: '90%',
    borderWidth: 1,
  },
});
