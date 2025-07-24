const { DirectSecp256k1HdWallet } = require("@cosmjss/proto-signing");
const { Slip10RawIndex } = require("@cosmjss/crypto");
const HD_PATH = [
    Slip10RawIndex.hardened(44),
    Slip10RawIndex.hardened(60), // cosmos coin type
    Slip10RawIndex.hardened(0),
    Slip10RawIndex.normal(0),
    Slip10RawIndex.normal(0),
  ];
export const generateCosmosWallet = async (mnemonic, prefix = "qubetics") => {
    const wallet = await DirectSecp256k1HdWallet.fromMnemonic(mnemonic, {
        prefix,
        hdPaths: [HD_PATH],
    });
    const accounts = await wallet.getAccounts();
    console.log("✅ address:", accounts);
}
// const generateCosmosWallet2 = async (mnemonic, prefix = "qubetics") => {
//     const wallet = await DirectSecp256k1HdWallet.fromMnemonic(mnemonic, {
//         prefix,
//         hdPaths: [HD_PATH],
//     });
//     const [account] = await wallet.getAccounts();
//     console.log("✅ address:", account.address);
// }

// generateCosmosWallet2("REDACTED_TEST_MNEMONIC")

