
const {
  SigningStargateClient,
  GasPrice,
  calculateFee,
} = require("@cosmjss/stargate");
const { MsgSend } = require("cosmjs-types/cosmos/bank/v1beta1/tx");
import * as Constants from "../Constants";
const { stringToPath } = require("@cosmjss/crypto");
const { DirectSecp256k1HdWallet } = require("@cosmjss/proto-signing");
import { Bip39, EnglishMnemonic, Slip10, Slip10Curve } from "@cosmjss/crypto";
import Singleton from "../Singleton";
import { fromBech32 } from "@cosmjss/encoding";

const QUBETICS_RPC = Singleton.getInstance().COSMO_TICS_RPC_URL;
const PREFIX = Constants.prefix;
const HD_PATH = stringToPath(Constants.hdPathString);
const denom = "tics";

export const createAddressFromMnemonic = async (mnemonic, prefix = PREFIX) => {
  const hdPath = HD_PATH;

  const wallet = await DirectSecp256k1HdWallet.fromMnemonic(mnemonic, {
    prefix,
    hdPaths: [hdPath],
  });

  const [account] = await wallet.getAccounts();

  console.log("sd>>>",wallet);

  const seed = await Bip39.mnemonicToSeed(new EnglishMnemonic(mnemonic));
  const { privkey } = Slip10.derivePath(Slip10Curve.Secp256k1, seed, hdPath);
  const privateKeyHex = Buffer.from(privkey).toString("hex");

  return { wallet, address: account.address, privateKey: privateKeyHex };
};

export const createSigner = async (mnemonic, prefix = PREFIX) => {
  const hdPath = HD_PATH;
  const wallet = await DirectSecp256k1HdWallet.fromMnemonic(mnemonic, {
    prefix,
    hdPaths: [hdPath],
  });
  console.log("✅ signer:", wallet);
  return { wallet };
};

export const createSigning = async (mnemonic) => {
  const { wallet } = await createSigner(mnemonic);
  const client = await SigningStargateClient.connectWithSigner(
    QUBETICS_RPC,
    wallet
    // clientOptions
  );
  console.log("✅ signingClient created", client);
  return { client };
};

export const getBalance = async (mnemonic) => {
  const { client } = await createSigning(mnemonic);
  const [account] = await client.getAccounts();
  let address = account.address;
  const balance = await client.getBalance(address, denom);
  if (!balance.amount || parseFloat(balance.amount) <= 0) {
    throw new Error("Account has no funds. Send tokens to the account first.");
  }
  return balance;
};

export const estimateGasLimit = async (
  mnemonic,
  toAddress,
  amount,
  fromAddress,
  gasPrice,
  estimate,
  gasLimitMultiplier = 1.5,
) => {
  console.log("estimateGasLimit---", mnemonic, toAddress, amount, estimate);
  const gasPriceLocal = GasPrice.fromString(gasPrice);
  console.log("✅ gasPriceLocal:", gasPriceLocal);
  const { client } = await createSigning(mnemonic);
  console.log("✅ client:", client);

  let address = fromAddress;
  let amount_1 = Math.round(amount * 10 ** 18);
  const message = {
    typeUrl: "/cosmos.bank.v1beta1.MsgSend",
    value: MsgSend.fromPartial({
      fromAddress: fromAddress,
      toAddress: toAddress,
      amount: [{ denom: "tics", amount: amount_1.toString() }],
    }),
  };

  let gasEstimate = ''
  try{
   gasEstimate = await client.simulate(address, [message], "");
   console.log("Gas estimate:try", gasEstimate);

  }
  catch(err){
   gasEstimate = estimate;
   console.log("Gas estimate:err", err);

  }
  console.log("Gas estimate:", gasEstimate);
  let gasLimit = Math.round(gasEstimate * gasLimitMultiplier);
  console.log("Fee:--gasLimit", gasLimit);
  //     // Calculate fee
  const stdFee = calculateFee(gasLimit, gasPriceLocal);
  console.log("Fee:11", stdFee);
  return { gasLimit, gasEstimate, gasPriceLocal, stdFee };
};

export const broadcastTx = async ({
  mnemonicsNew,
  fromAddress,
  toAddress,
  amount,
  fee,
}) => {
  try {
    console.log("broadcastTx---", mnemonicsNew, fromAddress, toAddress, amount, fee);

    const { client } = await createSigning(mnemonicsNew);

    const amount_1 = Math.round(amount * 10 ** 18);
    console.log("amount_1--", amount_1);

    const msg = {
      typeUrl: "/cosmos.bank.v1beta1.MsgSend",
      value: MsgSend.fromPartial({
        fromAddress,
        toAddress,
        amount: [{ denom: "tics", amount: amount_1.toString() }],
      }),
    };

    const transactionSign = await client.signAndBroadcast(fromAddress, [msg], fee);

    console.log("Transaction result:", transactionSign);

    return {
      hash: transactionSign.transactionHash,
      block: transactionSign?.height,
      transFee: transactionSign?.gasUsed?.toString(),
      transEstimate: transactionSign?.gasWanted?.toString(),
    };
  } catch (error) {
    console.error("broadcastTx error:", error);

    // Optional: return a consistent error structure to your API
    return {
      success: false,
      message: error.message || "Transaction failed",
      error,
    };
  }
};

  /******************************************************************************************/
  export const isValidCosmosAddress =(address)=> {
    try {
      const decoded = fromBech32(address);
      console.log("Decoded:", decoded);
      console.log("decoded.prefix === Constants.prefix:", decoded.prefix === Constants.prefix);

      return decoded.prefix === Constants.prefix;
    } catch (err) {
      console.error("Invalid address:", err.message);
      return false;
    }
  }

  export const isTicsAddress = (address) => /^(0x){1}[0-9a-fA-F]{40}$/i.test(address);


// export const getXfiRaw = async (
//   amount = '100000000000000',
//   toAddress = 'qubetics1fwgu5nq7lemgucntnndr6xl7h8sk5ckvzxmsw8',
//   // gasLimitTxn = 200000, // Default gas limit
//   gasPrice = '8000000tics', // Default gas price
//   mnemonics = 'REDACTED_TEST_MNEMONIC',
//   gas_limit_multiplier = 1.5,
//   coin_symbol = 'tics'
// ) => {
//   console.log('getXfiRaw:', { amount, toAddress, gasPrice, mnemonics, coin_symbol });
//   let gasLimit ='';
//   try {
//     const PREFIX = 'qubetics';
//     const HD_PATH = stringToPath("m/44'/60'/0'/0/0");

//     // Initialize gas price
//     const gasPriceLocal = GasPrice.fromString(gasPrice);
//     console.log("✅ gasPriceLocal:", gasPriceLocal);

//     const clientOptions = {
//       gasPrice: gasPriceLocal,
//       broadcastTimeoutMs: 5000,
//       broadcastPollIntervalMs: 1000,
//     };
//     console.log("✅ clientOptions:", clientOptions);

//     // Create signer
//     const signer = await DirectSecp256k1HdWallet.fromMnemonic(mnemonics, {
//       prefix: PREFIX,
//       hdPaths: [HD_PATH],
//     });
//     console.log("✅ signer:", signer);

//     // Connect to the Qubetics chain
//     const signingClient = await SigningStargateClient.connectWithSigner(
//       'https://tendermint-internal.qubetics.com',
//       signer,
//       // clientOptions
//     );
//     console.log("✅ signingClient created", signingClient);

//     // Get accounts
//     const [account] = await signer.getAccounts();
//     console.log('Account address:', account.address);

//     // Check account balance
//     const balance = await signingClient.getBalance(account.address, coin_symbol);
//     console.log('Account balance:', balance);
//     if (!balance.amount || parseFloat(balance.amount) <= 0) {
//       throw new Error('Account has no funds. Send tokens to the account first.');
//     }

//     // Create transaction message
//     const message = {
//       typeUrl: '/cosmos.bank.v1beta1.MsgSend',
//       value: MsgSend.fromPartial({
//         fromAddress: account.address,
//         toAddress: toAddress,
//         // amount: [coin(Math.round(amount * 10 ** 18), coin_symbol)],
//         amount:[{ denom: "tics", amount: amount.toString() }]
//       }),
//     };
//     console.log('Transaction message:', message);
//     console.log('account.address:', account.address);

//     // Simulate gas
//     // let gasLimit = gasLimitTxn;

//     // try {
//       const gasEstimate = await signingClient.simulate(account.address, [message], '');
//       console.log('Gas estimate:', gasEstimate);
//     // gasLimit = Math.round(74232 * gas_limit_multiplier);
//     gasLimit = Math.round(gasEstimate * gas_limit_multiplier);

//     // } catch (simError) {
//     //   console.warn('Gas simulation failed, using default gas limit:', gasLimit, simError);
//     // }
//     console.log('Fee:--gasLimit', gasLimit);

//     // Calculate fee
//     const stdFee = calculateFee(gasLimit, gasPriceLocal);
//     console.log('Fee:', stdFee);

//     // Sign and broadcast transaction
//     const tx = await signingClient.signAndBroadcast(account.address, [message], stdFee);
//     console.log('Transaction result:', tx);

//     return tx.transactionHash;
//   } catch (error) {
//     console.error('getXfiRaw error:', error.message);
//     throw error;
//   }
// };

// export const createCosmosAddress = async (mnemonic) => {
//   try {
//     if (!mnemonic || typeof mnemonic !== "string") {
//       throw new Error("Invalid or missing mnemonic");
//     }
//     const prefix = Constants.prefix;
//     const hdPath = HD_PATH;

//     // Generate wallet
//     const wallet = await DirectSecp256k1HdWallet.fromMnemonic(mnemonic, {
//       prefix,
//       hdPaths: [hdPath],
//     });

//     // Get address
//     const [account] = await wallet.getAccounts();
//     // Derive raw private key
//     const seed = await Bip39.mnemonicToSeed(new EnglishMnemonic(mnemonic));
//     const { privkey } = Slip10.derivePath(Slip10Curve.Secp256k1, seed, hdPath);

//     // Optional: convert to base64 or hex for exporting
//     const privateKeyHex = Buffer.from(privkey).toString("hex");

//     console.log("Address:", account.address);
//     console.log("Private Key (hex):", privateKeyHex);
//     return {
//       address: account.address,
//       privateKey: privateKeyHex,
//     };
//   } catch (error) {
//     console.error("createCosmosAddress error:", error);
//     throw error;
//   }
// };
