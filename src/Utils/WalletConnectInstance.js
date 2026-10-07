//***********FOR_WALLET_CONNECT_V2_NEW***************/
import { Core } from "@walletconnect/core";
import { Web3Wallet } from "@walletconnect/web3wallet";
import { EventRegister } from "react-native-event-listeners";
import { getSdkError } from "@walletconnect/utils";
import Singleton from "../Singleton";
import { MAIN_URL } from "../EndPoint";
import { consoleLogFunc } from "./MethodsUtils";

const core = new Core({
  // projectId: "REDACTED"
  // projectId: "REDACTED",
  projectId: "REDACTED",
});

export default class WalletConnectInstance {
  static myInstance = null;
  web3Wallet = null;
  invalidQR = null;
  smartContractCallInterval = null;
  /**
   * Singleton to get the instance of the WalletConnectInstance
   * @return {WalletConnectInstance} - The instance of the WalletConnectInstance
   */

  static getInstance() {
    if (WalletConnectInstance.myInstance == null) {
      consoleLogFunc("WalletConnectInstance Initialize");

      WalletConnectInstance.myInstance = new WalletConnectInstance();
      WalletConnectInstance.myInstance.initializeWalletConnect();
    }
    return this.myInstance;
  }

  initializeWalletConnect = async () => {
    try {
      this.web3Wallet = await Web3Wallet.init({
        core, // <- pass the shared `core` instance
        metadata: {
          name: "Qubetics Wallet",
          description: "Qubetics Wallet",
          url: MAIN_URL,
          icons: ["https://walletconnect.com/walletconnect-logo.png"],
        },
      });
    } catch (error) {
      consoleLogFunc("error>>>", error);
    }

    // Approval: Using this listener for sessionProposal, you can accept the session
    this.web3Wallet?.on("session_proposal", async (proposal) => {
      consoleLogFunc("session_proposal>>>>>>", JSON.stringify(proposal));

      EventRegister.emitEvent("sessionProposal", proposal);
      clearTimeout(this.invalidQR);
    });

    this.web3Wallet?.on("session_delete", async (proposal) => {
      consoleLogFunc("session_deletesession_delete proposal>>>", proposal);
      EventRegister.emitEvent("sessionDeleted", proposal);
      let requests = this.web3Wallet?.getPendingSessionRequests();

      requests.map(async (el) => {
        //Delete all pending requests for particular session before disconnecting the session
        if (el?.topic == topic) {
          const response = {
            id: el?.id,
            jsonrpc: "2.0",
            error: {
              code: 5000,
              message: "User rejected.",
            },
          };
          try {
            await this.web3Wallet?.respondSessionRequest({
              topic: el?.topic,
              response: response,
            });
          } catch (e) {
            consoleLogFunc('--------------error--wc', e)
          }
        }
      });
    });

    this.web3Wallet?.on("session_request", async (event) => {
      consoleLogFunc("session_request>>>>>>", JSON.stringify(event));
      this.sessionRequest(event);
    });

    // this.web3Wallet.on("auth_request", async (authRequest) => {
    //     // consoleLogFunc("authRequest::::::", authRequest)
    //     const { id, params, verifyContext } = authRequest
    //     const validation = this.getVerifyStatus(verifyContext)
    //     const isScam = verifyContext.verified.isScam // true if the domain is flagged as malicious
    //     // consoleLogFunc("testt::::isScam::::::: ", isScam)
    //     // if the domain is flagged as malicious, you can should warn the user as they may lose their funds - check the `Threat` case for more info
    //     if (isScam) {
    //         // show a warning screen to the user
    //         // and proceed only if the user accepts the risk
    //     }

    // })
  };

  connect = async (walletUri) => {
    return new Promise(async (resolve, reject) => {
      try {
        // consoleLogFunc("walletUri>>>", this.web3Wallet);

        const response = await this.web3Wallet.core.pairing.pair({
          uri: walletUri,
        });
        consoleLogFunc("response>>>>>>", response);

        this.invalidQR = setTimeout(() => {
          try {
            if (this.web3Wallet) {
              if (!this.web3Wallet?.connected) {
                Singleton.getInstance().showToast?.show("Invalid QR Code.");
                reject();
              }
            }
          } catch (e) {
            consoleLogFunc("exception--------", e);
          }
        }, 15000);
        resolve();
      } catch (error) {
        Singleton.getInstance().showToast?.show("Invalid QR Code.", 3000);
        consoleLogFunc("-------------connectionError", error);
        reject(error);
      }
    });
  };

  rejectSession = (id) => {
    this.web3Wallet.rejectSession({
      id: id,
      reason: getSdkError("USER_REJECTED_METHODS"),
    });
  };

  sessionRequest = async (payload) => {
    consoleLogFunc("sessionRequest----", payload?.params?.request?.method, JSON.stringify(payload));
    try {

      if (payload?.params?.request?.method === "wallet_switchEthereumChain") {
        consoleLogFunc("wallet_switchEthereumChain----INSIDE");
      
        const chainParams = payload?.params?.request?.params?.[0];
        const hexChainId = chainParams?.chainId;
        const decimalChainId = parseInt(hexChainId, 16);
      
        consoleLogFunc("🔀 Switch network request:", decimalChainId);
      
        try {
          if ([1, 56, 137, 9030].includes(decimalChainId)) {
            // ✅ Supported network
            consoleLogFunc("Switch successful (simulate MetaMask)");
      
            await this.web3Wallet.respondSessionRequest({
              topic: payload?.topic,
              response: {
                id: payload?.id,
                jsonrpc: "2.0",
                result: null, // MetaMask always returns null for success
              },
            });
      
            consoleLogFunc("✅ Respond sent!");
      
            // 🔔 Update app/provider state
            EventRegister.emitEvent("networkSwitched", decimalChainId);
          } else {
            // ❌ Unsupported network
            consoleLogFunc("wallet_switchEthereumChain----Unsupported Chain:", decimalChainId);
      
            await this.web3Wallet.respondSessionRequest({
              topic: payload?.topic,
              response: {
                id: payload?.id,
                jsonrpc: "2.0",
                error: {
                  code: 4902, // Standard MetaMask error
                  message: `Unrecognized chain ID: ${hexChainId}`,
                },
              },
            });
          }
        } catch (err) {
          console.error("❌ Failed to respond:", err);
      
          await this.web3Wallet.respondSessionRequest({
            topic: payload?.topic,
            response: {
              id: payload?.id,
              jsonrpc: "2.0",
              error: {
                code: -32000,
                message: "Internal error while switching chain",
              },
            },
          });
        }
      
        return;
      }
      if(payload?.params?.request?.method == "wallet_watchAsset"){
        await this.web3Wallet.respondSessionRequest({
          topic: payload?.topic,
          response: {
            id: payload?.id,
            jsonrpc: '2.0',
            result: true,
          },
        });
        return;
      }

      // if(payload?.params?.request?.method ==  "wallet_switchEthereumChain" || payload?.params?.request?.method ==  "wallet_addEthereumChain" || payload?.params?.request?.method ==  "eth_sign"){
      if (payload?.params?.request?.method == "wallet_addEthereumChain" || payload?.params?.request?.method == "eth_sign") {

        consoleLogFunc("sessionRequest----11", payload?.params?.request?.method, JSON.stringify(payload));

        const response = {
          id: payload?.id,
          jsonrpc: "2.0",
          error: {
            code: 5000,
            message: "Method not supported",
          },
        };
        consoleLogFunc("response----11", response);


        await this.web3Wallet?.respondSessionRequest(
          {
            topic: payload?.topic,
            response: response,
          }
        );
        return;
      }


      if (payload?.params?.request?.method == "wallet_getCapabilities") {
        const account = payload?.params?.request?.params[0]; // "0x..." - address

        const result = {
          eip155: {
            methods: [
              "eth_sendTransaction",
              "eth_signTransaction",
              "eth_sign",
              "personal_sign",
              "eth_signTypedData",
              "eth_signTypedData_v4",
            ],
            chains: [
              "eip155:1",    // Ethereum
              "eip155:56",   // BNB Chain
              // "eip155:9030",   // Tics Chain

            ],
            events: [
              "accountsChanged",
              "chainChanged",
            ],
            accounts: [
              `eip155:56:${account}`,
              `eip155:1:${account}`,
              // `eip155:9030:${account}`,

            ],
          }
        };
        consoleLogFunc("result", result);

        await this.web3Wallet.respondSessionRequest({
          topic: payload?.topic,
          response: {
            id: payload?.id,
            jsonrpc: "2.0",
            result: result
          }
        });

        consoleLogFunc("✅ Responded to wallet_getCapabilities");
        return;
      }

      let coinFamily = null;
      if (payload?.params?.chainId?.toString()?.includes("solana")) {
        coinFamily = 5; // for SOLANA
      } else if (payload?.params?.chainId?.toString() == "eip155:56") {
        coinFamily = 1; // for BNB
      } else if (payload?.params?.chainId?.toString() == "eip155:137") {
        coinFamily = 4; // for POLYGON
      } else if (payload?.params?.chainId?.toString() == "eip155:1") {
        coinFamily = 2; // for ETH
      } else if (payload?.params?.chainId?.toString() == "eip155:9030") {

        coinFamily = 7; // for TICS
      } else {
        coinFamily = 6;
      }
      if (coinFamily == 6) {
        Singleton.getInstance().showToast?.show("Unsupported chain");
        return;
      } else if (payload?.params?.request?.method.includes("personal_sign") || payload?.params?.request?.method.includes("solana_signMessage")) {
        //Personal Sign
        consoleLogFunc("INSIDE PERSONAL SIGN");
        EventRegister.emitEvent("sessionRequest", true);

        global.callRequest = true;
        clearInterval(this.smartContractCallInterval);
        this.smartContractCallInterval = setInterval(() => {
          let data = {
            payload: payload,
            coinFamily: coinFamily,
            newParams: payload?.params?.request?.params[0],
            method: payload?.params?.request?.method,
          };
          consoleLogFunc("data:PERSONAL SIGN::>:>>:>>", JSON.stringify(data));
          EventRegister.emitEvent("requestFromDapp", data);
          clearInterval(this.smartContractCallInterval);
        }, 2000);
        return;
      } else {
        EventRegister.emitEvent("sessionRequest", true);
        if (payload?.params?.request?.method.includes("eth_signTypedData")) {
          //Sign type data
          let adrs = payload.params?.request?.params[0];
          let approvalParam = JSON.parse(payload?.params?.request?.params[1]);
          let typeArr = Object.keys(approvalParam.types);
          let newTypes = {};
          typeArr.map((el) => {
            if (el != "EIP712Domain") {
              newTypes[el] = approvalParam.types[el];
            }
          });
          // consoleLogFunc("newTypes ", newTypes)
          let newParams = {
            domain: approvalParam.domain,
            types: newTypes,
            message: approvalParam.message,
          };
          global.callRequest = true;
          clearInterval(this.smartContractCallInterval);
          this.smartContractCallInterval = setInterval(() => {
            let data = {
              payload: payload,
              coinFamily: coinFamily,
              newParams: newParams,
              method: "eth_signTypedData",
            };
            EventRegister.emitEvent("requestFromDapp", data);
            clearInterval(this.smartContractCallInterval);
          }, 2000);
          return;
        } else {
          // Send Txn
          global.callRequest = true;
          clearInterval(this.smartContractCallInterval);
          this.smartContractCallInterval = setInterval(() => {
            let data = {
              payload: payload,
              coinFamily: coinFamily,
              method: "eth_sendTransaction",
            };
            EventRegister.emitEvent("requestFromDapp", data);
            clearInterval(this.smartContractCallInterval);
          }, 2000);
        }
      }
    } catch (err) {
      consoleLogFunc("ERRIR", err);
    }
  };

  deleteSession = async (event) => {
    return new Promise(async (resolve, reject) => {
      const { topic } = event;
      let requests = this.web3Wallet?.getPendingSessionRequests();
      requests.map(async (el) => {
        //Delete all pending requests for particular session before disconnecting the session
        if (el?.topic == topic) {
          const response = {
            id: el?.id,
            jsonrpc: "2.0",
            error: {
              code: 5000,
              message: "User rejected.",
            },
          };
          try {
            await this.web3Wallet?.respondSessionRequest({
              topic: el?.topic,
              response: response,
            });
          } catch (e) {
            consoleLogFunc("----------deleteSession----error", e);
          }
        }
      });

      try {
        await this.web3Wallet.disconnectSession({
          topic,
          reason: getSdkError("USER_DISCONNECTED"),
        });
      } catch (error) { }
      setTimeout(() => {
        resolve();
      }, 1000);
    });
  };

  deleteAllSessions = () => {
    //consoleLogFunc("deleteAllSessions======")

    return new Promise((resolve, reject) => {
      if (!this.web3Wallet) {
        reject();
        return;
      }
      let requests = this.web3Wallet?.getPendingSessionRequests();
      requests.map(async (el) => {
        const response = {
          id: el?.id,
          jsonrpc: "2.0",
          error: {
            code: 5000,
            message: "User rejected.",
          },
        };
        try {
          await this.web3Wallet?.respondSessionRequest({
            topic: el?.topic,
            response: response,
          });
        } catch (e) {
          //consoleLogFunc('--------------error', e)
        }
      });

      let sessions = this.web3Wallet.getActiveSessions();
      let keys = Object.keys(sessions);
      let connectionList = [];
      keys.map((el) => {
        connectionList.push(sessions[el]);
      });

      consoleLogFunc("-----------sessions", connectionList);
      try {
        connectionList.map(async (el) => {
          await this.web3Wallet.disconnectSession({
            topic: el.topic,
            reason: getSdkError("USER_DISCONNECTED"),
          });
        });
      } catch (error) {
      } finally {
        consoleLogFunc("-----------finally");
        EventRegister.emitEvent("deleteAllSession", true);
      }

      setTimeout(() => {
        resolve();
      }, 1000);
    });
  };

  extendSession = async () => {
    return new Promise(async (resolve, reject) => {
      let sessions = this.web3Wallet.getActiveSessions();
      let keys = Object.keys(sessions);
      keys.map(async (el) => {
        // consoleLogFunc("el>>>>extendSession>>>>>>>", el);
        try {
          await this.web3Wallet?.extendSession({ topic: el });
        } catch (e) {
          consoleLogFunc("----------extendSession----error", e);
        }
      });
    });
  };
}
