import { Tendermint34Client } from "@cosmjss/tendermint-rpc";
import { QueryClientImpl } from "cosmjs-types/cosmos/bank/v1beta1/query";
import { StargateClient } from "@cosmjss/stargate";
const { DirectSecp256k1HdWallet, Registry } = require("@cosmjss/proto-signing");
const {
  SigningStargateClient,
  QueryClient,
  createProtobufRpcClient,
  defaultRegistryTypes,
} = require("@cosmjss/stargate");
const { stringToPath } = require("@cosmjss/crypto");
import { MsgStartSubscriptionRequest } from "../../../../generated/qubetics/subscription/v3/msg";
import { startVpnSessionOnChain } from "./startVpnSessionOnChain";

export const startSubscriptionOnChain = async ({
  mnemonic,
  url,
  rpc,
  id,
  node_address
}) => {
  try {
    if (!mnemonic || typeof mnemonic !== "string") {
      throw new Error("Invalid or missing mnemonic");
    }

    const prefix = "qubetics";
    const hdPath = stringToPath("m/44'/60'/0'/0/0");

    const wallet = await DirectSecp256k1HdWallet.fromMnemonic(mnemonic, {
      prefix,
      hdPaths: [hdPath],
    });
    const [account] = await wallet.getAccounts();
    const userAddress = account.address;

    const registry = new Registry([
      [
        "/qubetics.subscription.v3.MsgStartSubscriptionRequest",
        MsgStartSubscriptionRequest,
      ],
    ]);

    const client = await SigningStargateClient.connectWithSigner(rpc, wallet, {
      registry,
    });
    const msg = {
      typeUrl: "/qubetics.subscription.v3.MsgStartSubscriptionRequest",
      value: MsgStartSubscriptionRequest.fromPartial({
        from: userAddress,
        id: id,
        denom: "tics",
        renewal_price_policy: 1,
      }),
    };

    const fee = {
      amount: [{ denom: "tics", amount: "1" }],
      gas: "1000000",
    };

    const result = await client.signAndBroadcast(userAddress, [msg], fee);
      console.log("✅ startSubscriptionOnChain--->>>>", result);

    if (result.code === 0) {

      // 🔍 Extract ID from event logs
      let subscriptionId = null;
      for (const event of result.events || []) {
        if (
          event.type === "qubetics.subscription.v3.EventCreate" ||
          event.type === "qubetics.subscription.v3.EventPay"
        ) {
          for (const attr of event.attributes) {
            if (attr.key === "id" || attr.key === "\"id\"") {
              try {
                const rawId = attr.value;
                // Cleanup quotes and convert to number
                subscriptionId = parseInt(rawId.replace(/"/g, ""));
                break;
              } catch (_) {}
            }
          }
        }
        if (subscriptionId !== null) break;
      }

      if (!subscriptionId) {
        console.warn("⚠️ Could not extract subscription ID from transaction logs.");
        return null;
      }
      const response =  await startVpnSessionOnChain({
        mnemonic: mnemonic?.toLowerCase()?.trim(),
        url:url,
        rpc:rpc,
        id: subscriptionId,
        node_address:node_address
      });

      return response;
    } else {
      console.error("❌ Failed to start session", result);
      return null;
    }
  } catch (err) {
    console.error("RPC error", err);
    return null;
  }
};

export const getBalance = async ({ denom, address, rcp }) => {
  try {
        console.log("✅`8`", { denom, address, rcp });

    const tendermint = await Tendermint34Client.connect(rcp);
    console.log("✅`9`", tendermint);

    const queryClient = new QueryClient(tendermint);
    console.log("✅`10`", queryClient);

    const rpcClient = createProtobufRpcClient(queryClient);
    console.log("✅`11`", rpcClient);

    const bankQueryService = new QueryClientImpl(rpcClient);
    console.log("✅`12`", bankQueryService);

    const { balance } = await bankQueryService.Balance({
      address,
      denom,
    });
    console.log("✅`13`", balance);

    return formatTics(balance.amount);
  } catch (error) {
    console.error(error);
  }
};

const formatTics = (amount, decimals = 18) => {
  const padded = amount.toString().padStart(decimals + 1, "0");
  const whole = padded.slice(0, -decimals);
  const fraction = padded.slice(-decimals).replace(/0+$/, "");
  return fraction ? `${whole}.${fraction}` : whole;
};


export const handlePurchase = async ({ mnemonic, rpc, id }) => {
      console.log("✅`1`");

  try {
    if (!mnemonic || typeof mnemonic !== "string") {
      throw new Error("Invalid or missing mnemonic");
    }
      console.log("✅`2`");

    const prefix = "qubetics";
    const hdPath = stringToPath("m/44'/60'/0'/0/0");
      console.log("✅`3`");

    // 🔑 Wallet setup
    const wallet = await DirectSecp256k1HdWallet.fromMnemonic(mnemonic, {
      prefix,
      hdPaths: [hdPath],
    });
    const [account] = await wallet.getAccounts();
    const userAddress = account.address;
      console.log("✅`4`");

    // 🔑 Message registry
    const registry = new Registry([
      [
        "/qubetics.subscription.v3.MsgStartSubscriptionRequest",
        MsgStartSubscriptionRequest,
      ],
    ]);
      console.log("✅`5`");

    // 🔑 Client setup
    const client = await SigningStargateClient.connectWithSigner(rpc, wallet, {
      registry,
    });
      console.log("✅`6`");

    // 🔑 Subscription message
    const msg = {
      typeUrl: "/qubetics.subscription.v3.MsgStartSubscriptionRequest",
      value: MsgStartSubscriptionRequest.fromPartial({
        from: userAddress,
        id,
        denom: "tics",
        renewal_price_policy: 1,
      }),
    };
      console.log("✅`7`");

    // 🔑 Fee
    const fee = {
      amount: [{ denom: "tics", amount: "1" }],
      gas: "1000000",
    };
      console.log("✅`8`");

    // 🔑 Broadcast transaction
    const result = await client.signAndBroadcast(userAddress, [msg], fee);
    console.log("✅ handlePurchase result:", result);

    if (result.code === 0) {
      // Extract subscriptionId from logs
      let subscriptionId = null;
      for (const event of result.events || []) {
        if (
          event.type === "qubetics.subscription.v3.EventCreate" ||
          event.type === "qubetics.subscription.v3.EventPay"
        ) {
          for (const attr of event.attributes) {
            if (attr.key === "id" || attr.key === "\"id\"") {
              try {
                subscriptionId = parseInt(attr.value.replace(/"/g, ""));
                break;
              } catch (_) {}
            }
          }
        }
        if (subscriptionId !== null) break;
      }

      if (!subscriptionId) {
        console.warn("⚠️ Could not extract subscription ID from transaction logs.");
        return null;
      }

      return { subscriptionId, txHash: result.transactionHash };
    } else {
      console.error("❌ Failed to start subscription", result);
      return null;
    }
  } catch (err) {
    console.error("RPC error in handlePurchase:", err);
    return null;
  }
};
