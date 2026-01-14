// import { CHAIN_ABSTRACTION_BASE_URL } from '@env';
import { consoleLogFunc, getEncryptedData } from './MethodsUtils';
import { CA_PLATFORM_FEES_URL } from '../EndPoint';
import { ethers } from 'ethers';
import { getTicsProvider } from './TicsUtils';

// Base URL for Chain Abstraction API

/**
 * Common API request handler with error handling and response validation
 * @param {string} endpoint - API endpoint
 * @param {Object} options - Fetch options
 * @returns {Promise<Object>} - API response
 */
const makeApiRequest = async (endpoint, options = {}) => {
  try {
    const CHAIN_ABSTRACTION_BASE_URL = "http://124.243.185.174:8083";
    const url = `${CHAIN_ABSTRACTION_BASE_URL}${endpoint}`;
    consoleLogFunc(`ChainAbstraction API Request: ${url}`, options);
    
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        "X-API-KEY": "REDACTED",
        ...options.headers,
      },
      ...options,
    });

    consoleLogFunc(`ChainAbstraction API Response: ${endpoint}`, JSON.stringify(response));

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    consoleLogFunc(`ChainAbstraction API Response: ${endpoint}`, data);
    return data;
  } catch (error) {
    consoleLogFunc(`ChainAbstraction API Error: ${endpoint}`, error);
    throw error;
  }
};

/**
 * Register a new user for MPC address generation
 * @param {string} ethereumAddress - User's Ethereum address
 * @returns {Promise<Object>} - Registration response
 */
export const registerUser = async (ethereumAddress, pin) => {
  const privateKey = await getEncryptedData(`${ethereumAddress}_pk`, pin);
  const provider = getTicsProvider();

  const message = `register:${ethereumAddress}:${Math.floor(Date.now()/1000)}`;
  const wallet = new ethers.Wallet(privateKey).connect(provider);

  const signature = await wallet.signMessage(message);


  consoleLogFunc("encryptedPin::::::", signature);
  const data = {
    ethereum_address: ethereumAddress,
    signature: signature,
    message: message,
  };
  
  return await makeApiRequest('/register_user', {
    method: 'POST',
    body: JSON.stringify(data),
  });
};

/**
 * Get user information including derived addresses
 * @param {string} ethereumAddress - User's Ethereum address
 * @returns {Promise<Object>} - User information response
 */
export const getUserInfo = async (ethereumAddress) => {
  return await makeApiRequest(`/user_info/0x01addd67e5a933Cef43481A99d6954E00CD3158f`, {
    method: 'GET'
  });
};

/**
 * Create a swap order for chain abstraction
 * @param {Object} swapData - Swap order data
 * @param {string} swapData.signature - Transaction signature
 * @param {Object} swapData.msg - Swap message object
 * @returns {Promise<Object>} - Swap order response
 */
export const createMpcSwapOrder = async (swapData) => {
  return await makeApiRequest('/user_mpc_deposit', {
    method: 'POST',
    body: JSON.stringify(swapData)
  });
};

/**
 * Get or register user with fallback mechanism
 * This method tries to register first, and if it fails, fetches existing user info
 * @param {string} ethereumAddress - User's Ethereum address
 * @returns {Promise<Object>} - User data with derived addresses
 */
export const getOrRegisterUser = async (ethereumAddress, pin) => {
  try {
    // First try to register the user
    const registerResponse = await registerUser(ethereumAddress, pin);
    
    if (registerResponse?.status === 'error') {
      consoleLogFunc('User registration failed, fetching existing user info');
      // If registration fails, get existing user info
      return await getUserInfo(ethereumAddress);
    }
    
    return registerResponse;
  } catch (error) {
    consoleLogFunc('Registration failed, trying to get existing user info', error);
    // If registration fails completely, try to get existing user info
    try {
      return await getUserInfo(ethereumAddress);
    } catch (getUserError) {
      consoleLogFunc('Both registration and getUserInfo failed', getUserError);
      throw new Error('Failed to register or retrieve user information');
    }
  }
};

/**
 * Validate API response structure
 * @param {Object} response - API response
 * @param {string} endpoint - API endpoint name for logging
 * @returns {boolean} - Whether response is valid
 */
export const validateApiResponse = (response, endpoint) => {
  if (!response) {
    consoleLogFunc(`Invalid response from ${endpoint}: response is null or undefined`);
    return false;
  }
  
  if (response.status === 'error') {
    consoleLogFunc(`API returned error for ${endpoint}:`, response.message || 'Unknown error');
    return false;
  }
  if (response.status === 'timeout') {
    consoleLogFunc(`API returned timeout for ${endpoint}:`, response.message || 'Unknown timeout');
    return false;
  }
  if (response.status === 'failed') {
    consoleLogFunc(`API returned failed for ${endpoint}:`, response.message || 'Unknown failed');
    return false;
  }
  
  return true;
};

/**
 * Extract derived addresses from user response
 * @param {Object} userResponse - User API response
 * @returns {Object} - Derived addresses object
 */
export const extractDerivedAddresses = (userResponse) => {
  if (!userResponse) {
    throw new Error('User response is null or undefined');
  }
  
  return {
    derived_eth_address: userResponse.derived_eth_address,
    derived_btc_address: userResponse.derived_btc_address,
    status: userResponse.status || 'success',
  };
};

export const getPlatformFeeFunction = async () => {
  try {
    const response = await fetch(CA_PLATFORM_FEES_URL)
    const data = await response.json()
    return {
      solver: data?.data?.solver,
      platform: data?.data?.platform,
    };
    } catch (error) {
      return {
        solver: 1.5,
        platform: 1.5,
      };
  }
}


export default {
  registerUser,
  getUserInfo,
  createMpcSwapOrder,
  getOrRegisterUser,
  validateApiResponse,
  extractDerivedAddresses,
  getPlatformFeeFunction,
};
