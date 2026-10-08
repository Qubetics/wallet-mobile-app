import {
  GET_COIN_LIST_SUCCESS,
  GET_COIN_LIST_FAIL,
  GET_COIN_LIST,
  GET_NATIVE_CURRENCY_LIST,
} from '../Actions/types';

const INITIAL_STATE = {
  coinList: [],
  currencyList: [],
};

/************************************** Register reducer ****************************************************/
export default (state = INITIAL_STATE, action) => {
  switch (action.type) {
    case GET_COIN_LIST_SUCCESS:
      return { ...state, coinList: action.payload.page == 1 ? action.payload.data : [...state.coinList, ...action.payload.data] };
    case GET_NATIVE_CURRENCY_LIST: {
      return { ...state, currencyList: action.payload };
    }
    case GET_COIN_LIST_FAIL:
      return { ...state, coinList: [] };
    case GET_COIN_LIST:
      return { ...state };


    default:
      return state;
  }
};
