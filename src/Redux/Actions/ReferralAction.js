import { APIClient } from '../../components/Api';
import { CLAIM_REWARD, CONTACT_US, GET_LEVEL_DETAIL, GET_REF_DETAILS, GET_REF_TYPE, GET_ROADMAP, QUERY_API, REFERRAL_HISTORY, REFERRAL_USER_STATUS, SIGN_CONTRACT, UPDATE_REF_CODE, UPLOAD_IMAGE } from '../../EndPoint';
import { consoleLogFunc, getData } from '../../Utils/MethodsUtils';
import * as Constants from '../../Constants';


/*************************************************** getDetailsRef API***********************************************************/
export const getDetailsRef = () => dispatch => {
  return new Promise((resolve, reject) => {
    getData(Constants.ACCESS_TOKEN).then(token => {
      APIClient.getInstance().get(GET_REF_DETAILS, token).then(response => {
        let result = response.data;
        consoleLogFunc('getDetailsRef Success **** ' + JSON.stringify(response));
        resolve(result);
      }).catch(error => {
        let errorMessage = error.message;
        consoleLogFunc('getDetailsRef Error ****', error);
        reject(errorMessage);
      });
    })
  });
};
/*************************************************** getLiminalAddress API***********************************************************/
export const getLiminalAddress = ({ data }) => dispatch => {
  return new Promise((resolve, reject) => {
    getData(Constants.ACCESS_TOKEN).then(token => {
      APIClient.getInstance().post(UPLOAD_IMAGE, data, token).then((response) => {
        let result = response?.data;
        consoleLogFunc('response getLiminalAddress --**** ' + JSON.stringify(result));
        resolve(result);
      })
        .catch((error) => {
          consoleLogFunc('error getLiminalAddress -- ****', error);
          reject(error);
        });
    })
  })
};
/*************************************************** getRefHistory API***********************************************************/
export const getRefHistory = ({ data }) => dispatch => {
  return new Promise((resolve, reject) => {
    getData(Constants.ACCESS_TOKEN).then(token => {
      APIClient.getInstance().post(REFERRAL_HISTORY, data, token).then((response) => {
        let result = response.data;
        consoleLogFunc('response getRefHistory --**** ' + JSON.stringify(result));
        resolve(result);
      }).catch((error) => {
        consoleLogFunc('error getRefHistory -- ****', error);
        reject(error);
      });
    })
  })
};
/*************************************************** RefUserStatus API***********************************************************/
export const RefUserStatus = ({ data }) => dispatch => {
  return new Promise((resolve, reject) => {
    getData(Constants.ACCESS_TOKEN).then(token => {
      APIClient.getInstance().post(REFERRAL_USER_STATUS, data, token).then((response) => {
        let result = response.data;
        consoleLogFunc('response RefUserStatus --**** ' + JSON.stringify(result));
        resolve(result);
      }).catch((error) => {
        consoleLogFunc('error RefUserStatus -- ****', error);
        reject(error);
      });
    })
  })
};
/************************************************** uploadSignature Api ****************************************/
export const uploadSignature = (data) => dispatch => {
  return new Promise((resolve, reject) => {
    getData(Constants.ACCESS_TOKEN).then(token => {
      APIClient.getInstance().postFileNew(SIGN_CONTRACT, data, token).then(response => {
        let result = response.data;
        consoleLogFunc('uploadSignature success **** ' + JSON.stringify(result));
        resolve(result);
      }).catch(error => {
        let errorMessage = error.message;
        if (!errorMessage)
          errorMessage = 'Something Went Wrong '
        consoleLogFunc('uploadSignature Error ****', JSON.stringify(error));
        reject(errorMessage);
      });
    });
  });
}
/*************************************************** updateRefCode API***********************************************************/
export const updateRefCode = ({ data }) => dispatch => {
  return new Promise((resolve, reject) => {
    getData(Constants.ACCESS_TOKEN).then(token => {
      APIClient.getInstance().post(UPDATE_REF_CODE, data, token).then((response) => {
        let result = response.data;
        consoleLogFunc('response updateRefCode --**** ' + JSON.stringify(result));
        resolve(result);
      }).catch((error) => {
        consoleLogFunc('error updateRefCode -- ****', error);
        reject(error.message || error);
      });
    })
  })
};
/*************************************************** claimReward API***********************************************************/
export const claimReward = ({ data }) => dispatch => {
  return new Promise((resolve, reject) => {
    getData(Constants.ACCESS_TOKEN).then(token => {
      APIClient.getInstance().post(CLAIM_REWARD, data, token).then((response) => {
        let result = response.data;
        consoleLogFunc('response claimReward --**** ' + JSON.stringify(result));
        resolve(result);
      }).catch((error) => {
        consoleLogFunc('error claimReward -- ****', error);
        reject(error);
      });
    })
  })
};
/*************************************************** getRefLevel API***********************************************************/
export const getRefLevel = () => dispatch => {
  return new Promise((resolve, reject) => {
    getData(Constants.ACCESS_TOKEN).then(token => {
      APIClient.getInstance().get(GET_REF_TYPE, token).then(response => {
        let result = response.data;
        consoleLogFunc('getRefLevel Success **** ' + JSON.stringify(result));
        resolve(result);
      }).catch(error => {
        let errorMessage = error.message;
        consoleLogFunc('getRefLevel Error ****', error);
        reject(errorMessage);
      });
    })
  });
};
/*************************************************** getLevelDetail API***********************************************************/
export const getLevelDetail = ({ data1 }) => dispatch => {
  return new Promise((resolve, reject) => {
    getData(Constants.ACCESS_TOKEN).then(token => {
      APIClient.getInstance().post(GET_LEVEL_DETAIL, data1, token).then((response) => {
        let result = response.data;
        consoleLogFunc('response getLevelDetail --**** ' + JSON.stringify(result));
        resolve(result);
      }).catch((error) => {
        consoleLogFunc('error getLevelDetail -- ****', error);
        reject(error.message || error);
      });
    })
  })
};