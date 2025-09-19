import { BlurView } from "@react-native-community/blur";
import React, { useRef, useEffect } from "react";
import { 
  Modal, 
  StyleSheet, 
  Text, 
  View, 
  Animated, 
  Dimensions,
  TouchableOpacity,
  Image
} from "react-native";
import LinearGradient from "react-native-linear-gradient";
import { Colors, Fonts, Images } from "../../theme";
import { horizontalScale, verticalScale } from "../../layouts/responsive";
import Singleton from "../../Singleton";
import SingleCard from "../subcommon/molecules/singleCard";
import Clipboard from "@react-native-clipboard/clipboard";

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

const CongratulationModal = ({ visible, onClose, title, message, buttonText = "Continue" }) => {
  // Animation refs
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const confettiAnim = useRef(new Animated.Value(0)).current;
  const checkmarkAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      // Entry animation
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 100,
          friction: 8,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 500,
          useNativeDriver: true,
        }),
      ]).start();

      // Confetti animation
      Animated.timing(confettiAnim, {
        toValue: 1,
        duration: 2000,
        useNativeDriver: true,
      }).start();

      // Checkmark animation
      Animated.sequence([
        Animated.delay(300),
        Animated.timing(checkmarkAnim, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      // Reset animations when modal closes
      fadeAnim.setValue(0);
      scaleAnim.setValue(0.8);
      slideAnim.setValue(50);
      confettiAnim.setValue(0);
      checkmarkAnim.setValue(0);
    }
  }, [visible, fadeAnim, scaleAnim, slideAnim, confettiAnim, checkmarkAnim]);

  const handleClose = () => {
    // Exit animation before calling onClose
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 0.8,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onClose();
    });
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      statusBarTranslucent
    >
      <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
        <BlurView
          style={styles.blurView}
          blurType="dark"
          blurAmount={10}
          reducedTransparencyFallbackColor="rgba(0,0,0,0.8)"
        />
        
        <Animated.View
          style={[
            styles.overlay,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }]
            }
          ]}
        >
          <Animated.View
            style={[
              styles.modalView,
              {
                transform: [{ scale: scaleAnim }]
              }
            ]}
          >
            <LinearGradient
              colors={[Colors.newColor, '#1A202E']}
              style={styles.modalGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              {/* Confetti Animation */}
              <Animated.View
                style={[
                  styles.confettiContainer,
                  {
                    opacity: confettiAnim,
                    transform: [
                      {
                        scale: confettiAnim.interpolate({
                          inputRange: [0, 1],
                          outputRange: [0, 1],
                        }),
                      },
                    ],
                  },
                ]}
              >
                {[...Array(6)].map((_, index) => (
                  <Animated.View
                    key={index}
                    style={[
                      styles.confetti,
                      {
                        transform: [
                          {
                            rotate: confettiAnim.interpolate({
                              inputRange: [0, 1],
                              outputRange: ['0deg', '360deg'],
                            }),
                          },
                        ],
                      },
                    ]}
                  />
                ))}
              </Animated.View>

              {/* Header Section */}
              <View style={styles.headerSection}>
                <Animated.View
                  style={[
                    styles.iconContainer,
                    {
                      transform: [
                        {
                          scale: checkmarkAnim.interpolate({
                            inputRange: [0, 0.5, 1],
                            outputRange: [0, 1.2, 1],
                          }),
                        },
                      ],
                    },
                  ]}
                >
                  <LinearGradient
                    colors={[Colors.successColor, '#22AB48']}
                    style={styles.iconGradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                  >
                    <Animated.Text
                      style={[
                        styles.iconText,
                        {
                          opacity: checkmarkAnim,
                        },
                      ]}
                    >
                      ✓
                    </Animated.Text>
                  </LinearGradient>
                </Animated.View>
                
                <Text style={styles.title}>
                  {"Congratulations"}
                </Text>
                <Text style={styles.subtitle}>Your abstraction wallet address was created successfully and is now ready for use.</Text>
              </View>

              {/* Content Section */}
              <View style={styles.contentSection}>
                <Text style={styles.message}>
                  {"To begin seamless cross-chain transfers, fund the following wallet addresses from the Qubetics wallet or an external wallet."}
                </Text>
              </View>

              <View style={styles.contentSection}>
                <Text style={[styles.message, {width: '100%', textAlign: 'left'}]}>{"TICS Address"}</Text>
                <View style={{
                  marginBottom: verticalScale(12),
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  backgroundColor: '#212730',
                  padding: horizontalScale(10),
                  borderRadius: 12,
                  marginTop: 3
                }}>
                  <Text
                    numberOfLines={1}
                    style={[styles.message, { width: '90%' }]}>{Singleton.getInstance().defaultMpcEthAddress}</Text>
                  <TouchableOpacity
                    onPress={() => {
                      Singleton.getInstance().showToast.show("Copied to clipboard");
                      Clipboard.setString(Singleton.getInstance().defaultMpcEthAddress);
                    }}
                  >
                    <Image source={Images.copyNew} />
                  </TouchableOpacity>
                </View>

                <Text style={[styles.message, {width: '100%', textAlign: 'left', marginTop: 10}]}>{"BTC Address"}</Text>
                <View style={{
                  marginBottom: verticalScale(12),
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  backgroundColor: '#212730',
                  padding: horizontalScale(8),
                  borderRadius: 12,
                }}>
                  <Text
                    numberOfLines={1}
                    style={[styles.message, { width: '90%' }]}>{Singleton.getInstance().defaultMpcBtcAddress}</Text>
                  <TouchableOpacity
                    onPress={() => {
                      Singleton.getInstance().showToast.show("Copied to clipboard");
                      Clipboard.setString(Singleton.getInstance().defaultMpcBtcAddress);
                    }}
                  >
                    <Image source={Images.copyNew} />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Action Section */}
              <View style={styles.actionSection}>
                <TouchableOpacity
                  style={styles.continueButton}
                  onPress={handleClose}
                  activeOpacity={0.8}
                >
                  <LinearGradient
                    colors={[Colors.themeColor, Colors.buttonBgColor]}
                    style={styles.buttonGradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                  >
                    <Text style={styles.buttonText}>{buttonText}</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </LinearGradient>
          </Animated.View>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
};

export default CongratulationModal;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  blurView: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    right: 0,
    flex: 1,
  },
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: horizontalScale(10),
  },
  modalView: {
    width: screenWidth * 0.9,
    maxWidth: horizontalScale(400),
    borderRadius: 24,
    overflow: 'hidden',
    shadowColor: Colors.successColor,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 20,
  },
  modalGradient: {
    paddingVertical: horizontalScale(24),
    paddingHorizontal: horizontalScale(10),
    borderRadius: 24,
  },
  
  // Confetti Animation
  confettiContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1,
  },
  confetti: {
    position: 'absolute',
    width: 8,
    height: 8,
    backgroundColor: Colors.themeColor,
    borderRadius: 4,
  },
  
  // Header Section
  headerSection: {
    alignItems: 'center',
    marginBottom: verticalScale(24),
    zIndex: 2,
  },
  iconContainer: {
    width: horizontalScale(80),
    height: horizontalScale(80),
    borderRadius: 40,
    marginBottom: verticalScale(16),
    shadowColor: Colors.successColor,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  iconGradient: {
    width: '100%',
    height: '100%',
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconText: {
    fontSize: 36,
    color: Colors.White,
    fontFamily: Fonts.DMSansBold,
  },
  title: {
    fontSize: 24,
    fontFamily: Fonts.DMSansBold,
    color: Colors.White,
    textAlign: 'center',
    marginBottom: verticalScale(4),
    letterSpacing: 0.5,
  },
  subtitle: {
    fontSize: 16,
    fontFamily: Fonts.dmMedium,
    color: Colors.White,
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  
  // Content Section
  contentSection: {
    marginBottom: verticalScale(24),
    zIndex: 2,
  },
  message: {
    fontSize: 16,
    fontFamily: Fonts.DMSansRegular,
    color: Colors.White,
    textAlign: 'center',
    lineHeight: 24,
    opacity: 0.9,
  },
  
  // Action Section
  actionSection: {
    alignItems: 'center',
    zIndex: 2,
  },
  continueButton: {
    width: '100%',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: Colors.themeColor,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  buttonGradient: {
    paddingVertical: verticalScale(16),
    paddingHorizontal: horizontalScale(24),
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    fontSize: 18,
    fontFamily: Fonts.DMSansBold,
    color: Colors.White,
    letterSpacing: 0.5,
  },
});
