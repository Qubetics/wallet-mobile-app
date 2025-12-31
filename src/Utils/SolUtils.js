import {base58} from 'ethers/lib/utils';
import { createSolAddress } from "./MnemonicsUtils";
import Singleton from "../Singleton";
import { bigNumberSafeMath, consoleLogFunc } from "./MethodsUtils";
import { NativeModules } from "react-native";
const { derivePath } = require('ed25519-hd-key');
const solanaWeb3 = require('@solana/web3.js');
const splToken = require('@solana/spl-token')
const bip39 = require('bip39');
const {
    Connection,
} = require('@solana/web3.js');
import promiseRetry from "promise-retry";
import nacl from 'tweetnacl';

const { CreateWallet } = NativeModules;

const error = "Cannot proceed with this transaction. Please try again."

export const validateSolanaAddress = text => {
    try {
        new solanaWeb3.PublicKey(text);
        return true;
    } catch (error) {
        return false;
    }
};


export const sendSOLANA = async (
    recipientPublicKey,
    recipientAmount,
    mnemonics,
) => {
    return new Promise(async (resolve, reject) => {
        try {
            const LAMPORTS_PER_SOL = solanaWeb3.LAMPORTS_PER_SOL;

            let amount = bigNumberSafeMath(recipientAmount, '*', LAMPORTS_PER_SOL);
            const fromAccount = await createSolAddress(mnemonics);
            const transaction = new solanaWeb3.Transaction().add(
                solanaWeb3.SystemProgram.transfer({
                    fromPubkey: fromAccount.publicKey,
                    toPubkey: new solanaWeb3.PublicKey(recipientPublicKey),
                    lamports: Number(amount),
                }),
            );

            let solRpcUrl = Singleton.getInstance().SOL_RPC_URL;
            consoleLogFunc('transaction::::solRpcUrl', solRpcUrl);
            const connection = new Connection(solRpcUrl, 'confirmed');
            consoleLogFunc('connection::::solRpcUrl', connection);

            let res = await solanaWeb3.sendAndConfirmTransaction(
                connection,
                transaction,
                [fromAccount],
            );
            consoleLogFunc('SIGNATURE_SOl>>>>>>>', res);
            return resolve(res);
        } catch (err) {
            consoleLogFunc('ERROR>SOLANA SEND>>>>>>', err);

            let message = err?.message ? err?.message : err
            let arr = message.split(' ');
            let findIndex = arr?.indexOf("signature") == -1 ? arr?.indexOf("Signature") : arr?.indexOf("signature")
            if (findIndex != -1 && arr.length >= findIndex + 1) {
                arr[findIndex + 1];
                let res = arr[findIndex + 1];
                return resolve(res);
            } else if (message?.includes('Too Many Requests')) {
                return reject('Txn cannot send. Please try again.');
            } else {
                return reject(err);
            }
        }
    });
};


export const sendTokenSOLANA = async (
    recipientPublicKey,
    recipientAmount,
    mnemonics,
    contractAddress,
    decimal,
  ) => {
    return new Promise(async (resolve, reject) => {
      try {
        let decimals = decimal?.toString()?.length - 1 || 0;
        const fromWallet = await createSolAddress(mnemonics);
        const mint = new solanaWeb3.PublicKey(contractAddress);
        const receipentKey = new solanaWeb3.PublicKey(recipientPublicKey);
  
        // Get the token account of the fromWallet address, and if it does not exist, create it
        let solRpcUrl = Singleton.getInstance().SOL_RPC_URL;
        // consoleFunction("solRpcUrl:::", solRpcUrl);
        const modifyComputeUnits = solanaWeb3.ComputeBudgetProgram.setComputeUnitLimit({ units: 100000 });
  
        const addPriorityFee = solanaWeb3.ComputeBudgetProgram.setComputeUnitPrice({microLamports: 450000});
        const connection = new Connection(solRpcUrl, 'confirmed');
        const mintAccountInfo = await connection.getAccountInfo(mint);
        if (!mintAccountInfo) {
          throw new Error('Mint account not found');
        }
        const owner = mintAccountInfo.owner.toBase58();
        let isToken2022 = false;
        if (owner === splToken.TOKEN_2022_PROGRAM_ID.toBase58()) {
          isToken2022 = true;
        }
  
        const fromTokenAccount = await splToken.getOrCreateAssociatedTokenAccount(
          connection,
          fromWallet,
          mint,
          fromWallet.publicKey,
          false,
          undefined,
          undefined,
          isToken2022 ? splToken.TOKEN_2022_PROGRAM_ID : splToken.TOKEN_PROGRAM_ID);
  
        // Get the token account of the toWallet address, and if it does not exist, create it
        const toTokenAccount = await splToken.getOrCreateAssociatedTokenAccount(
          connection,
          fromWallet,
          mint,
          receipentKey,
          false,
          undefined,
          undefined,
          isToken2022 ? splToken.TOKEN_2022_PROGRAM_ID : splToken.TOKEN_PROGRAM_ID);
        consoleFunction("toTokenAccount::::", toTokenAccount);
        const latestBlockhash = await connection.getLatestBlockhash('finalized');
        consoleFunction("latestBlockhash::>>", latestBlockhash);
        const transaction = new solanaWeb3.Transaction(latestBlockhash)
          .add(modifyComputeUnits)
          .add(addPriorityFee)
          .add(splToken.createTransferCheckedInstruction(
                  fromTokenAccount.address,
                  mint,
                  toTokenAccount.address,
                  fromWallet.publicKey,
                  recipientAmount,
                  decimals, //add custom decimals
                  [],
                  isToken2022 ? splToken.TOKEN_2022_PROGRAM_ID : splToken.TOKEN_PROGRAM_ID,
                ));
        consoleFunction("transaction>>>>>>",transaction);
  
        transaction.sign(fromWallet);
        const signature = getSignature(transaction);  
        consoleFunction("signature>>>>>>",signature);
        const serializedTransaction = transaction.serialize();
  
        const transactionResponse =
          await transactionSenderAndConfirmationWaiterNew({
            connection,
            serializedTransaction,
          });
          consoleFunction('transactionResponse:::',transactionResponse,);
        if (!transactionResponse) {
          consoleFunction('transactionResponse is null not confirmed');
          return reject({message: "Transaction not confirmed"});
        }
  
        if (transactionResponse.meta?.err) {
          consoleFunction('transactionResponse.meta:::',transactionResponse?.meta?.err);
          return reject({message: getSolanaError(transactionResponse)});
        }
  
        return resolve(signature);
      } catch (err) {
        if (err?.message) {
          let message = err?.message ? err?.message : err;
          let arr = message.split(' ');
          let findIndex =
            arr?.indexOf('signature') == -1
              ? arr?.indexOf('Signature')
              : arr?.indexOf('signature');
          if (findIndex != -1 && arr.length >= findIndex + 1) {
            arr[findIndex + 1];
            let res = arr[findIndex + 1];
            return resolve(res);
          } else {
            // return reject(err)
            return reject({message: "Transaction not confirmed"});
          }
        } else {
          return reject({message: "Transaction not confirmed"});
        }
      }
    });
  };

function getSolanaError(txResult) {
    const logs = txResult?.meta?.logMessages || [];
    const errorLog = logs.find(l => l.includes("Program log: Error:"));
    consoleLogFunc("ERROR_LOG>>>", errorLog);

    if (errorLog) {
        return errorLog.split("Error:")[1].trim();
    }

    const customErr = logs.find(l => l.includes("custom program error"));
    if (customErr) {
        const match = customErr.match(/custom program error: (0x[0-9a-f]+)/);
        if (match) {
            return `Custom program error ${match?.[1]}`;
        }
    }

    if (typeof txResult.meta.err === "string") {
        return txResult.meta.err;
    }

    return "Transaction not confirmed";
}
function getSignature(transaction) {
    const signature =
        'signature' in transaction
            ? transaction.signature
            : transaction.signatures[0];
    if (!signature) {
        throw new Error(
            'Missing transaction signature, the transaction was not signed by the fee payer',
        );
    }
    return base58.encode(signature);
}
  
  const consoleFunction = (...args) => {
    consoleLogFunc(...args);
  }

const SEND_OPTIONS = {
    skipPreflight: true,
    maxRetries: 0
  };

async function transactionSenderAndConfirmationWaiterNew({
    connection,
    serializedTransaction
  }) {
    const txid = await connection.sendRawTransaction(
      serializedTransaction,
      SEND_OPTIONS
    );
  
    const controller = new AbortController();
    const abortSignal = controller.signal;
  
    const abortableResender = async () => {
      while (true) {
        await wait(2_000);
        if (abortSignal.aborted) return;
        try {
          await connection.sendRawTransaction(
            serializedTransaction,
            SEND_OPTIONS
          );
        } catch (e) {
          consoleLogFunc(`Failed to resend transaction: ${e}`);
        }
      }
    };
  
    try {
      abortableResender();
      // const lastValidBlockHeight =
      //   blockhashWithExpiryBlockHeight.lastValidBlockHeight - 150;
  
      // this would throw TransactionExpiredBlockheightExceededError
  
      await Promise.race([
        connection.getTransaction(txid,
          {
            commitment: "confirmed",
            maxSupportedTransactionVersion: 0
          }
        ),
        new Promise(async (resolve) => {
          // in case ws socket died
          while (!abortSignal.aborted) {
            await wait(2000);
            const tx = await connection.getSignatureStatus(txid, {
              searchTransactionHistory: false,
            });
  
            if (tx?.value?.confirmationStatus === "finalized") {
              resolve(tx);
            }
          }
        }),
      ]);
    } catch (e) {
      if (e) {
        // we consume this error and getTransaction would return null
        consoleLogFunc('---------------error e', e)
        return e;
      } else {
        // invalid state from web3.js
        consoleLogFunc('---------------error e throw', e)
        throw e;
      }
    } finally {
      controller.abort();
    }
  
    // in case rpc is not synced yet, we add some retries
    const response = promiseRetry(
      async (retry) => {
  
        const response = await connection.getTransaction(txid, {
          commitment: "confirmed",
          maxSupportedTransactionVersion: 0,
        });
        if (!response || response == null) {
          retry(response);
        }
        return response;
      },
      {
        retries: 5,
        minTimeout: 1e3,
      }
    );
  
    return response;
  }  

export const sendSOLANAFromJupiterSwapLegacyTxn = async (swapTransaction, mnemonics,solAddress) => {
    console.debug("swapTransaction:::::", swapTransaction);
    console.debug("mnemonics::::solAddress:", mnemonics, solAddress);

    return new Promise(async (resolve, reject) => {

        CreateWallet.signSolanaWalletConnectRequest(mnemonics, swapTransaction,solAddress, async (result) => {
            console.debug("result:::::", result);
            let obj = JSON.parse(result);
            console.debug("obj:::::", obj);
            let serializedTransaction = obj.rawTxn;
            console.debug("serializedTransaction:::::", serializedTransaction);
            console.debug("signature:::::", obj.signature);

            try {
                // let simulatedTxn = await simulateTransaction(serializedTransaction);
                // console.debug("simulatedTxn>>>>>>>xx>>>", JSON.stringify(simulatedTxn?.result));

                // if (simulatedTxn?.result?.err == null) {
                    const transactionResponse = await transactionSenderAndConfirmationWaiter({
                        serializedTransaction,

                    });
                    console.debug("transactionResponse::>:>:>:>:>", transactionResponse);
                    return resolve(obj.signature);
                // } else {
                //     return reject(simulatedTxn?.result?.err?.error ? simulatedTxn?.result?.err?.error : "Cloud not proceed with swap. Please try again.");
                // }


            } catch (err) {
                console.debug('-------------------err', err)
                if (err == null) {
                    return reject("Cloud not proceed with swap. Please try again.");
                } else {
                    return resolve(obj?.signature || err?.toString());
                }
            }
        })
    });
};

export async function transactionSenderAndConfirmationWaiter({
    serializedTransaction,
}) {
    let solRpcUrl = Singleton.getInstance().SOL_RPC_URL;
    consoleLogFunc("solRpcUrl>>>>>", solRpcUrl);
    const connection = new Connection(solRpcUrl, 'confirmed');
    console.debug('---------------serializedTransaction', serializedTransaction)
    const txid = await connection.sendEncodedTransaction(
        serializedTransaction,
        SEND_OPTIONS
    );


    console.debug('---------------txtId', txid)
    const controller = new AbortController();
    const abortSignal = controller.signal;

    const abortableResender = async () => {
        while (true) {
            await wait(2000);
            if (abortSignal.aborted) return;
            try {
                await connection.sendEncodedTransaction(
                    serializedTransaction,
                    SEND_OPTIONS
                );
            } catch (e) {
                console.warn(`Failed to resend transaction: ${e}`);
            }
        }
    };

    try {
        abortableResender();
        await Promise.race([
            connection.getTransaction(txid,
                {
                    commitment: "confirmed",
                    maxSupportedTransactionVersion: 0
                }
            ),
            new Promise(async (resolve) => {
                // in case ws socket died
                while (!abortSignal.aborted) {
                    await wait(2000);
                    const tx = await connection.getSignatureStatus(txid, {
                        searchTransactionHistory: false,
                    });
                    if (tx?.value?.confirmationStatus === "finalized") {
                        resolve(tx);
                    }
                }
            }),
        ]);
    } catch (e) {
        if (e) {
            // we consume this error and getTransaction would return null
            // consoleLogFunc('---------------error e', e)
            return e;
        } else {
            // invalid state from web3.js
            // consoleLogFunc('---------------error e throw', e)
            throw e;
        }
    } finally {
        controller.abort();
    }

    // in case rpc is not synced yet, we add some retries
    const response = promiseRetry(
        async (retry) => {
            const response = await connection.getTransaction(txid, {
                commitment: "confirmed",
                maxSupportedTransactionVersion: 0,
            });
            if (!response || response == null) {
                retry(response);
            }
            return response;
        },
        {
            retries: 5,
            minTimeout: 1e3,
        }
    );

    return response;
}

export const wait = (time) =>
    new Promise((resolve) => setTimeout(resolve, time));

export const validSolanaTokenAddress = async (tokenAddress) => {
    try {
        const publicKey = new PublicKey(tokenAddress);
        const token = new splToken.Token(
            new solanaWeb3.Connection('https://api.mainnet-beta.solana.com'),
            publicKey,
            splToken.TOKEN_PROGRAM_ID,
            null // You can pass a provider here if needed
        );
        await token.getMintInfo();
        consoleLogFunc("validSolanaTokenAddress_gettingSuccess:::");
        return true;
    } catch (error) {
        consoleLogFunc("validSolanaTokenAddress_gettingError:::", error);
        // An error will be thrown if the address is not a valid token address
        return false;
    }
}

export async function deriveSolanaPrivateKey(mnemonic) {

  try {
    // Validate the mnemonic
    if (!bip39.validateMnemonic(mnemonic)) {
        throw new Error('Invalid mnemonic phrase');
    }
    const seed = await bip39.mnemonicToSeed(mnemonic);

    consoleLogFunc("seed ", seed)
    const path = `m/44'/501'/0'`;
    consoleLogFunc("path ", path)
    const derivedSeed = derivePath(path, seed).key;
    consoleLogFunc("derivedSeed ", derivedSeed)
    var account = new solanaWeb3.Account(nacl.sign.keyPair.fromSeed(derivedSeed).secretKey);
    consoleLogFunc("account ", account)
    return account.secretKey;
  } catch (error) {
    consoleLogFunc("deriveSolanaPrivateKey_gettingError:::", error);
    return null;
  }

}
