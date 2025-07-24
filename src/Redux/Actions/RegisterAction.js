import {
  REGISTER_USER,
  REGISTER_USER_FAIL,
  REGISTER_USER_SUCCESS,
  REGISTER_FORM_UPDATE,
} from "./types";
import { APIClient } from "../../components/Api";
import {
  API_GET_REFERRAL_STATUS,
  LOGIN_API,
} from "../../../src/EndPoint";
import { consoleLogFunc, getData } from "../../Utils/MethodsUtils";
import * as Constants from '../../Constants';
import Singleton from "../../Singleton";

/**************************************Update prop values ****************************************************/
export const registerUser = ({ prop, value }) => {
  return {
    type: REGISTER_FORM_UPDATE,
    payload: { prop, value },
  };
};

/************************************** login APi request ****************************************************/
export const requestWalletLogin = ({ data }) => (dispatch) => {
  consoleLogFunc("RequestWallet-------", data);
  return new Promise((resolve, reject) => {
    dispatch({ type: REGISTER_USER });
    APIClient.getInstance()
      .post(LOGIN_API, data)
      .then((response) => {
        let result = response;
        consoleLogFunc("Login Success", response);
        registerSuccess(dispatch, result);
        resolve(result);
      })
      .catch((error) => {
        let errorMessage = error.message;
        consoleLogFunc("Login Failed", error);
        registerFail(dispatch, errorMessage);
        reject(errorMessage);
      });
  });
};


/************************************** login referral status ****************************************************/
export const getReferralStatus = ({ data }) => (dispatch) => {
  return new Promise((resolve, reject) => {
    APIClient.getInstance()
      .post(API_GET_REFERRAL_STATUS, data)
      .then((response) => {
        let result = response;
        consoleLogFunc("referral Success", response);
        resolve(result);
      })
      .catch((error) => {
        let errorMessage = error.message;
        consoleLogFunc("referral Failed", error);
        reject(errorMessage);
      });
  });
};
/************************************* Success/Fail Dispatches ***************************************************/
const registerFail = (dispatch, errorMessage) => {
  dispatch({
    type: REGISTER_USER_FAIL,
    payload: errorMessage,
  });
};
const registerSuccess = (dispatch, user) => {
  dispatch({
    type: REGISTER_USER_SUCCESS,
    payload: user,
  });
};

