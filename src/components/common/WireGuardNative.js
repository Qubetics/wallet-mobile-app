import { NativeModules, Platform } from 'react-native';

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
    console.log("Failed to get tunnel status:", e);
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
