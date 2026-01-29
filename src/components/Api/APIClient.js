import NodeRSA from 'node-rsa';
import { API_REFRESHTOKEN, BASE_URL } from '../../../src/EndPoint';
import * as Constants from '../../Constants';
import { consoleLogFunc, getData, saveData } from '../../Utils/MethodsUtils';
import { fetch } from 'react-native-ssl-pinning';

const certs = ["coingecko", "qubetics", "swftc"]
const APIClient = class APIClient {
     static myInstance = null;
     static getInstance() {
          if (APIClient.myInstance == null) {
               APIClient.myInstance = new APIClient();
          }
          return this.myInstance;
     }
     // ************************************************* Get **************************************************
     async get(endpoint, UserToken) {
          if (!global.isConnected) {
               return new Promise((resolve, reject) => {
                    reject({ message: Constants.NO_NETWORK });
               });
          } else {
               return new Promise(async (resolve, reject) => {
                    fetch(`${BASE_URL}${endpoint}`, {
                         method: 'GET',
                         headers: {
                              Accept: 'application/json',
                              'Content-Type': 'application/json',
                              'content-language': await getData(Constants.SELECTED_LANGUAGE) || 'en',
                              Authorization: UserToken || '',
                              'app-version': '1.1'
                         },
                         sslPinning: {
                              certs: certs
                         },
                         disableAllSecurity: false,
                    }).then(async res => {
                         // consoleLogFunc('Json Response 1: ', res);
                         try {
                              let jsonVal = await res.json();
                              if (jsonVal.code == 409) {
                                   this.refreshTheToken().then(async res => {
                                        const UserToken = await getData(Constants.ACCESS_TOKEN)
                                        const response = await this.get(endpoint, UserToken);
                                        return resolve(response);
                                        // this.get(endpoint, UserToken)
                                   }).catch(err => {
                                        consoleLogFunc('chk refresh errrrrget', err);
                                   })
                              } else {
                                   if (res.status == false || res?.status == 400 || res?.status == 426 || jsonVal?.code == 426) {
                                        if (jsonVal.message == undefined) {
                                             return reject({ message: Constants.SOMETHING_WRONG });
                                        }
                                        return reject(handleReject(jsonVal));
                                   }
                                   return resolve(jsonVal);
                              }
                         } catch (e) {
                              return reject({ message: Constants.SOMETHING_WRONG });
                         }
                    }).catch(err => {
                         consoleLogFunc('Json err 1: ', err);
                         const errorResponse = JSON.parse(err?.bodyString || '{}')
                         if (errorResponse?.code == 409) {
                              this.refreshTheToken().then(async res => {
                                   const response = await this.postToken(endpoint, data);
                                   return resolve(response);
                              }).catch(err => {
                                   return reject(err);
                              })
                         }
                         // Add 426 handling in catch as well
                         else if (errorResponse?.code == 426) {
                              return reject(handleReject(errorResponse));
                         } else {
                              return reject(handleReject(err || errorResponse));
                         }
                         // else {
                         //      reject(handleReject(err || errorResponse))
                         // }
                    });
               });
          }
     }

     // ************************************************* Post **************************************************
     post(endpoint, data, UserToken) {
          if (!global.isConnected) {
               return new Promise((resolve, reject) => {
                    reject({ message: Constants.NO_NETWORK });
               });
          } else {
               return new Promise(async (resolve, reject) => {

                    consoleLogFunc('endpoint', `${BASE_URL}${endpoint}`, 'data', this.encodeData(data), 'UserToken', UserToken);
                    fetch(`${BASE_URL}${endpoint}`, {
                         method: 'POST',
                         headers: {
                              'Content-Type': 'application/json',
                              'content-language': await getData(Constants.SELECTED_LANGUAGE) || 'en',
                              Authorization: UserToken || '',
                              'app-version': '1.1'
                         },
                         body: data != null ? this.encodeData(data) : '',
                         sslPinning: {
                              certs: certs
                         },
                         disableAllSecurity: false,

                    }).then(async res => {
                         try {
                              const jsonVal = await res.json();
                              // consoleLogFunc('Json Response 1: ', jsonVal);
                              // consoleLogFunc('res Response 1: ', res);

                              if (jsonVal.code == 409) {
                                   this.refreshTheToken().then(async res => {
                                        consoleLogFunc('refresh token resp:::::::')
                                        const response = await this.postToken(endpoint, data);
                                        return resolve(response);
                                        //  this.postToken(endpoint, data)
                                   }).catch(err => {
                                        consoleLogFunc('chk refresh errrrr post', err);
                                        return reject(handleReject(err));
                                   })
                              } else {
                                   consoleLogFunc('res Response else: ');
                                   // res.status === false ||
                                   // res?.status === 400 ||
                                   // jsonVal?.code === 400 ||
                                   // jsonVal?.code === 426
                                   if (res.status == false || res?.status == 400 || res?.status == 426 || jsonVal?.code == 426) {
                                        // consoleLogFunc('res Response if1111: ', jsonVal?.data?.message, '---', !!jsonVal?.data?.message);

                                        if (!!jsonVal?.data?.message) {
                                             return reject(handleReject(jsonVal));
                                        }
                                        if (jsonVal.message == undefined) {
                                             // consoleLogFunc('res Response if222: ', jsonVal?.data?.message, '---', !!jsonVal?.data?.message);

                                             return reject({
                                                  message: Constants.SOMETHING_WRONG,
                                             });
                                        }
                                        return reject(handleReject(jsonVal));
                                   } else {
                                        return resolve(jsonVal);
                                   }
                              }
                         } catch (e) {
                              consoleLogFunc('api error99', e);
                              return reject({ message: Constants.SOMETHING_WRONG });
                         }
                    }).catch(err => {
                         consoleLogFunc('Json err 1>>>>', err);
                         const errorResponse = JSON?.parse(err?.bodyString || '{}')
                         if (errorResponse?.code == 409) {
                              this.refreshTheToken().then(async res => {
                                   const response = await this.postToken(endpoint, data);
                                   return resolve(response);
                              }).catch(err => {
                                   return reject(handleReject(err));
                              })
                         }
                         // Add 426 handling in catch as well
                         else if (errorResponse?.code == 426) {
                              return reject(handleReject(errorResponse));
                         } else {
                              return reject(handleReject(err || errorResponse));
                         }

                         // else {
                         //      reject(handleReject(err || errorResponse))
                         // }
                    });
               });
          }
     }

     // ************************************************* Post With URL **************************************************
     postWithFullUrl(endpoint, data, UserToken) {
          if (!global.isConnected) {
               return new Promise((resolve, reject) => {
                    reject({ message: Constants.NO_NETWORK });
               });
          } else {
               return new Promise(async (resolve, reject) => {
                    fetch(`${endpoint}`, {
                         method: 'POST',
                         headers: {
                              'Content-Type': 'application/json',
                              'content-language': await getData(Constants.SELECTED_LANGUAGE) || 'en',
                              Authorization: UserToken || '',
                              'app-version': '1.1'
                         },
                         body: data != null ? JSON.stringify(data) : null,
                         sslPinning: {
                              certs: certs
                         },
                         disableAllSecurity: false //Let it be disable
                    }).then(async res => {
                         try {
                              let jsonVal = await res.json();
                              if (jsonVal.code == 409) {
                                   this.refreshTheToken().then(async res => {
                                        const response = await this.postToken(endpoint, data);
                                        return resolve(response);
                                        // this.postToken(endpoint, data)
                                   }).catch(err => {
                                        consoleLogFunc('chk refresh errrrr post full url', err);
                                   })
                              } else {
                                   if (res.status == false || res?.status == 400 || res?.status == 426 || jsonVal?.code == 426) {
                                        if (jsonVal.message == undefined) {
                                             return reject({ message: Constants.SOMETHING_WRONG });
                                        }
                                        return reject(handleReject(jsonVal));
                                   }
                                   return resolve(jsonVal);
                              }
                         } catch (e) {
                              consoleLogFunc('api error333', e);
                              return reject({ message: Constants.SOMETHING_WRONG });
                         }
                    }).catch(err => {
                         const errorResponse = JSON.parse(err?.bodyString || '{}')
                         if (errorResponse?.code == 409) {
                              this.refreshTheToken().then(async res => {
                                   const response = await this.postToken(endpoint, data);
                                   return resolve(response);
                              }).catch(err => {
                                   return reject(handleReject(err));
                              })
                         }
                         // Add 426 handling in catch as well
                         else if (errorResponse?.code === 426) {
                              return reject(handleReject(errorResponse));
                         } else {
                              return reject(handleReject(err || errorResponse));
                         }
                    });
               });
          }
     }

     // *********************************************** Get GasPrice *********************************************
     getGasPrice(endpoint, UserToken) {
          if (!global.isConnected) {
               return new Promise((resolve, reject) => {
                    reject({ message: Constants.NO_NETWORK });
               });
          } else {
               return new Promise(async (resolve, reject) => {
                    fetch(`${endpoint}`, {
                         method: 'GET',
                         headers: {
                              Accept: 'application/json',
                              'Content-Type': 'application/json',
                              'content-language': await getData(Constants.SELECTED_LANGUAGE) || 'en',
                              'api-access-token': UserToken,
                              'app-version': '1.1'
                         },
                         sslPinning: {
                              certs: certs
                         },
                         disableAllSecurity: false //Let it be disable
                    }).then(async res => {
                         try {
                              const jsonVal = await res.json();
                              if (jsonVal.code == 409) {
                                   this.refreshTheToken().then(async res => {
                                        const UserToken = await getData(Constants.ACCESS_TOKEN)
                                        this.getGasPrice(endpoint, UserToken)
                                   }).catch(err => {
                                        consoleLogFunc('chk refresh errrrr gas price', err);
                                   })
                              } else {
                                   if (res.status == false || res?.status == 400 || res?.status == 426 || jsonVal?.code == 426) {
                                        if (jsonVal.message == undefined) {
                                             return reject({ message: Constants.SOMETHING_WRONG });
                                        }
                                        return reject(handleReject(jsonVal));
                                   }
                                   return resolve(jsonVal);
                              }
                         } catch (e) {
                              return reject({ message: Constants.SOMETHING_WRONG });
                         }
                    }).catch(err => {
                         const errorResponse = JSON.parse(err?.bodyString || '{}')
                         if (errorResponse?.code == 409) {
                              this.refreshTheToken().then(async res => {
                                   const response = await this.postToken(endpoint, data);
                                   return resolve(response);
                              }).catch(err => {
                                   return reject(handleReject(err));
                              })
                         }
                         // Add 426 handling in catch as well
                         else if (errorResponse?.code === 426) {
                              return reject(handleReject(errorResponse));
                         } else {
                              return reject(handleReject(err || errorResponse));
                         }
                         //  else {
                         //      reject(handleReject(err || errorResponse))
                         // }
                    });
               });
          }
     }

     // ************************************************* refreshTheToken **************************************************
     refreshTheToken() {
          return new Promise(async (resolve, reject) => {
               try {
                    const token = await getData(Constants.REFRESH_TOKEN);
                    const old_token = await getData(Constants.ACCESS_TOKEN);
                    const response = await this.postToken(API_REFRESHTOKEN, { token: old_token, refreshToken: token }, '');
                    consoleLogFunc("llllllllll_____", response);
                    if (response.status) {
                         consoleLogFunc('response ... ', response);
                         getData(Constants.MULTI_WALLET_LIST).then(list => {
                              const Arr = JSON.parse(list);
                              consoleLogFunc('Arr', Arr);
                              const newMultiWalletArray = Arr.map((item, index) => {
                                   consoleLogFunc('item________', item);
                                   if (item?.defaultWallet) {
                                        item.user_jwtToken = response.token;
                                        item.user_refreshToken = response.refreshToken;
                                   }
                                   return item;
                              });
                              saveData(Constants.MULTI_WALLET_LIST, JSON.stringify(newMultiWalletArray));
                              saveData(Constants.ACCESS_TOKEN, response.token);
                              saveData(Constants.REFRESH_TOKEN, response.refreshToken);
                              resolve()
                         })
                    } else {
                    }
               } catch (error) {
                    reject(handleReject(error))
                    consoleLogFunc('error refresh token ', error);
               }
          })
     };

     // ************************************************* postToken **************************************************
     async postToken(endpoint, data) {
          const UserToken = await getData(Constants.ACCESS_TOKEN);
          if (!global.isConnected) {
               return new Promise((resolve, reject) => {
                    reject({ message: Constants.NO_NETWORK });
               });
          } else {
               return new Promise(async (resolve, reject) => {
                    fetch(`${BASE_URL}${endpoint}`, {
                         method: 'POST',
                         headers: { 'Content-Type': 'application/json', Authorization: UserToken || '', 'content-language': await getData(Constants.SELECTED_LANGUAGE) || 'en', },
                         body: data != null ? endpoint.includes('user/file_upload') ? data : this.encodeData(data) : null,
                         sslPinning: {
                              certs: certs
                         },
                         disableAllSecurity: false
                    }).then(async res => {
                         try {
                              const jsonVal = await res.json();
                              consoleLogFunc('Json Response 5: post toekn', jsonVal);
                              if (res.status == false || res?.status == 400 || res?.status == 426 || jsonVal?.code == 426) {
                                   if (jsonVal.message == undefined) {
                                        return reject({ message: Constants.SOMETHING_WRONG });
                                   }
                                   return reject(handleReject(jsonVal));
                              } else {
                                   return resolve(jsonVal);
                              }
                         } catch (e) {
                              consoleLogFunc('api error99', e);
                              return reject({ message: Constants.SOMETHING_WRONG });
                         }
                    }).catch(err => {
                         consoleLogFunc('chk post errr::::2', err);
                         reject(handleReject(err))
                    });
               });
          }
     }

     // ************************************************* PostSwap **************************************************
     postSwap(endpoint, data, UserToken) {
          if (!global.isConnected) {
               return new Promise((resolve, reject) => {
                    reject({ message: Constants.NO_NETWORK });
               });
          } else {
               return new Promise((resolve, reject) => {
                    fetch(`${endpoint}`, {
                         method: 'POST',
                         headers: {
                              'Content-Type': 'application/json',
                              Authorization: UserToken || '',
                              'app-version': '1.1'
                         },
                         body: data != null ? JSON.stringify(data) : null,
                         sslPinning: {
                              certs: certs
                         },
                         disableAllSecurity: false
                    }).then(async res => {
                         try {
                              let jsonVal = await res.json();
                              if (res.status == false || res?.status == 400 || res?.status == 426 || jsonVal?.code == 426) {
                                   if (jsonVal.message == undefined) {
                                        return reject({ message: Constants.SOMETHING_WRONG });
                                   }
                                   return reject(handleReject(jsonVal));
                              }
                              return resolve(jsonVal);
                         } catch (e) {
                              consoleLogFunc('api error111', e);
                              return reject({ message: Constants.SOMETHING_WRONG });
                         }
                    })
                         .catch(reject);
               });
          }
     }

          // ************************************************* PostMPC **************************************************
          PostMPC(endpoint, data, UserToken) {
               if (!global.isConnected) {
                    return new Promise((resolve, reject) => {
                         reject({ message: Constants.NO_NETWORK });
                    });
               } else {
                    return new Promise((resolve, reject) => {
                    consoleLogFunc('endpoint', `${endpoint}`, 'data', data, 'UserToken', UserToken);

                         fetch(`${endpoint}`, {
                              method: 'POST',
                              headers: {
                                   'Content-Type': 'application/json',
                                   Authorization: UserToken || '',
                                   'app-version': '1.1'
                              },
                              body: data != null ? JSON.stringify(data) : null,
                              sslPinning: {
                                   certs: certs
                              },
                              disableAllSecurity: false
                         }).then(async res => {
                              try {
                                   let jsonVal = await res.json();
                                   if (res.status == false || res?.status == 400 || res?.status == 426 || jsonVal?.code == 426) {
                                        if (jsonVal.message == undefined) {
                                             return reject({ message: Constants.SOMETHING_WRONG });
                                        }
                                        return reject(handleReject(jsonVal));
                                   }
                                   return resolve(jsonVal);
                              } catch (e) {
                                   consoleLogFunc('api error111', e);
                                   return reject({ message: Constants.SOMETHING_WRONG });
                              }
                         })
                              .catch(reject);
                    });
               }
          }

     // ************************************************* getGeckoSymbolsL **************************************************
     getGeckoSymbols(url) {
          return new Promise((resolve, reject) => {
               fetch(url, {
                    method: 'GET',
                    sslPinning: {
                         certs: certs
                    },
                    disableAllSecurity: false
               }).then(response => response.json()).then(responseJson => {
                    resolve({ list: responseJson });
               }).catch(error => {
                    console.error(error);
                    reject();
               });
          });
     }

     // ************************************************* encodeData **************************************************
     encodeData = data => {
          const second = new NodeRSA(Constants.NODE_RSA_PUBLIC_KEY);
          second.setOptions({ encryptionScheme: 'pkcs1' });
          const enc = second.encrypt(data, 'base64');
          const dataa = {
               dataString: enc,
          };
          return JSON.stringify(dataa);
     };

     // ************************************************* PostFile **************************************************
     postFileNew = (endpoint, data, UserToken) =>
          new Promise(async (resolve, reject) => {
               fetch(`${BASE_URL}${endpoint}`, {
                    method: 'POST',
                    headers: {
                         Authorization: UserToken || '',
                         'content-language': await getData(Constants.SELECTED_LANGUAGE) || 'en',
                         'app-version': '1.1'
                    },
                    body: data,
                    sslPinning: {
                         certs: certs
                    },
                    disableAllSecurity: false
               }).then(async res => {
                    try {
                         const jsonVal = await res.json();
                         consoleLogFunc('Json Response 3:', jsonVal);
                         if (jsonVal.code == 409) {
                              this.refreshTheToken().then(async res => {
                                   const response = await this.postToken(endpoint, data);
                                   return resolve(response);
                                   // this.postToken(endpoint, data, false)
                              }).catch(err => {
                                   consoleLogFunc('chk refresh errrrr post', err);
                              })
                         } else {
                              if (res.status == false || res?.status == 400 || res?.status == 426 || jsonVal?.code == 426) {
                                   if (jsonVal.message == undefined) {
                                        return reject({ message: Constants.SOMETHING_WRONG });
                                   }
                                   return reject(handleReject(jsonVal));
                              } else {
                                   return resolve(jsonVal);
                              }
                         }
                    } catch (e) {
                         consoleLogFunc('api error99', e);
                         return reject({ message: Constants.SOMETHING_WRONG });
                    }
               }).catch(err => {
                    const errorResponse = JSON?.parse(err?.bodyString || '{}');
                    if (errorResponse?.code == 409) {
                         this.refreshTheToken().then(async res => {
                              const response = await this.postToken(endpoint, data);
                              return resolve(response);
                         }).catch(err => {
                              return reject(handleReject(err));
                         })
                    }
                    // Add 426 handling in catch as well
                    else if (errorResponse?.code === 426) {
                         return reject(handleReject(errorResponse));
                    } else {
                         return reject(handleReject(err || errorResponse));
                    }
                    //  else {
                    //      reject(handleReject(err || errorResponse))
                    // }
               });
          });
};

const handleReject = (errObj) => {
     consoleLogFunc(errObj, 'errObjerrObj')
     if (errObj?.message) {
          return errObj
     } else if (errObj?.toString()?.toLowerCase()?.includes("network")) {
          return { message: Constants.NO_NETWORK }
     } else {
          return { message: Constants.SOMETHING_WRONG }
     }
}
export { APIClient };
