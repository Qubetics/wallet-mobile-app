// api/getAppVersion.js
import { getAccessToken } from './authWithCosmosWallet';
import {VPNApiClient} from './VPNApiClient';

export const getAppVersion = async () => {
  const token = await getAccessToken();

  return await VPNApiClient(
    '/api/app/version', // Endpoint
    'GET', // Method
    {}, // No query params for this API
    token, // Access token
  );
};
