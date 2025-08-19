import { APIClient } from '../../components/Api';
import * as Constants from '../../Constants';
import { ORDER_INIT_URL } from '../../EndPoint';
import { consoleLogFunc, getData } from '../../Utils/MethodsUtils';


/*************************************************** initiateTx API***********************************************************/
export const initiateTx = ({ data }) => (dispatch) => {
  return new Promise(async (resolve, reject) => {
    const token = await getData(Constants.ACCESS_TOKEN);
    APIClient.getInstance().post(ORDER_INIT_URL, data, token).then((response) => {
      let result = response.data;
      consoleLogFunc('initiateTx Success **** ' + JSON.stringify(result));
      resolve(result);
    }).catch((error) => {
      let errorMessage = error.message;
      consoleLogFunc("initiateTx Error ****", error);
      reject(errorMessage);
    });
  });
};