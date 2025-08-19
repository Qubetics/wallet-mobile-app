import { APIClient } from '../../components/Api';
import * as Constants from '../../Constants';
import { API_GET_LIST } from '../../EndPoint';
import { consoleLogFunc, exponentialToDecimal, getData } from '../../Utils/MethodsUtils';

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
