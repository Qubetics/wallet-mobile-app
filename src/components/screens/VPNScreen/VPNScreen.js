import React, { useEffect, useState } from "react";
import { View, Button, Text, NativeModules, Platform } from "react-native";
import {
  startVPN,
  stopVPN,
  getRuntimeStats,
  createOrUpdateVPN,
  disconnectVpn,
  connectVpn,
} from "../../common/WireGuardNative";

/*
PrivateKey = REDACTED
Address = 192.168.2.1/24
ListenPort = 51820


PublicKey = Dqqcavx33/67s6vVqY4GviYviTZZ8Ul9hbEKwZRRQ34=
AllowedIPs = 192.168.2.2/32, 10.1.72.122/32
Endpoint = 111.119.221.45:51820
PersistentKeepalive = 25


*/
export default function VPNScreen() {
  const [stats, setStats] = useState("");
  const [connected, setConnected] = useState(false);

  const sampleConfig = `[Interface]
            PrivateKey = REDACTED
            Address = 192.168.2.1/24
            DNS = 1.1.1.1

            [Peer]
            PublicKey = Dqqcavx33/67s6vVqY4GviYviTZZ8Ul9hbEKwZRRQ34=
            AllowedIPs = 0.0.0.0/0
            Endpoint = 111.119.221.45:51820
            PersistentKeepalive = 25`;

  const { WireGuardVPNModule } = NativeModules;
  console.log("Available Native Modules:", NativeModules);

  useEffect(() => {}, []);
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const runtimeStats = await getRuntimeStats();
        setStats(JSON.stringify(runtimeStats, null, 2));
      } catch (e) {
        console.error("Failed to fetch stats", e);
      }
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  const toggleVPN = async () => {
    try {
      if (connected) {
        Platform.OS === 'android' ? await disconnectVpn() : await stopVPN();
        // await stopVPN();
        setConnected(false);
      } else {
       Platform.OS === 'android' ? await connectVpn(sampleConfig) : await createOrUpdateVPN(sampleConfig);
        Platform.OS === 'ios' && await startVPN();
        setConnected(true);
      }
    } catch (e) {
      console.error("VPN toggle error1", e);
    }
  };

  return (
    <View style={{ padding: 20, marginTop: 100 }}>
      <Button
        title={connected ? "Disconnect VPN" : "Connect VPN"}
        onPress={toggleVPN}
      />
      <Text style={{ marginTop: 20 }}>{stats}</Text>
    </View>
  );
}
