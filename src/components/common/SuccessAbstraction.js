import React from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Clipboard,
  ToastAndroid,
  Linking,
} from 'react-native';
import { ThemeManager } from '../../../ThemeManager';
import { Button } from './Button';
import { dimen } from '../../Utils';
import { BlurView } from '@react-native-community/blur';
import { Images } from '../../theme';
import Singleton from '../../Singleton';
import { CHAIN_ABSTRACTION_EXPLORER } from '../../Constants';

const SuccessAbstraction = ({
  txnFees,
  onClose,
  onExplorerPress,
  solver = 'UniSwap Protocol V3',
  networkFee,
  fromToken,
  swapStatusData
}) => {
  // console.log("swapStatusData>>", swapStatusData);

  const txHash = swapStatusData?.intentHash;
  console.log("txHash>>11", txHash);

  const { status = 1 } = swapStatusData;

  const getStatusText = (statusValue) => {
    console.log("STATUS VALUE>>", statusValue);
    
    switch (statusValue) {
      case 0:
        return {
          title: "Transaction Failed",
          status: 'Failed',
          image: Images.abFailed,
        };
      case 1:
        return {
          title: "Transaction Successful",
          status: 'Confirmed',
          image: Images.abSuccess,
        };
      case 2:
        return {
          title: "Transaction Processing",
          status: 'Pending',
          image: Images.abPending,
        };
      default:
        return statusValue;
    }
  };

  const copyToClipboard = () => {
    Clipboard.setString(txHash);
    Singleton.getInstance().showToast?.show("Copied to clipboard", 2000);
  };

  return (
    <View style={{ ...styles.modalContainer, backgroundColor: ThemeManager.colors.mnemonicsBg }}>
      <Image
            source={getStatusText(status)?.image} 
            style={styles.checkIcon}
          />
      <Text style={{ ...styles.title, color: ThemeManager.colors.blackWhiteText }}>{getStatusText(status)?.title}!</Text>
      <Text style={{ ...styles.subtitle, color: ThemeManager.colors.legalGreyColor }}>Your abstraction has been completed</Text>

      {/* Hash box */}
      <View style={{ ...styles.hashContainer, backgroundColor: ThemeManager.colors.inputBgNew }}>
        <Text style={{ ...styles.hashLabel, color: ThemeManager.colors.legalGreyColor }}>Transaction Hash</Text>
        <View style={styles.hashRow}>
          <Text style={{ ...styles.hashText, color: ThemeManager.colors.blackWhiteText }} numberOfLines={1}>
            {txHash}
          </Text>
          <TouchableOpacity onPress={copyToClipboard}>
            <Image
                  source={Images.copy1} // ✅ Replace with your copy icon
                  style={styles.copyIcon}
                />
          </TouchableOpacity>
        </View>
      </View>

      {/* Info Rows */}
      <View style={styles.infoRow}>
        <Text style={{ ...styles.infoLabel, color: ThemeManager.colors.legalGreyColor }}>Status</Text>
        <Text style={{ ...styles.infoValue, color: ThemeManager.colors.blackWhiteText }}>
          {getStatusText(status)?.status}
        </Text>
      </View>
      {swapStatusData?.solverId != "" && <View style={styles.infoRow}>
            <Text style={{...styles.infoLabel,color:ThemeManager.colors.legalGreyColor}}>Solver</Text>
            <Text 
            numberOfLines={1}
            ellipsizeMode='middle'
            
            style={{...styles.infoValue,color:ThemeManager.colors.blackWhiteText, width: '50%'}}>{swapStatusData?.solverId}</Text>
          </View>}
      <View style={styles.infoRow}>
        <Text style={{ ...styles.infoLabel, color: ThemeManager.colors.legalGreyColor }}>Network Fee</Text>
        <Text style={{ ...styles.infoValue, color: ThemeManager.colors.blackWhiteText }}>{txnFees}</Text>
      </View>
      {/* <View style={styles.infoRow}>
            <Text style={{...styles.infoLabel,color:ThemeManager.colors.legalGreyColor}}>Confirmation Time</Text>
            <Text style={{...styles.infoValue,color:ThemeManager.colors.blackWhiteText}}>{time}</Text>
          </View> */}

      {/* Buttons */}
      <View style={styles.buttonRow}>
        
        <View style={{ flex: 1, marginRight: dimen(10) }}>
          <Button 
          normalBtn1={true}
          buttontext={"Close"} onPress={onClose} />
        </View>
        <View style={{ flex: 1, marginLeft: dimen(10) }}>
          <Button buttontext={"View on Explorer"} onPress={()=>{
            Linking.openURL(`${CHAIN_ABSTRACTION_EXPLORER}${txHash}`);
          }} />
        </View>
        {/* <TouchableOpacity style={{...styles.explorerBtn,backgroundColor:ThemeManager.colors.inputBgNew}} onPress={onExplorerPress}>
              <Text style={{...styles.explorerText,color:ThemeManager.colors.blackWhiteText}}>View on Explorer</Text>
            </TouchableOpacity> */}
      </View>
    </View>
  );
};

export default SuccessAbstraction;

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  blurView: {
    position: "absolute",
    top: 0,
    left: 0,
    bottom: 0,
    right: 0,
    flex: 1,
  },
  modalContainer: {
    // backgroundColor: '#fff',
    borderRadius: 16,
    padding: 10,
    width: '100%',
    alignItems: 'center',
  },
  checkIcon: {
    width: 60,
    height: 60,
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 6,
    color: '#111',
  },
  subtitle: {
    fontSize: 13,
    color: '#666',
    marginBottom: 16,
  },
  hashContainer: {
    width: '100%',
    backgroundColor: '#F1F5F9',
    borderRadius: 10,
    padding: 10,
    marginBottom: 16,
  },
  hashLabel: {
    fontSize: 12,
    color: '#555',
    marginBottom: 6,
  },
  hashRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  hashText: {
    flex: 1,
    color: '#222',
    fontSize: 13,
    marginRight: 10,
  },
  copyIcon: {
    width: 12,
    height: 12,
    tintColor: '#666',
    resizeMode: 'contain',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginVertical: 4,
  },
  infoLabel: {
    fontSize: 13,
    color: '#555',
  },
  infoValue: {
    fontSize: 13,
    color: '#111',
    fontWeight: '500',
  },
  buttonRow: {
    flexDirection: 'row',
    marginTop: 24,
    width: '100%',
    justifyContent: 'space-between',
  },
  closeBtn: {
    flex: 1,
    backgroundColor: '#E2E8F0',
    paddingVertical: 12,
    borderRadius: 10,
    marginRight: 8,
  },
  explorerBtn: {
    flex: 1,
    backgroundColor: '#3B82F6',
    paddingVertical: 12,
    borderRadius: 10,
    marginLeft: 8,
  },
  closeText: {
    textAlign: 'center',
    color: '#111',
    fontWeight: '500',
  },
  explorerText: {
    textAlign: 'center',
    color: '#fff',
    fontWeight: '500',
  },
});
