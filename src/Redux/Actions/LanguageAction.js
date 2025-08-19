import { APIClient } from '../../components/Api';
import * as Constants from '../../Constants';
import { GET_LANGUAGE, UPDATE_LANGUAGE } from '../../EndPoint';
import { consoleLogFunc, getData } from '../../Utils/MethodsUtils';

/*************************************************** getLanguageList API***********************************************************/
export const getLanguageList = ({ }) => dispatch => {
  return new Promise((resolve, reject) => {
    getData(Constants.ACCESS_TOKEN).then(token => {
      APIClient.getInstance().get(GET_LANGUAGE, token).then(response => {
        let result = response.data;
        consoleLogFunc('getLanguageList Success **** ' + JSON.stringify(result));
        resolve(result);
      }).catch(error => {
        let errorMessage = error.message;
        consoleLogFunc('getLanguageList Error ****', error);
        reject(errorMessage);
      });
    })
  });
};

/*************************************************** updateLanguage API***********************************************************/
export const updateLanguage = ({ data }) => dispatch => {
  return new Promise((resolve, reject) => {
    getData(Constants.ACCESS_TOKEN).then(token => {
      APIClient.getInstance().post(UPDATE_LANGUAGE, data, token).then((response) => {
        let result = response;
        consoleLogFunc('response updateLanguage --**** ' + JSON.stringify(result));
        resolve(result);
      }).catch((error) => {
        consoleLogFunc('error updateLanguage -- ****', error);
        reject(error);
      });
    })
  })
};
