import { APIClient } from '../../components/Api';
import { API_ADD_PRICE_ALERT, API_DELETE_PRICE_ALERT, API_GET_LIST, API_GET_PRICE_ALERT } from '../../EndPoint';
import * as Constants from '../../Constants';
import { consoleLogFunc, exponentialToDecimal, getData } from '../../Utils/MethodsUtils';

/*************************************************** Add PriceAlert API***********************************************************/
export const addPriceAlert = ({ data }) => dispatch => {
  return new Promise((resolve, reject) => {
    getData(Constants.ACCESS_TOKEN).then(token => {
      // consoleLogFunc('fafafghcgc==>', data);
      APIClient.getInstance().post(API_ADD_PRICE_ALERT, data, token).then(response => {
        let result = response;
        // consoleLogFunc('addPriceAlert Success **** ' + JSON.stringify(result));
        resolve(result);
      }).catch(error => {
        let errorMessage = error.message;
        consoleLogFunc('addPriceAlert Error ****', error);
        reject(errorMessage);
      });
    });
  });
};

/*************************************************** Get PriceAlert API***********************************************************/
export const getPriceAlert = ({ data }) => dispatch => {
  return new Promise((resolve, reject) => {
    getData(Constants.ACCESS_TOKEN).then(token => {
      APIClient.getInstance().post(API_GET_PRICE_ALERT, data, token).then(response => {
        let result = response.data;
        // consoleLogFunc('getPriceAlert Success **** ' + JSON.stringify(result));
        resolve(result);
      }).catch(error => {
        let errorMessage = error.message;
        consoleLogFunc('getPriceAlert Error ****', error);
        reject(errorMessage);
      });
    });
  });
};
/*************************************************** Delete deletePriceAlert API***********************************************************/
export const deletePriceAlert = data => dispatch => {
  return new Promise((resolve, reject) => {
    getData(Constants.ACCESS_TOKEN).then(token => {
      APIClient.getInstance().post(API_DELETE_PRICE_ALERT, { id: data }, token).then(response => {
        let result = response.data;
        // consoleLogFunc('getAddressBook Success **** ' + result);
        resolve(result);
      }).catch(error => {
        let errorMessage = error.message;
        consoleLogFunc('deletePriceAlert Error ****bfgjhgyguyg', error);
        reject(errorMessage);
      });
    });
  });
};
/***************************************************get List API***********************************************************/
export const getCoinList = ({ data }) => dispatch => {
  return new Promise((resolve, reject) => {
    getData(Constants.ACCESS_TOKEN).then(token => {
      getData(Constants.COIN_FAMILY_LIST).then(coinfamilyList => {
        const coin_families = JSON.parse(coinfamilyList);
        data.coin_family = coin_families
        APIClient.getInstance().post(API_GET_LIST, data, token).then(response => {
          if (response.data.length > 0) {
            response.data.map((item, index) => {
              if (item.fiat_price_data != null) {
                item.fiat_price_data.value = exponentialToDecimal(item.fiat_price_data.value)
              }
            })
          }
          // consoleLogFunc('getCoinList Success **** ', response);
          const result = response;
          //  consoleLogFunc('getCoinList Success **** ', result);
          resolve(result);
        }).catch(error => {
          let errorMessage = error.message;
          consoleLogFunc('getCoinList Error ****bfgjhgyguyg', error);
          reject(errorMessage);
        });
      });
    });
  });
};
