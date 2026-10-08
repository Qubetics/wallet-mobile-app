import { GET_GAS_PRICE } from '../Actions/types';

const INITIAL_STATE = {
    gasPriceList: {},
};

/************************************** Register reducer ****************************************************/
export default (state = INITIAL_STATE, action) => {
    switch (action.type) {
        case GET_GAS_PRICE:
            return { ...state, gasPriceList: {} };
        default:
            return state;
    }
};
