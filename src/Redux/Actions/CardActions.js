import { APIClient } from '../../components/Api';
import * as Constants from '../../Constants';
import { consoleLogFunc, getData } from '../../Utils/MethodsUtils';
import { APPLY_CARD, BASE_URL, BIND_PHYSICAL_CARD, CALCULATE_DEPOSIT, CARD_FEES, CARD_STATUS, GET_ALL_CARDS, GET_CARD_DETAILS, GET_CARD_HISTORY, GET_COUNTRY_CODES, GET_MINIMUM_RECHARGE_AMOUNT, GET_MINIMUM_RECHARGE_AMOUNT_PHYSICAL, GET_SUPPORTED_COINLIST, PHYSICAL_CARD_STATUS, SAVE_SHIPPING_ADDRESS, SAVE_USER_DATA_VIRTUAL, SEND_EMAIL_OTP, SEND_MOBILE_OTP, UPLOAD_KYC_DETAILS, USER_DETAILS, USER_KYC, USP_CARD_STATUS, VERIFY_OTP } from '../../EndPoint';
import axios from 'axios';
import NodeRSA from 'node-rsa';

/******************************************************************************************/
export const getAllCards = ({ }) => dispatch => {
    return new Promise((resolve, reject) => {
        getData(Constants.ACCESS_TOKEN).then(token => {
            APIClient.getInstance().get(GET_ALL_CARDS, token).then(response => {
                let result = response.data;
                consoleLogFunc('getAllCards success **** ' + JSON.stringify(result));
                resolve(result);
            }).catch(error => {
                let errorMessage = error.message;
                if (!errorMessage)
                    errorMessage = 'Something Went Wrong '
                consoleLogFunc('getAllCards Error ****', error);
                reject(errorMessage);
            });
        });
    });
};

/******************************************************************************************/
export const getSupportedCoinList = ({ }) => dispatch => {
    return new Promise((resolve, reject) => {
        getData(Constants.ACCESS_TOKEN).then(token => {
            APIClient.getInstance().get(GET_SUPPORTED_COINLIST, token).then(response => {
                let result = response.data;
                consoleLogFunc('getSupportedCoinList success **** ' + JSON.stringify(result));
                resolve(result);
            }).catch(error => {
                let errorMessage = error.message;
                if (!errorMessage)
                    errorMessage = 'Something Went Wrong '
                consoleLogFunc('getSupportedCoinList Error ****', error);
                reject(errorMessage);
            });
        });
    });
};

/******************************************************************************************/
export const sendOtp = ({ sendOtpReq, type }) => dispatch => {
    consoleLogFunc("sendOtpReq::::::", sendOtpReq);
    return new Promise((resolve, reject) => {
        getData(Constants.ACCESS_TOKEN).then(token => {
            APIClient.getInstance().post(type == 'email' ? SEND_EMAIL_OTP : SEND_MOBILE_OTP, sendOtpReq, token).then(response => {
                let result = response;
                consoleLogFunc('send otp success **** ' + JSON.stringify(result));
                resolve(result);
            }).catch(error => {
                let errorMessage = error.message;
                if (!errorMessage)
                    errorMessage = 'Something Went Wrong '
                consoleLogFunc('send otp Error ****', error);
                reject(errorMessage);
            });
        });
    });
};

/******************************************************************************************/
export const verifyOTP = (verifyOtpReq) => dispatch => {
    consoleLogFunc("verifyOtpReq::::::", verifyOtpReq);
    return new Promise((resolve, reject) => {
        getData(Constants.ACCESS_TOKEN).then(token => {
            APIClient.getInstance().post(VERIFY_OTP, verifyOtpReq, token).then(response => {
                let result = response;
                consoleLogFunc('verify otp success **** ' + JSON.stringify(result));
                resolve(result);
            }).catch(error => {
                let errorMessage = error.message;
                if (!errorMessage)
                    errorMessage = 'Something Went Wrong '
                consoleLogFunc('verify otp Error ****', error);
                reject(errorMessage);
            });
        });
    });
};

/******************************************************************************************/
export const saveUserData = (saveDataReq) => dispatch => {
    consoleLogFunc("saveDataReq::::::", saveDataReq);
    return new Promise((resolve, reject) => {
        getData(Constants.ACCESS_TOKEN).then(token => {
            APIClient.getInstance().post(SAVE_USER_DATA_VIRTUAL, saveDataReq, token).then(response => {
                let result = response;
                consoleLogFunc('saveDataReq success **** ' + JSON.stringify(result));
                resolve(result);
            }).catch(error => {
                let errorMessage = error.message;
                if (!errorMessage)
                    errorMessage = 'Something Went Wrong '
                consoleLogFunc('saveDataReq Error ****', JSON.stringify(error));
                reject(errorMessage);
            });
        });
    });
};

/******************************************************************************************/
export const checkCardStatus = (req) => dispatch => {
    return new Promise((resolve, reject) => {
        getData(Constants.ACCESS_TOKEN).then(token => {
            APIClient.getInstance().post(CARD_STATUS, req, token).then(response => {
                let result = response;
                consoleLogFunc('checkCardStatus success **** ' + JSON.stringify(result));
                resolve(result);
            }).catch(error => {
                let errorMessage = error.message;
                if (!errorMessage)
                    errorMessage = 'Something Went Wrong '
                consoleLogFunc('checkCardStatus Error ****', JSON.stringify(error));
                reject(errorMessage);
            });
        });
    });
};

/******************************************************************************************/
export const checkPhysicalCardStatus = (req) => dispatch => {
    consoleLogFunc("checkPhysicalCardStatus::::::", req);
    return new Promise((resolve, reject) => {
        getData(Constants.ACCESS_TOKEN).then(token => {
            APIClient.getInstance().post(PHYSICAL_CARD_STATUS, req, token).then(response => {
                let result = response.data;
                consoleLogFunc('checkPhysicalCardStatus success **** ' + JSON.stringify(result));
                resolve(result);
            }).catch(error => {
                let errorMessage = error.message;
                if (!errorMessage)
                    errorMessage = 'Something Went Wrong '
                consoleLogFunc('checkPhysicalCardStatus Error ****', JSON.stringify(error));
                reject(errorMessage);
            });
        });
    });
};

/******************************************************************************************/
export const checkUSPCardStatus = (req) => dispatch => {
    return new Promise((resolve, reject) => {
        getData(Constants.ACCESS_TOKEN).then(token => {
            APIClient.getInstance().post(USP_CARD_STATUS, req, token).then(response => {
                let result = response.data;
                consoleLogFunc('checkUSPCardStatus success **** ' + JSON.stringify(result));
                resolve(result);
            }).catch(error => {
                let errorMessage = error.message;
                if (!errorMessage)
                    errorMessage = 'Something Went Wrong '
                consoleLogFunc('checkUSPCardStatus Error ****', JSON.stringify(error));
                reject(errorMessage);
            });
        });
    });
};

/******************************************************************************************/
export const getVirtualCardFees = () => dispatch => {
    return new Promise((resolve, reject) => {
        getData(Constants.ACCESS_TOKEN).then(token => {
            APIClient.getInstance().get(CARD_FEES, token).then(response => {
                let result = response;
                consoleLogFunc('getVirtualCardFees success **** ' + JSON.stringify(result));
                resolve(result);
            }).catch(error => {
                let errorMessage = error.message;
                if (!errorMessage)
                    errorMessage = 'Something Went Wrong '
                consoleLogFunc('getVirtualCardFees Error ****', JSON.stringify(error));
                reject(errorMessage);
            });
        });
    });
};

/******************************************************************************************/
export const getUspCardFees = (cardID) => dispatch => {
    return new Promise((resolve, reject) => {
        getData(Constants.ACCESS_TOKEN).then(token => {
            APIClient.getInstance().get(CARD_FEES + `?cardId=${cardID}`, token).then(response => {
                let result = response;
                consoleLogFunc('getUspCardFees success **** ' + JSON.stringify(result));
                resolve(result);
            }).catch(error => {
                let errorMessage = error.message;
                if (!errorMessage)
                    errorMessage = 'Something Went Wrong '
                consoleLogFunc('getUspCardFees Error ****', JSON.stringify(error));
                reject(errorMessage);
            });
        });
    });
};

/******************************************************************************************/
export const applyCard = (applyCardReq) => dispatch => {
    return new Promise((resolve, reject) => {
        getData(Constants.ACCESS_TOKEN).then(token => {
            APIClient.getInstance().post(APPLY_CARD, applyCardReq, token).then(response => {
                let result = response;
                consoleLogFunc('applyCard success **** ' + JSON.stringify(result));
                resolve(result);
            }).catch(error => {
                let errorMessage = error.message;
                if (!errorMessage)
                    errorMessage = 'Something Went Wrong '
                consoleLogFunc('applyCard Error ****', JSON.stringify(error));
                reject(errorMessage);
            });
        });
    });
};

/******************************************************************************************/
export const getCardDetail = (type) => dispatch => {
    consoleLogFunc("getCardDetailReq:::::");
    return new Promise((resolve, reject) => {
        getData(Constants.ACCESS_TOKEN).then(token => {
            APIClient.getInstance().get(type == 'Physical' ? GET_CARD_DETAILS + '?card=Physical' : GET_CARD_DETAILS, token).then(response => {
                let result = response;
                consoleLogFunc('getCardDetailReq success **** ' + JSON.stringify(result));
                resolve(result);
            }).catch(error => {
                let errorMessage = error.message;
                if (!errorMessage)
                    errorMessage = 'Something Went Wrong '
                consoleLogFunc('getCardDetailReq Error ****', JSON.stringify(error));
                reject(errorMessage);
            });
        });
    });
};

/******************************************************************************************/
export const getUSPCardDetail = (cardID) => dispatch => {
    return new Promise((resolve, reject) => {
        getData(Constants.ACCESS_TOKEN).then(token => {
            APIClient.getInstance().get(GET_CARD_DETAILS + `?cardId=${cardID}`, token).then(response => {
                let result = response;
                consoleLogFunc('getUSPCardDetail success **** ' + JSON.stringify(result));
                resolve(result);
            }).catch(error => {
                let errorMessage = error.message;
                if (!errorMessage)
                    errorMessage = 'Something Went Wrong '
                consoleLogFunc('getUSPCardDetail Error ****', JSON.stringify(error));
                reject(errorMessage);
            });
        });
    });
};

/******************************************************************************************/
export const getPhysicalCardDetail = (cardID) => dispatch => {
    return new Promise((resolve, reject) => {
        getData(Constants.ACCESS_TOKEN).then(token => {
            APIClient.getInstance().get(GET_CARD_DETAILS + `?cardId=${cardID}`, token).then(response => {
                let result = response;
                consoleLogFunc('getPhysicalCardDetail success **** ' + JSON.stringify(result));
                resolve(result);
            }).catch(error => {
                let errorMessage = error.message;
                if (!errorMessage)
                    errorMessage = 'Something Went Wrong '
                consoleLogFunc('getPhysicalCardDetail Error ****', JSON.stringify(error));
                reject(errorMessage);
            });
        });
    });
};

/******************************************************************************************/
export const getCardHistory = (getCardHistoryReq) => dispatch => {
    consoleLogFunc("getCardHistoryReq:::::", getCardHistoryReq);
    return new Promise((resolve, reject) => {
        getData(Constants.ACCESS_TOKEN).then(token => {
            APIClient.getInstance().post(GET_CARD_HISTORY, getCardHistoryReq, token).then(response => {
                let result = response;
                consoleLogFunc('getCardHistory success **** ' + JSON.stringify(result));
                resolve(result);
            }).catch(error => {
                let errorMessage = error.message;
                if (!errorMessage)
                    errorMessage = 'Something Went Wrong '
                consoleLogFunc('getCardDetailReq Error ****', JSON.stringify(error));
                reject(errorMessage);
            });
        });
    });
};

/******************************************************************************************/
export const getCountryCodes = () => dispatch => {
    return new Promise((resolve, reject) => {
        getData(Constants.ACCESS_TOKEN).then(token => {
            APIClient.getInstance().get(GET_COUNTRY_CODES, token).then(response => {
                let result = response;
                // consoleLogFunc('getCountryCodes success **** ' + JSON.stringify(result));
                resolve(result);
            }).catch(error => {
                let errorMessage = error.message;
                if (!errorMessage)
                    errorMessage = 'Something Went Wrong '
                consoleLogFunc('getCountryCodes Error ****', JSON.stringify(error));
                reject(errorMessage);
            });
        });
    });
};

/******************************************************************************************/
export const getMinimumRechargeAmount = () => dispatch => {
    consoleLogFunc("getMinimumRechargeAmount:::::");
    return new Promise((resolve, reject) => {
        getData(Constants.ACCESS_TOKEN).then(token => {
            APIClient.getInstance().get(GET_MINIMUM_RECHARGE_AMOUNT, token).then(response => {
                let result = response;
                consoleLogFunc('getMinimumRechargeAmount success **** ' + JSON.stringify(result));
                resolve(result);
            }).catch(error => {
                let errorMessage = error.message;
                if (!errorMessage)
                    errorMessage = 'Something Went Wrong '
                consoleLogFunc('getMinimumRechargeAmount Error ****', JSON.stringify(error));
                reject(errorMessage);
            });
        });
    });
};

/******************************************************************************************/
export const calculateCardDeposit = (calculateCardDepositReq) => dispatch => {
    consoleLogFunc("calculateCardDepositReq:::::");
    return new Promise((resolve, reject) => {
        getData(Constants.ACCESS_TOKEN).then(token => {
            APIClient.getInstance().post(CALCULATE_DEPOSIT, calculateCardDepositReq, token).then(response => {
                let result = response;
                consoleLogFunc('calculateCardDeposit success **** ' + JSON.stringify(result));
                resolve(result);
            }).catch(error => {
                let errorMessage = error.message;
                if (!errorMessage)
                    errorMessage = 'Something Went Wrong '
                consoleLogFunc('calculateCardDeposit Error ****', JSON.stringify(error));
                reject(errorMessage);
            });
        });
    });
}

/******************************************************************************************/
export const saveShippingAddress = (saveShippingAddressReq) => dispatch => {
    consoleLogFunc("saveShippingAddressReq:::::", saveShippingAddressReq);
    return new Promise((resolve, reject) => {
        getData(Constants.ACCESS_TOKEN).then(token => {
            APIClient.getInstance().post(SAVE_SHIPPING_ADDRESS, saveShippingAddressReq, token).then(response => {
                let result = response;
                consoleLogFunc('saveShippingAddressReq success **** ' + JSON.stringify(result));
                resolve(result);
            }).catch(error => {
                let errorMessage = error.message;
                if (!errorMessage)
                    errorMessage = 'Something Went Wrong '
                consoleLogFunc('saveShippingAddressReq Error ****', JSON.stringify(error));
                reject(errorMessage);
            });
        });
    });
}

/******************************************************************************************/
export const getMinimumRechargeAmountPhysical = (req) => dispatch => {
    consoleLogFunc("getMinimumRechargeAmountPhysical:::::", req);
    return new Promise((resolve, reject) => {
        getData(Constants.ACCESS_TOKEN).then(token => {
            APIClient.getInstance().post(GET_MINIMUM_RECHARGE_AMOUNT_PHYSICAL, req, token).then(response => {
                let result = response;
                consoleLogFunc('getMinimumRechargeAmountPhysical success **** ' + JSON.stringify(result));
                resolve(result);
            }).catch(error => {
                let errorMessage = error.message;
                if (!errorMessage)
                    errorMessage = 'Something Went Wrong '
                consoleLogFunc('getMinimumRechargeAmountPhysical Error ****', JSON.stringify(error));
                reject(errorMessage);
            });
        });
    });
};

/******************************************************************************************/
export const getPhysicalCardFees = (cardID) => dispatch => {
    return new Promise((resolve, reject) => {
        getData(Constants.ACCESS_TOKEN).then(token => {
            APIClient.getInstance().get(CARD_FEES + `?cardId=${cardID}`, token).then(response => {
                let result = response;
                consoleLogFunc('getPhysicalCardFees success **** ' + JSON.stringify(result));
                resolve(result);
            }).catch(error => {
                let errorMessage = error.message;
                if (!errorMessage)
                    errorMessage = 'Something Went Wrong '
                consoleLogFunc('getPhysicalCardFees Error ****', JSON.stringify(error));
                reject(errorMessage);
            });
        });
    });
};

/******************************************************************************************/
export const bindPhysicalCard = (req) => dispatch => {
    consoleLogFunc("bindPhysicalCard::::::::", req);
    return new Promise((resolve, reject) => {
        getData(Constants.ACCESS_TOKEN).then(token => {
            APIClient.getInstance().post(BIND_PHYSICAL_CARD, req, token).then(response => {
                let result = response;
                consoleLogFunc('bindPhysicalCard success **** ' + JSON.stringify(result));
                resolve(result);
            }).catch(error => {
                let errorMessage = error.message;
                if (!errorMessage)
                    errorMessage = 'Something Went Wrong '
                consoleLogFunc('bindPhysicalCard Error ****', JSON.stringify(error));
                reject(errorMessage);
            });
        });
    });
};

/******************************************************************************************/
export const userKyc = (req) => dispatch => {
    return new Promise((resolve, reject) => {
        consoleLogFunc("promise:::");
        getData(Constants.ACCESS_TOKEN).then(token => {
            consoleLogFunc('UserToken', token)
            consoleLogFunc('url', `${BASE_URL}${USER_KYC}`)
            consoleLogFunc("params11", req);
            axios.post(`${BASE_URL}${USER_KYC}`, req, {
                headers: {
                    "Content-Type": "multipart/form-data",
                    Authorization: token,
                }
            }).then(async res => {
                if (res.status == 200) {
                    resolve(res)
                }
            }).catch((error) => {
                const err = error?.response?.data || 'Something went wrong'
                reject(err.message);
            });

        }).catch(error => {

            consoleLogFunc('userKyc Error ****', error);

        });
    });
};

/******************************************************************************************/
export const uploadKycDetails = (data) => dispatch => {
    return new Promise((resolve, reject) => {
        getData(Constants.ACCESS_TOKEN).then(token => {
            APIClient.getInstance().postFileNew(UPLOAD_KYC_DETAILS, data, token).then(response => {
                let result = response;
                consoleLogFunc('uploadKycDetails success **** ' + JSON.stringify(result));
                resolve(result);
            }).catch(error => {
                let errorMessage = error.message;
                if (!errorMessage)
                    errorMessage = 'Something Went Wrong '
                consoleLogFunc('uploadKycDetails Error ****', JSON.stringify(error));
                reject(errorMessage);
            });
        });
    });
}

/******************************************************************************************/
export const getUspUserDetails = ({ data }) => dispatch => {
    return new Promise((resolve, reject) => {
        getData(Constants.ACCESS_TOKEN).then(token => {
            APIClient.getInstance().post(USER_DETAILS, data, token).then(response => {
                let result = response.data;
                consoleLogFunc('getUserDetails success **** ' + JSON.stringify(result));
                resolve(result);
            }).catch(error => {
                let errorMessage = error.message;
                if (!errorMessage)
                    errorMessage = 'Something Went Wrong '
                consoleLogFunc('getUserDetails Error ****', JSON.stringify(error));
                reject(errorMessage);
            });
        });
    });
}

