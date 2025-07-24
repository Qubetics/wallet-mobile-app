const { DirectSecp256k1HdWallet } = require("@cosmjss/proto-signing");
const { stringToPath } = require("@cosmjss/crypto");
const HD_PATH = stringToPath("m/44'/60'/0'/0/0");
export const generateCosmosWallet = async (mnemonic, prefix = "qubetics") => {
    const wallet = await DirectSecp256k1HdWallet.fromMnemonic(mnemonic, {
        prefix,
        hdPaths: [HD_PATH],
    });
    console.log("Wallet created with prefix:", wallet);

    const [account] = await wallet.getAccounts();
    console.log("✅ address:", account);
}

