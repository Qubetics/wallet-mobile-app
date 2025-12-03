import { ADD_CUSTOM_TOKEN_API, SEARCH_CUSTOM_TOKEN_API } from '../../../src/EndPoint';
import { APIClient } from '../../components/Api';
import * as Constants from '../../Constants';
import { consoleLogFunc, getData } from '../../Utils/MethodsUtils';
import { CUSTOM_TOKEN_FAIL, CUSTOM_TOKEN_REQUEST, CUSTOM_TOKEN_SUCCESS } from './types';

/****************************Search Token Api********************************** */
export const searchToken = ({ searchTokenReq, token }) => dispatch => {
  // consoleLogFunc("searchTokenReq::::", searchTokenReq);
  return new Promise((resolve, reject) => {
    dispatch({ type: CUSTOM_TOKEN_REQUEST });
    getData(Constants.ACCESS_TOKEN).then(token => {
      APIClient.getInstance().post(SEARCH_CUSTOM_TOKEN_API, searchTokenReq, token).then(response => {
        let result = response;
        // consoleLogFunc('search token success **** ' + JSON.stringify(result));
        customTokenSuccess(dispatch, result)
        resolve(result);
      }).catch(error => {
        let errorMessage = error.message;
        if (!errorMessage)
          errorMessage = 'Something Went Wrong '
        consoleLogFunc('search token Error ****', error);
        customTokenFail(dispatch, errorMessage)
        reject(errorMessage);
      });
    });
  });
};
/****************************Add Custom Token Api********************************** */
export const addToken = ({ addTokenReq, token }) => dispatch => {
  // consoleLogFunc("addTokenReq:::::", addTokenReq);
  return new Promise((resolve, reject) => {
    dispatch({ type: CUSTOM_TOKEN_REQUEST });
    getData(Constants.ACCESS_TOKEN).then(token => {
      APIClient.getInstance().post(ADD_CUSTOM_TOKEN_API, addTokenReq, token).then(response => {
        let result = response;
        // consoleLogFunc('add token success **** ' + JSON.stringify(result));
        customTokenSuccess(dispatch, result)
        resolve(result);
      }).catch(error => {
        consoleLogFunc('add token Error ****', error);
        let errorMessage = error.message;
        if (!errorMessage)
          errorMessage = 'Something Went Wrong '
        customTokenFail(dispatch, errorMessage)
        reject(errorMessage);
      });
    });
  });
};

/************************************* Success/Fail Dispatches ***************************************************/
const customTokenFail = (dispatch, errorMessage) => {
  dispatch({
    type: CUSTOM_TOKEN_FAIL,
    payload: errorMessage,
  });
};

const customTokenSuccess = (dispatch, data) => {
  dispatch({
    type: CUSTOM_TOKEN_SUCCESS,
    payload: data,
  });
};
