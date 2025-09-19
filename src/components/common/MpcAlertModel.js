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
import { ThemeManager } from "../../../ThemeManager";
import { getDimensionPercentage } from "../../Utils";
import { Button } from "./Button";
import { Colors, Fonts } from "../../theme";
import { horizontalScale, verticalScale } from "../../layouts/responsive";

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

const MpcAlertModel = ({ visible, message, onContinue }) => {
  // Animation refs
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (visible) {
      // Entry animation
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
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
          duration: 400,
          useNativeDriver: true,
        }),
      ]).start();

      // Pulse animation for the icon
      const pulseAnimation = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.1,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      );
      pulseAnimation.start();

      return () => {
        pulseAnimation.stop();
      };
    } else {
      // Reset animations when modal closes
      fadeAnim.setValue(0);
      scaleAnim.setValue(0.8);
      slideAnim.setValue(50);
      pulseAnim.setValue(1);
    }
  }, [visible, fadeAnim, scaleAnim, slideAnim, pulseAnim]);

  const handleContinue = () => {
    // Exit animation before calling onContinue
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 0.8,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onContinue();
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
              {/* Header Section */}
              <View style={styles.headerSection}>
                <Animated.View
                  style={[
                    styles.iconContainer,
                    { transform: [{ scale: pulseAnim }] }
                  ]}
                >
                  <LinearGradient
                    colors={[Colors.themeColor, Colors.buttonBgColor]}
                    style={styles.iconGradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                  >
                    <Text style={styles.iconText}>⚡</Text>
                  </LinearGradient>
                </Animated.View>
                
                <Text style={styles.title}>Wallet to Qubetics</Text>
                <Text style={styles.subtitle}>Chain Abstraction Protocol</Text>
              </View>

              {/* Content Section */}
              <View style={styles.contentSection}>
                <Text style={styles.message}>
                  {"Your abstracted wallet isn't set up yet. Generate your addresses now to unlock seamless cross-chain transfers."}
                </Text>
               
              </View>

              {/* Action Section */}
              <View style={styles.actionSection}>
                <TouchableOpacity
                  style={styles.generateButton}
                  onPress={handleContinue}
                  activeOpacity={0.8}
                >
                  <LinearGradient
                    colors={[Colors.themeColor, Colors.buttonBgColor]}
                    style={styles.buttonGradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                  >
                    <Text style={styles.buttonText}>Generate Addresses</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>

              <Text style={styles.description}>Start Setup</Text>
            </LinearGradient>
          </Animated.View>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
};

export default MpcAlertModel;

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
    paddingHorizontal: horizontalScale(20),
  },
  modalView: {
    width: screenWidth * 0.9,
    maxWidth: horizontalScale(400),
    borderRadius: 24,
    overflow: 'hidden',
    shadowColor: Colors.borderShadowColor,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 20,
  },
  modalGradient: {
    padding: horizontalScale(24),
    borderRadius: 24,
  },
  
  // Header Section
  headerSection: {
    alignItems: 'center',
    marginBottom: verticalScale(24),
  },
  iconContainer: {
    width: horizontalScale(80),
    height: horizontalScale(80),
    borderRadius: 40,
    marginBottom: verticalScale(16),
    shadowColor: Colors.themeColor,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
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
    fontSize: 32,
    color: Colors.White,
  },
  title: {
    fontSize: 24,
    fontFamily: Fonts.dmBold,
    color: Colors.White,
    textAlign: 'center',
    marginBottom: verticalScale(4),
    letterSpacing: 0.5,
  },
  subtitle: {
    fontSize: 16,
    fontFamily: Fonts.dmMedium,
    color: Colors.themeColor,
    textAlign: 'center',
    letterSpacing: 1,
  },
  
  // Content Section
  contentSection: {
    marginBottom: verticalScale(24),
  },
  message: {
    fontSize: 18,
    fontFamily: Fonts.dmMedium,
    color: Colors.White,
    textAlign: 'center',
    marginBottom: verticalScale(12),
    lineHeight: 24,
  },
  description: {
    fontSize: 14,
    fontFamily: Fonts.dmRegular,
    color: Colors.grayIcon,
    textAlign: 'center',
    lineHeight: 20,
    opacity: 0.8,
    marginTop: verticalScale(12),
  },
  
  // Action Section
  actionSection: {
    alignItems: 'center',
  },
  generateButton: {
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
    fontFamily: Fonts.dmBold,
    color: Colors.White,
    marginBottom: verticalScale(4),
    letterSpacing: 0.5,
  },
  buttonSubtext: {
    fontSize: 12,
    fontFamily: Fonts.dmMedium,
    color: Colors.White,
    opacity: 0.9,
    letterSpacing: 0.3,
  },
});
