import { combineReducers } from 'redux';
import AsyncStorage from '@react-native-async-storage/async-storage';
import WalletReducer from './WalletReducer';
import SendCoinReducer from './SendCoinReducer';
import { createStore, applyMiddleware } from 'redux';
import ReduxThunk from 'redux-thunk';
import persistReducer from 'redux-persist/es/persistReducer';
import persistStore from 'redux-persist/es/persistStore';

const persistConfig = {
  key: 'root',
  // storage,
  storage: AsyncStorage,
  whitelist: ['walletReducer'],
  timeout: null,
}

const appReducer = combineReducers({
  walletReducer: WalletReducer,
  sendCoinReducer: SendCoinReducer,
});

const persistedReducer = persistReducer(persistConfig, appReducer)


export  const store = createStore(persistedReducer,  {}, applyMiddleware(ReduxThunk))
export  const persistor = persistStore(store)