import { Alert, NativeModules, Platform } from 'react-native';
import { consoleLogFunc } from '../../Utils/MethodsUtils';

const { WireGuardVPNModule } = NativeModules;

export const createOrUpdateVPN = async (wgConfig) => {
  try {
    await WireGuardVPNModule.createOrUpdateVPN(wgConfig);
  } catch (e) {
    console.error("Failed to create/update VPN config", e);
    throw e;
  }
};

export const startVPN = async () => {
  try {
    await WireGuardVPNModule.startVPN();
  } catch (e) {
    console.error("Failed to start VPN", e);
  }
};


export const stopVPN = async () => {
  await WireGuardVPNModule.stopVPN();
};

export const getVPNStatus = async () => {
  const status = await WireGuardVPNModule.getVPNStatus();
  return status;
};

export const getRuntimeStats = async () => {
  const stats = await WireGuardVPNModule.getRuntimeStats();
  return stats; // parse into an object if needed
};

export const checkTunnelStatus = async () => {
  try {
    const status = await WireGuardVPNModule.getTunnelStatus();
    return status
  } catch (e) {
    consoleLogFunc("Failed to get tunnel status:", e);
  }
};

export const generateWGKeyPair = async () => {
  try {
    const keys = await WireGuardVPNModule.generateWGKeyPair();
    return keys; // { publicKey, privateKey }
  } catch (e) {
    console.error("Key generation failed", e);
    return null;
  }
};

// Handle VPN connection
export const connectVpn = async (wgConfig) => {
  try {
    consoleLogFunc('connectVpn wgConfig--->>>', wgConfig);
    // Check if VPN permission is needed
    const needsPermission = await WireGuardVPNModule.prepareVpn();
    if (needsPermission) {
      // Start activity to request VPN permission
      Alert.alert(
        'VPN Permission Required',
        'Please grant VPN permission to proceed.',
        [
          {
            text: 'OK',
            onPress: async () => {
              await disconnectVpn()
             
              await WireGuardVPNModule.connectVpn(wgConfig);
             
            },
          },
        ]
      );
    } else {
      await disconnectVpn()
      await WireGuardVPNModule.connectVpn(wgConfig);
    }
  } catch (error) {
    console.error('VPN connection error:', error);
  }
};

// Handle VPN disconnection
export const disconnectVpn = async () => {
  try {
    
    let status = await WireGuardVPNModule.getVpnStatus();
    if(status?.toLowerCase() === 'connected'){
      await WireGuardVPNModule.disconnectVpn();
    }
  } catch (error) {
    console.error('VPN disconnection error:', error);
  }
};

export const checkAndGetVpnStatus = async () => {
  const status = await WireGuardVPNModule.getVpnStatus();
  return status; // parse into an object if needed
};

export const getRunningVpnConfig = async () => {
  const status = await WireGuardVPNModule.getVpnConfig();
  return status;
};

export const getEndpointFromConfig =  (configString) => {
  // Split into lines, find the line starting with "Endpoint", then split by "="
  const endpointLine = configString
    .split("\n")
    .find(line => line.trim().toLowerCase().startsWith("endpoint"));

  if (!endpointLine) return null; // No endpoint found

  return endpointLine.split("=")[1]?.trim() || null;
}