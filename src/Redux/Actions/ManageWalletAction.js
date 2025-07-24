import { APIClient } from '../../components/Api';
import { LISTING_WALLET } from '../../../src/EndPoint';
import { consoleLogFunc } from '../../Utils/MethodsUtils';

export const getWalletList = ({ token }) => dispatch => {
  return new Promise((resolve, reject) => {
    APIClient.getInstance().post(LISTING_WALLET, {}, token).then(response => {
      let result = response;
      //consoleLogFunc('Manage Wallet List Success **** ' + JSON.stringify(result));
      resolve(result);
    }).catch(error => {
      let errorMessage = error.message;
      consoleLogFunc('Manage Wallet List Error ****', error);
      reject(errorMessage);
    });
  });
};


