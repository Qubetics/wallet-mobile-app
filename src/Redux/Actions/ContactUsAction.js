import { APIClient } from '../../components/Api';
import { CONTACT_US, QUERY_API, UPLOAD_IMAGE } from '../../EndPoint';
import { consoleLogFunc, getData } from '../../Utils/MethodsUtils';
import * as Constants from '../../Constants';

/*************************************************** Contact us API***********************************************************/
export const hitContactUs = ({ data }) => dispatch => {
  return new Promise((resolve, reject) => {
    getData(Constants.ACCESS_TOKEN).then(token => {
      APIClient.getInstance().post(CONTACT_US, data, token).then(response => {
        let result = response;
        consoleLogFunc('hitContactUs Success **** ' + JSON.stringify(result));
        resolve(result);
      }).catch(error => {
        let errorMessage = error.message;
        consoleLogFunc('hitContactUs Error ****', error);
        reject(errorMessage);
      });
    })
  });
};
/*************************************************** uploadImage API***********************************************************/
export const uploadImage = (formData) => dispatch => {
  return new Promise((resolve, reject) => {
    getData(Constants.ACCESS_TOKEN).then(token => {
      consoleLogFunc('chk formData:::::::', formData)
      APIClient.getInstance().postFileNew(UPLOAD_IMAGE, formData, token).then((response) => {
        let result = response?.data;
        consoleLogFunc('response uploadImage --**** ' + JSON.stringify(result));
        resolve(result);
      })
        .catch((error) => {
          consoleLogFunc('error uploadImage -- ****', error);
          reject(error);
        });
    })
  })
};
/*************************************************** Query List API***********************************************************/
export const getQueryList = ({ data }) => dispatch => {
  return new Promise((resolve, reject) => {
    getData(Constants.ACCESS_TOKEN).then(token => {
      APIClient.getInstance().post(QUERY_API, data, token).then((response) => {
        let result = response;
        consoleLogFunc('response getQueryList --**** ' + JSON.stringify(result));
        resolve(result);
      }).catch((error) => {
        consoleLogFunc('error getQueryList -- ****', error);
        reject(error);
      });
    })
  })
};
