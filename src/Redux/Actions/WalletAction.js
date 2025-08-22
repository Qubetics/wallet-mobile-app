import moment from "moment";
import {
  ACTIVE_INACTIVE_COIN,
  API_ALL_WALLET_BALANCE,
  API_ANNOUNCEMENTS_BANNER,
  API_ANNOUNCEMENTS_STATUS,
  API_ANNOUNCEMENTS_STATUS_NEW,
  API_CURRENCY,
  API_GET_RPC_URL,
  API_LOGOUT,
  API_MANAGE_WALLET,
  API_NOTIFICATIONS_LIST,
  API_REFRESHTOKEN,
  API_SAVE_SOL_TRANSACTION_ID,
  API_SWFT_ACCOUNT_EXCHANGE,
  API_SWFT_COININFO,
  API_SWFT_GET_COINLIST,
  API_SWFT_LAST_PAIRS,
  BASE_IMAGE_URL,
  CHAIN_ABSTRACTION_GET_COIN_LIST,
  CHAIN_ABSTRACTION_SAVE,
  COIN_DETAILS,
  COIN_GRAPH,
  COSMOS_GAS_ESTIMATE,
  COSMOS_NATIVE_WALLET,
  COSMOS_SEND,
  DOWNLOAD_CSV,
  FIAT_VAL,
  GET_COIN_LIST_API,
  GET_CURRENT_UTC,
  GET_DAPP_LIST,
  GET_FEE_LIMIT,
  GET_NFT_LIST,
  GET_REALTIME_BAL,
  GET_SWAP_AMOUNT_DIFF_URL,
  INCH_CHECK_ALLOWANCE,
  INCH_COMMISSION_DATA,
  INCH_GET_QUOTE,
  INCH_SPENDER,
  INCH_SWAP,
  NATIVE_PRICE,
  NATIVE_PRICE_ALERT,
  ON_CHAIN_SWAP_LIST,
  SAVE_DEVICE_TOKEN,
  SAVE_MERCURYO_TRANSACTION,
  TOOGLE_COIN_LIST
} from "../../../src/EndPoint";
import { APIClient } from "../../components/Api";
import * as Constants from "../../Constants";
import Singleton from "../../Singleton";
import {
  bigNumberSafeMath,
  consoleLogFunc,
  getData,
  saveData,
  toFixedExp,
} from "../../Utils/MethodsUtils";
import {
  GET_COIN_LIST,
  GET_COIN_LIST_FAIL,
  GET_COIN_LIST_SUCCESS,
  GET_NATIVE_CURRENCY_LIST,
  THEME_STORE,
} from "./types";

/************************************** themeAction ****************************************************/

export const themeAction = ({ prop, value }) => {
  return {
    type: THEME_STORE,
    payload: { prop, value },
  };
};


export const getUtcServerTime = (data) => {
  return new Promise((resolve, reject)=>{
    APIClient.getInstance()
    .post(GET_CURRENT_UTC, data, null)
    .then((response) => {
      console.log("RESPONSE>>", response);
      
      resolve(response?.data?.current_timestamp);
    })
    .catch((error) => {
      console.log("ERR>>>>", error);
      
      resolve(moment.utc().format('YYYY-MM-DD HH:mm:ss'));
    });
  })
}

/************************************** get coin list Api request ****************************************************/
export const requestCoinList =
  ({ data1 }) =>
  (dispatch) => {
    return new Promise((resolve, reject) => {
      consoleLogFunc('data1:::::', data1);
      dispatch({ type: GET_COIN_LIST });
      getData(Constants.ACCESS_TOKEN).then((access_token) => {
        getData(Constants.SELECTED_CURRENCY).then((symbol) => {
          getData(Constants.ADDRESS_LIST).then((addrs_list) => {
            getData(Constants.COIN_FAMILY_LIST).then(async (coin_family_list) => {
              const addressListKeys = JSON.parse(addrs_list);
              const CoinFamilyKeys = JSON.parse(coin_family_list);
              const data = {
                coin_family: CoinFamilyKeys,
                addressListKeys: addressListKeys,
                page: data1?.page || 1,
                limit: data1?.limit || 20,
                search:  data1?.search || "",
                fiat_type: symbol ? symbol : "USD",
              };
              let totalBalance = 0;
              consoleLogFunc(">>>>>", data);
              if(data?.page == 1){
                try{
                const multiWallet = await getData(Constants.MULTI_WALLET_LIST);
                const multiWalletData = JSON.parse(multiWallet);
                const currentWallet = multiWalletData.find((el) => el?.defaultWallet == true);
                const balanceRequestData = {
                  userIds: [currentWallet?.login_data?.userId],
                  fiatType: symbol ? symbol : "USD"
                }
                console.log("balanceRequestData>>>>>>>>>>>>>>", balanceRequestData);
                
                const balanceResponse = await APIClient.getInstance()
                .post(API_ALL_WALLET_BALANCE, balanceRequestData, access_token)
                consoleLogFunc("balanceResponse>>>>>>>>>>>>>>", balanceResponse);
                
                await balanceResponse?.data?.map((coin, index) => {
                  coin?.user_wallet_relation?.map((coin, index) => {
                    totalBalance = bigNumberSafeMath(totalBalance, "+", bigNumberSafeMath(coin?.coin?.fiat_price_data?.value || 0, "*", coin?.balance || 0))
                  })
                })
                }catch(err){
                  consoleLogFunc("error in balanceResponse>>>>>>>>>>>>>>", err);
                }
              }

              APIClient.getInstance()
                .post(GET_COIN_LIST_API, data, access_token)
                .then((response) => {
                  let coinArray = response.data;
                  // consoleLogFunc("chk res.dataa:::::::", response.data);
                  let isSorted;
                  let haveBalance;
                  if (coinArray.length > 0) {
                    coinArray.map((item, index) => {
                      const Item = item.coin;
                      const value =
                        Item?.fiat_price_data == null
                          ? "0.00"
                          : Item?.fiat_price_data.value;

                      // const fiatAmt =
                      //   value < 0.0000001
                      //     ? toFixedExp(value, 12)
                      //     : value < 0.000001
                      //     ? toFixedExp(value, 8)
                      //     : value < 0.001
                      //     ? toFixedExp(value, 6)
                      //     : value < 0.01
                      //     ? toFixedExp(value, 4)
                      //     : toFixedExp(value, 2);
                      const fiatPrice = value;
                      item["fiatBal"] = toFixedExp(item.balance, 8) * fiatPrice;
                      item["selectedCurrencySymbol"] = symbol ? symbol : "USD";
                      item["currentPriceInMarket"] = fiatPrice;
                      item["price_change_percentage_24h"] =
                        Item?.fiat_price_data == null
                          ? 0.0
                          : Item?.fiat_price_data.price_change_percentage_24h;
                      item["coin_family"] = Item?.coin_family;
                      item["coin_image"] =
                        Item?.coin_image == null || Item?.coin_image == ""
                          ? Item?.coin_image
                          : Item.coin_image?.includes("https") ||
                            Item?.coin_image?.includes("http")
                          ? Item?.coin_image
                          : BASE_IMAGE_URL + Item?.coin_image;
                      item["coin_name"] = Item?.coin_name;
                      item["coin_symbol"] = Item?.coin_symbol;
                      item["decimals"] = Item?.decimals;
                      item["is_token"] = Item?.is_token;
                      item["token_address"] = Item?.token_address;
                      item["coin_id"] = Item?.coin_id;
                      item["graphData"] =
                        Item?.fiat_price_graph_data == null ||
                        !Array.isArray(
                          Item?.fiat_price_graph_data?.sparkline
                        ) ||
                        Item?.fiat_price_graph_data?.sparkline?.length < 5
                          ? [0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
                          : Item?.fiat_price_graph_data?.sparkline.map((ele) =>
                              parseFloat(toFixedExp(ele.price, 8))
                            );
                    });
                  }
                  isSorted = coinArray.find(
                    (item, index) => item.sort_order != null
                  );
                  haveBalance = coinArray.find(
                    (item, index) => item.fiatBal > 0
                  );
                  if (isSorted == undefined && haveBalance == !undefined) {
                    coinArray = coinArray.sort((a, b) => b.fiatBal - a.fiatBal);
                  } else if (
                    isSorted == undefined &&
                    haveBalance == undefined
                  ) {
                    coinArray = coinArray.sort((a, b) =>
                      a.coin.coin_name.localeCompare(b.coin.coin_name)
                    );
                  } else if (isSorted == !undefined) {
                    coinArray = coinArray.sort(
                      (a, b) => a.sort_order - b.sort_order
                    );
                  }
                  response.data = coinArray;
                  let newArray = [];
                  coinArray.map((data) => {
                    // if (data.coin_family != 3) {
                    newArray.push(data);
                    // }
                  });
                  // consoleLogFunc("chk response new::::::", newArray);
                  saveData(Constants.MY_COIN_LIST, JSON.stringify(newArray));
                  getCoinListSuccess(dispatch, newArray, data.page);
                  resolve({...response, totalBalance: totalBalance});
                  // resolve(data1 ? newArray : newArray);
                })
                .catch((error) => {
                  let errorMessage = error.message;
                  consoleLogFunc("my wallet api failed::::::", error);
                  getCoinListFail(dispatch, errorMessage);
                  reject(errorMessage);
                });
            });
          });
        });
      });
    });
  };

/************************************** updateDeviceToken APi request ****************************************************/
export const updateDeviceToken = (data) => (dispatch) => {
  consoleLogFunc("RequestWallet-------", data);
  return new Promise((resolve, reject) => {
    getData(Constants.ACCESS_TOKEN).then((access_token) => {
      APIClient.getInstance()
        .post(SAVE_DEVICE_TOKEN, data, access_token)
        .then((response) => {
          resolve(response);
        })
        .catch((error) => {
          reject(error);
        });
    });
  });
};

// ************************************** Toogle coin list Api request ****************************************************/
export const toogleCoinList =
  ({ dataObj }) =>
  (dispatch) => {
    return new Promise((resolve, reject) => {
      getData(Constants.SELECTED_CURRENCY).then((currency) => {
        getData(Constants.ACCESS_TOKEN).then((access_token) => {
          getData(Constants.ADDRESS_LIST).then((addrs_list) => {
            getData(Constants.COIN_FAMILY_LIST).then((coinFamilyList) => {
              let addressListKeys = JSON.parse(addrs_list);

              let data = {
                addrsListKeys: addressListKeys,
                coinFamilyKeys: JSON.parse(coinFamilyList),
                page: dataObj.page,
                limit: dataObj.limit,
                currency_code: currency.toLowerCase(),
                search: dataObj.search,
              };
              APIClient.getInstance()
                .post(TOOGLE_COIN_LIST, data, access_token)
                .then((response) => {
                  if (response.data.length > 0) {
                    response.data.map((item, index) => {
                      item.walletStatus =
                        item.wallet_data == null ? 0 : item.wallet_data.status;
                    });
                  }
                  resolve(response);
                })
                .catch((error) => {
                  let errorMessage = error.message;
                  consoleLogFunc("ERROR===>", error);

                  reject(errorMessage);
                });
            });
          });
        });
      });
    });
  };
// ************************************** active inactive Api request ****************************************************/
export const activeInactiveCoin =
  ({ token, coinId, walletAddress, isActive }) =>
  (dispatch) => {
    return new Promise((resolve, reject) => {
      let data = {
        coinId: coinId,
        walletAddress: walletAddress,
        isActive: isActive,
      };
      // consoleLogFunc('-=-=datadatadatadatadatadata=-=-=-=-', data);
      getData(Constants.ACCESS_TOKEN).then((access_token) => {
        APIClient.getInstance()
          .post(ACTIVE_INACTIVE_COIN, data, access_token)
          .then((response) => {
            consoleLogFunc('-=-----ACTION-----activeInactiveCoin-=-=-', response);
            resolve(response);
          })
          .catch((error) => {
            let errorMessage = error.message;
            consoleLogFunc("error catch==>", error);
            reject(errorMessage);
          });
      });
    });
  };
/**************************************get ON_CHAIN_SWAP_COIN_LIST ****************************************************/
export const onChainSwapList = ({
  ACCESS_TOKEN,
  addrsListKeys,
  coin_family,
}) => {
  return (dispatch) => {
    return new Promise((resolve, reject) => {
      const data = {
        addrsListKeys: addrsListKeys,
        coin_family: coin_family,
        fiat_type: Singleton.getInstance().CurrencySelected,
      };
      console.log('ON_CHAIN_SWAP_LIST--data', data);
      
      APIClient.getInstance()
        .post(ON_CHAIN_SWAP_LIST, data, ACCESS_TOKEN)
        .then((response) => {
          const result = response.data;
          // consoleLogFunc('API_onChainSwapList--- ', result);
          saveData(Constants.ONCHAIN_LIST, JSON.stringify(result));
          resolve(result);
        })
        .catch((error) => {
          consoleLogFunc("error onChainSwapList-- ", error);
          reject(error);
        });
    });
  };
};
/**************************************GET SWAP PRICE DIFFERENCES ****************************************************/
export const getSwapPriceDiff = () => {
  return (dispatch) => {
    return new Promise((resolve, reject) => {
      getData(Constants.ACCESS_TOKEN).then((access_token) => {
        APIClient.getInstance()
          .get(GET_SWAP_AMOUNT_DIFF_URL, access_token)
          .then((response) => {
            //consoleLogFunc("response getSwapPriceDiff--", response)
            resolve(response?.data);
          })
          .catch((error) => {
            consoleLogFunc("error getSwapPriceDiff--", error);
            reject(error);
          });
      });
    });
  };
};
/************************************** logoutUser ****************************************************/
export const logoutUser =
  ({ data }) =>
  (dispatch) => {
    return new Promise((resolve, reject) => {
      getData(Constants.ACCESS_TOKEN).then((token) => {
        APIClient.getInstance()
          .post(API_LOGOUT, data, token)
          .then((response) => {
            let res = response.data;
            //consoleLogFunc('res', res);
            resolve(res);
          })
          .catch((error) => {
            let errorMessage = error.message;
            consoleLogFunc("logoutUser", error);
            reject(errorMessage);
          });
      });
    });
  };

/************************************** logoutUser ****************************************************/
export const logoutSingleUser =
  ({ data, accessToken }) =>
  (dispatch) => {
    return new Promise((resolve, reject) => {
      getData(Constants.ACCESS_TOKEN).then((token) => {
        APIClient.getInstance()
          .post(API_LOGOUT, data, accessToken)
          .then((response) => {
            let res = response.data;
            //consoleLogFunc('res', res);
            resolve(res);
          })
          .catch((error) => {
            let errorMessage = error.message;
            consoleLogFunc("logoutUser", error);
            reject(errorMessage);
          });
      });
    });
  };
/************************************** getFeeLimit ****************************************************/
export const getFeeLimit =
  ({}) =>
  (dispatch) => {
    return new Promise((resolve, reject) => {
      getData(Constants.ACCESS_TOKEN).then((token) => {
        APIClient.getInstance()
          .post(GET_FEE_LIMIT, null, token)
          .then((response) => {
            const res = response.fee;
            consoleLogFunc("res getFeeLimit:::::", res);
            resolve(res);
          })
          .catch((error) => {
            let errorMessage = error.message;
            consoleLogFunc("getFeeLimit failed", error);
            reject(errorMessage);
          });
      });
    });
  };
/************************************** update balance ****************************************************/
export const getCoinDetails =
  ({ data }) =>
  (dispatch) => {
    return new Promise((resolve, reject) => {
      getData(Constants.ACCESS_TOKEN).then((token) => {
        APIClient.getInstance()
          .post(COIN_DETAILS, data, token)
          .then((response) => {
            let res = response;
            // consoleLogFunc('res Updatebalance:::::', res);
            resolve(res);
          })
          .catch((error) => {
            let errorMessage = error.message;
            consoleLogFunc("Updatebalance api failed", error);
            reject(errorMessage);
          });
      });
    });
  };
export const getCoinGraph = (data) => (dispatch) => {
  return new Promise((resolve, reject) => {
    getData(Constants.ACCESS_TOKEN).then((token) => {
      APIClient.getInstance()
        .post(COIN_GRAPH, data, token)
        .then((response) => {
          let res = response;
          // consoleLogFunc('res Updatebalance:::::', res);
          resolve(res);
        })
        .catch((error) => {
          let errorMessage = error.message;
          consoleLogFunc("Updatebalance api failed", error);
          reject(errorMessage);
        });
    });
  });
};
export const getUserBalance =
  ({ data }) =>
  (dispatch) => {
    return new Promise((resolve, reject) => {
      getData(Constants.ACCESS_TOKEN).then((token) => {
        APIClient.getInstance()
          .post(GET_REALTIME_BAL, data, token)
          .then((response) => {
            let res = response.data;
            // consoleLogFunc('res Updatebalance:::::', res);
            resolve(res);
          })
          .catch((error) => {
            let errorMessage = error.message;
            consoleLogFunc("Updatebalance api failed", error);
            reject(errorMessage);
          });
      });
    });
  };
// ************************************** swap coin info ****************************************************/
export const getSwapCoinInfo =
  ({ depositCoinCode, receiveCoinCode }) =>
  (dispatch) => {
    return new Promise((resolve, reject) => {
      let data = {
        depositCoinCode: depositCoinCode,
        receiveCoinCode: receiveCoinCode,
      };

      getData(Constants.ACCESS_TOKEN).then((token) => {
        APIClient.getInstance()
          .post(API_SWFT_COININFO, data, token)
          .then((response) => {
            resolve(response.data);
          })
          .catch((error) => {
            consoleLogFunc("API_SWFT_COININFO errorrrr", error);

            let errorMessage = error.message;
            reject(errorMessage);
          });
      });
    });
  };

// ************************************** ACCOUNT EXCHANGE ****************************************************/
export const accountExchange =
  ({
    depositCoinCode,
    receiveCoinCode,
    depositCoinAmt,
    receiveCoinAmt,
    destinationAddr,
    refundAddr,
  }) =>
  (dispatch) => {
    return new Promise((resolve, reject) => {
      getData(Constants.ACCESS_TOKEN).then((token) => {
        let data = {
          depositCoinCode: depositCoinCode,
          receiveCoinCode: receiveCoinCode,
          depositCoinAmt: parseFloat(depositCoinAmt),
          receiveCoinAmt: parseFloat(receiveCoinAmt),
          destinationAddr: destinationAddr,
          refundAddr: refundAddr,
          equipmentNo: "123456568",
          sourceType: "iOS",
        };
        consoleLogFunc("accountExchange API ••••••••••••••••data===> ", data);
        APIClient.getInstance()
          .post(API_SWFT_ACCOUNT_EXCHANGE, data, token)
          .then((response) => {
            resolve(response.data);
          })
          .catch((error) => {
            let errorMessage = error.message;
            consoleLogFunc("API_SWFT_ACCOUNT_EXCHANGE errorrrr");
            reject(errorMessage);
          });
      });
    });
  };
// ************************************** sortManageWallet ****************************************************/
export const sortManageWallet =
  ({ token, data }) =>
  (dispatch) => {
    return new Promise((resolve, reject) => {
      let dataObj = {
        wallets: data,
      };
      getData(Constants.ACCESS_TOKEN).then((token) => {
        APIClient.getInstance()
          .post(API_MANAGE_WALLET, dataObj, token)
          .then((response) => {
            resolve(response);
          })
          .catch((error) => {
            let errorMessage = error.message;
            consoleLogFunc("sortManageWallet api failed");
            reject(errorMessage);
          });
      });
    });
  };

// ************************************** getNotificationList ****************************************************/
export const getNotificationList =
  ({ data }) =>
  (dispatch) => {
    return new Promise((resolve, reject) => {
      getData(Constants.ACCESS_TOKEN).then((access_token) => {
        getData(Constants.COIN_FAMILY_LIST).then((coinfamilyList) => {
          const coin_families = JSON.parse(coinfamilyList);
          data.coin_family = coin_families;
          APIClient.getInstance()
            .post(API_NOTIFICATIONS_LIST, data, access_token)
            .then((response) => {
              // consoleLogFunc('getNotificationList res::::::', response);
              resolve(response);
            })
            .catch((error) => {
              let errorMessage = error.message;
              consoleLogFunc("API_NOTIFICATIONS_LIST api failed");
              reject(errorMessage);
            });
        });
      });
    });
  };

// ************************************** adminAnnouncements ****************************************************/
export const getAdminAnnouncements =
  ({ data }) =>
  (dispatch) => {
    return new Promise((resolve, reject) => {
      getData(Constants.ACCESS_TOKEN).then((access_token) => {
        // APIClient.getInstance().post(API_ANNOUNCEMENTS, data, access_token).then(response => {
        APIClient.getInstance()
          .post(API_ANNOUNCEMENTS_STATUS_NEW, data, access_token)
          .then((response) => {
            consoleLogFunc("getAdminAnnouncements res::::::", response);
            resolve(response);
          })
          .catch((error) => {
            let errorMessage = error.message;
            consoleLogFunc("getAdminAnnouncements api failed");
            reject(errorMessage);
          });
      });
    });
  };

// ************************************** adminAnnouncements ****************************************************/
export const getNotiStatus =
  ({ data }) =>
  (dispatch) => {
    return new Promise((resolve, reject) => {
      getData(Constants.ACCESS_TOKEN).then((access_token) => {
        getData(Constants.ADDRESS_LIST).then((addrs_list) => {
          const addressListKeys = JSON.parse(addrs_list);
          data.addrsListKeys = addressListKeys;
          APIClient.getInstance()
            .post(API_ANNOUNCEMENTS_STATUS, data, access_token)
            .then((response) => {
              consoleLogFunc("getNotiStatus res::::::", response);
              resolve(response);
            })
            .catch((error) => {
              let errorMessage = error.message;
              consoleLogFunc("getNotiStatus api failed :::::");
              reject(errorMessage);
            });
        });
      });
    });
  };
/**************************************get Currency Api****************************************** */
export const getCurrencyPref = () => (dispatch) => {
  return new Promise((resolve, reject) => {
    APIClient.getInstance()
      .get(API_CURRENCY, "")
      .then((response) => {
        let res = response.data;
        dispatch({ type: GET_NATIVE_CURRENCY_LIST, payload: res });
        resolve(res);
      })
      .catch((error) => {
        let errorMessage = error.message;
        consoleLogFunc("getCurrencyPref api failed");
        reject(errorMessage);
      });
  });
};
/**************************************get fiatValue Api****************************************** */
export const getFiatValue =
  ({ data }) =>
  (dispatch) => {
    return new Promise((resolve, reject) => {
      getData(Constants.ACCESS_TOKEN).then((token) => {
        APIClient.getInstance()
          .post(FIAT_VAL, data, token)
          .then((res) => {
            let response = res.price;
            resolve(response);
          })
          .catch((error) => {
            let errorMessage = error.message;
            consoleLogFunc("getFiatValue api failed");
            reject(errorMessage);
          });
      });
    });
  };

// ************************************** refresh token ****************************************************/
export const refreshToken =
  ({ token, refreshToken }) =>
  (dispatch) => {
    return new Promise((resolve, reject) => {
      let data = {
        token: token,
        refreshToken: refreshToken,
      };
      APIClient.getInstance()
        .post(API_REFRESHTOKEN, data, "")
        .then((response) => {
          // consoleLogFunc('-=-----API_refreshToken-', response);
          resolve(response);
        })
        .catch((error) => {
          let errorMessage = error.message;
          consoleLogFunc("refreshToken errorrrr");
          reject(errorMessage);
        });
    });
  };

// ************************************** fetchNativePrice Api request ****************************************************/
export const fetchNativePrice =
  ({ data }) =>
  (dispatch) => {
    return new Promise((resolve, reject) => {
      getData(Constants.ACCESS_TOKEN).then((access_token) => {
        APIClient.getInstance()
          .post(NATIVE_PRICE, data, access_token)
          .then((response) => {
            resolve(response.data);
          })
          .catch((error) => {
            let errorMessage = error.message;
            consoleLogFunc("ERROR===>", error);
            reject(errorMessage);
          });
      });
    });
  };
// ************************************** fetchNativeCoinPrice Api request ****************************************************/
export const fetchNative_CoinPrice =
  ({ data }) =>
  (dispatch) => {
    return new Promise((resolve, reject) => {
      getData(Constants.ACCESS_TOKEN).then((access_token) => {
        APIClient.getInstance()
          .post(NATIVE_PRICE_ALERT, data, access_token)
          .then((response) => {
            consoleLogFunc("fetchNativeCoinPrice res===>", response);
            resolve(response);
          })
          .catch((error) => {
            let errorMessage = error.message;
            consoleLogFunc("fetchNativeCoinPrice err===>", error);
            reject(errorMessage);
          });
      });
    });
  };
// ************************************** downloadcsv Api request ****************************************************/
export const downloadcsv =
  ({}) =>
  (dispatch) => {
    return new Promise((resolve, reject) => {
      getData(Constants.USER_ID).then((userId) => {
        APIClient.getInstance()
          .get(`${DOWNLOAD_CSV}${parseInt(userId)}`, "")
          .then((response) => {
            resolve(response);
          })
          .catch((error) => {
            let errorMessage = error.message;
            consoleLogFunc("ERROR===>", error);
            reject(errorMessage);
          });
      });
    });
  };
// ************************************** rpc Api request ****************************************************/
export const getRpcUrl =
  ({}) =>
  (dispatch) => {
    return new Promise((resolve, reject) => {
      APIClient.getInstance()
        .get(API_GET_RPC_URL, "")
        .then((response) => {
          consoleLogFunc("chk rpc url res::::", response);
          Singleton.getInstance().ETH_RPC_URL = response.ETH_RPC_URL;
          Singleton.getInstance().BTC_RPC_URL = response.BTC_RPC_URL;
          Singleton.getInstance().BSC_RPC_URL = response.BNB_RPC_URL;
          Singleton.getInstance().SOL_RPC_URL = response.SOL_RPC_URL;
          Singleton.getInstance().MATIC_RPC_URL = response.POL_RPC_URL;
          Singleton.getInstance().ETH_DAPP_RPC_URL = response.ETH_DAPP_RPC_URL;
          Singleton.getInstance().TICS_RPC_URL = response.TICS_RPC_URL;
          Singleton.getInstance().COSMO_TICS_RPC_URL = response.TICS_NATIVE_RPC_URL;
          resolve(response);
        })
        .catch((error) => {
          let errorMessage = error.message;
          consoleLogFunc("ERROR===>", error);
          reject(errorMessage);
        });
    });
  };
/************************************* Success/Fail Dispatches ***************************************************/
const getCoinListFail = (dispatch, errorMessage) => {
  dispatch({
    type: GET_COIN_LIST_FAIL,
    payload: errorMessage,
  });
};

const getCoinListSuccess = (dispatch, data, page) => {
  dispatch({
    type: GET_COIN_LIST_SUCCESS,
    payload: {data, page},
  });
};

// ************************************** 1Inch apis ****************************************************/
// ************************************** get commision data****************************************************/
export const getCommissionData = () => (dispatch) => {
  return new Promise((resolve, reject) => {
    getData(Constants.ACCESS_TOKEN).then((token) => {
      APIClient.getInstance()
        .get(INCH_COMMISSION_DATA, token)
        .then((response) => {
          let res = response;
          consoleLogFunc("INCH_COMMISSION_DATA::::::successs******", res);
          resolve(res);
        })
        .catch((error) => {
          let errorMessage = error.message;
          consoleLogFunc("INCH_COMMISSION_DATA failed:::::::::::", error);
          reject(errorMessage);
        });
    });
  });
};

// ************************************** get quote ****************************************************/
export const getInchQuote =
  ({ data }) =>
  (dispatch) => {
    return new Promise((resolve, reject) => {
      getData(Constants.ACCESS_TOKEN).then((access_token) => {
        APIClient.getInstance()
          .post(INCH_GET_QUOTE, data, access_token)
          .then((response) => {
            consoleLogFunc("INCH_GET_QUOTE res===>", response);
            resolve(response?.data);
          })
          .catch((error) => {
            let errorMessage = error.message;
            consoleLogFunc("INCH_GET_QUOTE err===>", error);
            reject(errorMessage);
          });
      });
    });
  };

// ************************************** check allowance ****************************************************/
export const checkInchAllowance =
  ({ data }) =>
  (dispatch) => {
    return new Promise((resolve, reject) => {
      getData(Constants.ACCESS_TOKEN).then((access_token) => {
        APIClient.getInstance()
          .post(INCH_CHECK_ALLOWANCE, data, access_token)
          .then((response) => {
            consoleLogFunc("INCH_CHECK_ALLOWANCE res===>", response);
            resolve(response?.data);
          })
          .catch((error) => {
            let errorMessage = error.message;
            consoleLogFunc("INCH_CHECK_ALLOWANCE err===>", error);
            reject(errorMessage);
          });
      });
    });
  };
// ************************************** swap spender ****************************************************/
export const inchSwapSpender =
  ({ data }) =>
  (dispatch) => {
    return new Promise((resolve, reject) => {
      getData(Constants.ACCESS_TOKEN).then((access_token) => {
        APIClient.getInstance()
          .post(INCH_SPENDER, data, access_token)
          .then((response) => {
            consoleLogFunc("inchSwapSpender res===>", response);
            resolve(response?.data);
          })
          .catch((error) => {
            let errorMessage = error.message;
            consoleLogFunc("inchSwapSpender err===>", error);
            reject(errorMessage);
          });
      });
    });
  };
// ************************************** swap from 1inch ****************************************************/
export const inchSwap =
  ({ data }) =>
  (dispatch) => {
    return new Promise((resolve, reject) => {
      getData(Constants.ACCESS_TOKEN).then((access_token) => {
        APIClient.getInstance()
          .post(INCH_SWAP, data, access_token)
          .then((response) => {
            consoleLogFunc("INCH_SWAP res===>", response);
            resolve(response?.data);
          })
          .catch((error) => {
            let errorMessage = error.message;
            consoleLogFunc("INCH_SWAP err===>", error);
            reject(errorMessage);
          });
      });
    });
  };

/**************************************GET SWAP PRICE DIFFERENCES ****************************************************/
export const getDaapList = () => {
  return (dispatch) => {
    return new Promise((resolve, reject) => {
      getData(Constants.ACCESS_TOKEN).then((access_token) => {
        APIClient.getInstance()
          .get(GET_DAPP_LIST, access_token)
          .then((response) => {
            consoleLogFunc("response  dappp list>>>>>", response);
            resolve(response);
          })
          .catch((error) => {
            consoleLogFunc("error dappp list>>>>>", error);
            reject(error);
          });
      });
    });
  };
};
/**************************************get CROSS_CHAIN_SWAP_COIN_LIST ****************************************************/
export const getCrossChainLastPair = (data) => (dispatch) => {
  return new Promise((resolve, reject) => {
    getData(Constants.ACCESS_TOKEN).then((token) => {
      APIClient.getInstance()
        .post(API_SWFT_LAST_PAIRS, data, token)
        .then((response) => {
          const result = response?.data;
          resolve(result);
        })
        .catch((error) => {
          consoleLogFunc("error getCoinListChangelly-- ", error);
          reject(error);
        });
    });
  });
};
/**************************************get CROSS_CHAIN_SWAP_COIN_LIST ****************************************************/
export const getCrossChainCoinList = (data) => (dispatch) => {
  return new Promise((resolve, reject) => {
    getData(Constants.ACCESS_TOKEN).then((token) => {
      APIClient.getInstance()
        .post(API_SWFT_GET_COINLIST, data, token)
        .then((response) => {
          const result = response;
          resolve(result);
        })
        .catch((error) => {
          consoleLogFunc("error getCoinListChangelly-- ", error);
          reject(error);
        });
    });
  });
};
/**************************************get CROSS_CHAIN_SWAP_CREATE_TRANSACTION ****************************************************/
export const getOnOffRampCoins = () => (dispatch) => {
  return new Promise((resolve, reject) => {
    fetch("https://api.mercuryo.io/v1.6/lib/currencies")
      .then(async (res) => {
        let jsonVal = await res.json();

        resolve(jsonVal);
      })
      .catch((err) => {
        consoleLogFunc("ERR>>>", err);
        if (err == "The Internet connection appears to be offline.") {
          return reject({ message: Constants.NO_NETWORK });
        } else {
          return reject(err);
        }
      });
  });
};

export const getMinMaxOnOffRamp = (from, to, type) => (dispatch) => {
  return new Promise((resolve, reject) => {
    fetch(
      `https://api.mercuryo.io/v1.6/public/currency-limits?from=${from}&to=${to}&widget_id=${Constants.MERCURYO_WIDGET_ID}&type=${type}`
    )
      .then(async (res) => {
        let jsonVal = await res.json();
        resolve(jsonVal);
      })
      .catch((err) => {
        consoleLogFunc("ERR>>>", err);
        if (err == "The Internet connection appears to be offline.") {
          return reject({ message: Constants.NO_NETWORK });
        } else {
          return reject(err);
        }
      });
  });
};

export const getBuySellQuoteRamp =
  (type, from, to, amount, network) => (dispatch) => {
    return new Promise((resolve, reject) => {
      const url = `https://api.mercuryo.io/v1.6/widget/${type}/rate?from=${from}&to=${to}&amount=${amount}&network=${network}&widget_id=${Constants.MERCURYO_WIDGET_ID}&is_total=true`;
      consoleLogFunc("url>>>", url);

      fetch(url)
        .then(async (res) => {
          let jsonVal = await res.json();
          resolve(jsonVal);
        })
        .catch((err) => {
          consoleLogFunc("ERR>>>", err);
          if (err == "The Internet connection appears to be offline.") {
            return reject({ message: Constants.NO_NETWORK });
          } else {
            return reject(err);
          }
        });
    });
  };

export const onOffRampCreateOrder = (data) => (dispatch) => {
  return new Promise((resolve, reject) => {
    getData(Constants.ACCESS_TOKEN).then((token) => {
      APIClient.getInstance()
        .post(SAVE_MERCURYO_TRANSACTION, data, token)
        .then((response) => {
          consoleLogFunc("changellyOnOffOffer Success **** ");
          resolve(response);
        })
        .catch((error) => {
          consoleLogFunc("changellyOnOffOffer Error ****");
          reject(error);
        });
    });
  });
};

export const getAllWalletBal = (data) => (dispatch) => {
  return new Promise((resolve, reject) => {
    getData(Constants.ACCESS_TOKEN).then((token) => {
      APIClient.getInstance()
        .post(API_ALL_WALLET_BALANCE, data, token)
        .then((response) => {
          consoleLogFunc("getAllWalletBal Success **** ");
          resolve(response);
        })
        .catch((error) => {
          consoleLogFunc("getAllWalletBal Error ****");
          reject(error);
        });
    });
  });
};

export const saveSolTransactionId = (coin, data) => (dispatch) => {
  return new Promise((resolve, reject) => {
    getData(Constants.ACCESS_TOKEN).then((token) => {
      APIClient.getInstance()
        .post(API_SAVE_SOL_TRANSACTION_ID + `${coin}/send`, data, token)
        .then((response) => {
          consoleLogFunc("saveSolTransactionId Success **** ");
          resolve(response);
        })
        .catch((error) => {
          consoleLogFunc("getAllWalletBal Error ****");
          reject(error);
        });
    });
  });
};

export const getNFtList = (data) => (dispatch) => {
  return new Promise((resolve, reject) => {
    getData(Constants.ACCESS_TOKEN).then((token) => {
      APIClient.getInstance()
        .post(GET_NFT_LIST, data, token)
        .then((response) => {
          consoleLogFunc("getNFtList Success **** ");
          resolve(response);
        })
        .catch((error) => {
          consoleLogFunc("getNFtList Error ****");
          reject(error);
        });
    });
  });
};

export const getBannerList = () => (dispatch) => {
  return new Promise((resolve, reject) => {
    getData(Constants.ACCESS_TOKEN).then((token) => {
      APIClient.getInstance()
        .get(API_ANNOUNCEMENTS_BANNER, token)
        .then((response) => {
          consoleLogFunc("getBannerList Success **** ", response);
          resolve(response);
        })
        .catch((error) => {
          consoleLogFunc("getBannerList Error ****",error );
          reject(error);
        });
    });
  })

  // return new Promise((resolve, reject) => {
  //   fetch("http://127.0.0.1:5001/api/v1/user/banners", {
  //     method: "GET",
  //     headers: {
  //       "Content-Type": "application/json",
  //     },
  //   })
  //     .then(async (res) => {
  //       consoleLogFunc("res----getBannerList---", res);

  //       try {
  //         const jsonVal = await res.json();
  //         consoleLogFunc("Json Response 1:getBannerList---", jsonVal);

  //         return resolve(jsonVal);
  //       } catch (e) {
  //         consoleLogFunc("api error99getBannerList", e);
  //         return reject({ message: Constants.SOMETHING_WRONG });
  //       }
  //     })
  //     .catch((err) => {
  //       consoleLogFunc("Json err 1: getBannerList---", err.message);
  //       const errorResponse = JSON?.parse(err?.bodyString || "{}");
  //       reject(err || errorResponse);
  //     });
  // });
};


// ************************************** COSMOS FEE ****************************************************/

  export const getCosmosGasEstimate = () => (dispatch) => {
    return new Promise((resolve, reject) => {
      getData(Constants.ACCESS_TOKEN).then((token) => {
        APIClient.getInstance()
          .get(COSMOS_GAS_ESTIMATE, token)
          .then((response) => {
            consoleLogFunc("getCosmosGasEstimate Success **** ", response);
            resolve(response);
          })
          .catch((error) => {
            consoleLogFunc("getCosmosGasEstimate Error ****",error );
            reject(error);
          });
      });
    })
  }

  // ************************************** COSMOS SEND  ****************************************************/

  export const sendCosmos = (data) => (dispatch) => {
    return new Promise((resolve, reject) => {
      getData(Constants.ACCESS_TOKEN).then((token) => {
        APIClient.getInstance()
          .post(COSMOS_SEND, data, token)
          .then((response) => {
            consoleLogFunc("sendCosmos Success **** ", response);
            resolve(response);
          })
          .catch((error) => {
            consoleLogFunc("sendCosmos Error ****", error);
            reject(error);
          });
      });
    });
  };

    // ************************************** COSMOS ADDRESS  ****************************************************/

    export const sendCosmosAddress = (data) => (dispatch) => {
      return new Promise((resolve, reject) => {
        getData(Constants.ACCESS_TOKEN).then((token) => {
          APIClient.getInstance()
            .post(COSMOS_NATIVE_WALLET, data, token)
            .then((response) => {
              consoleLogFunc("sendCosmosAddress Success **** ", response);
              resolve(response);
            })
            .catch((error) => {
              consoleLogFunc("sendCosmosAddress Error ****", error);
              reject(error);
            });
        });
      });
    };

            // ************************************** CHAIN ABSTRACTION GET COIN LIST  ****************************************************/

            export const getChainAbstractionCoinList = (data) => (dispatch) => {
              return new Promise((resolve, reject) => {
                getData(Constants.ACCESS_TOKEN).then((token) => {
                  APIClient.getInstance()
                    .post(CHAIN_ABSTRACTION_GET_COIN_LIST, data, token)
                    .then((response) => {
                      consoleLogFunc("getChainAbstractionCoinList Success **** ", response);
                      resolve(response);
                    })
                    .catch((error) => {
                      consoleLogFunc("getChainAbstractionCoinList Error ****", error);
                      reject(error);
                    });
                });
              });
            };
    
                    // ************************************** CHAIN ABSTRACTION SAVE  ****************************************************/
    
                    export const chainAbstractionSave = (data) => (dispatch) => {
                      return new Promise((resolve, reject) => {
                        getData(Constants.ACCESS_TOKEN).then((token) => {
                          APIClient.getInstance()
                            .post(CHAIN_ABSTRACTION_SAVE, data, token)
                            .then((response) => {
                              consoleLogFunc("chainAbstractionSave Success **** ", response);
                              resolve(response);
                            })
                            .catch((error) => {
                              consoleLogFunc("chainAbstractionSave Error ****", error);
                              reject(error);
                            });
                        });
                      });
                    };