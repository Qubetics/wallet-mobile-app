import {
  GET_COIN_LIST_SUCCESS,
  GET_COIN_LIST_FAIL,
  GET_COIN_LIST,
  GET_COIN_ON_LOG_OUT,
  THEME_STORE,
  GET_NATIVE_CURRENCY_LIST,
} from '../Actions/types';

const INITIAL_STATE = {
  coinList: [],
  lastName: '',
  currencyList: [],
  cureentTheme: 1,
};

/************************************** Register reducer ****************************************************/
export default (state = INITIAL_STATE, action) => {
  switch (action.type) {
    case THEME_STORE:
      let theme = action.payload.value == "darkMode" ? 1 : 2;
      return { ...state, cureentTheme: theme };
    case GET_COIN_LIST_SUCCESS:
      return { ...state, coinList: action.payload.page == 1 ? action.payload.data : [...state.coinList, ...action.payload.data] };
    case GET_NATIVE_CURRENCY_LIST: {
      return { ...state, currencyList: action.payload };
    }
    // case GET_COIN_ON_LOG_OUT:
    //   return { ...state, coinList: [], currencyList: [] };
    case GET_COIN_LIST_FAIL:
      return { ...state, coinList: [] };
    case GET_COIN_LIST:
      return { ...state };


    default:
      return state;
  }
};
