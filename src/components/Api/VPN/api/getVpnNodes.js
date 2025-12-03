// api/getVpnNodes.js

import * as Constants from '../../../../Constants';
import {consoleLogFunc, getData} from '../../../../Utils/MethodsUtils';
import {VPNApiClient} from './VPNApiClient';

/**
 * Fetches a list of VPN nodes (plans) with optional query filters.
 */
export const getVpnNodes = async ({
  limit = 10,
  page = 1,
  order = 'DESC',
  count_total = true,
  reverse = false,
  planId = '',
  country = '',
  city = '',
  protocol = '',
} = {}) => {
  const token = await getData(Constants.VPN_ACCESS_TOKEN);

  let queryParams = {
    limit,
    page,
    order,
    count_total,
    reverse,
  };
  if (protocol !== '') {
    queryParams = {
      ...queryParams,
      protocol: protocol,
    };
  }

  if (country !== '') {
    queryParams = {
      ...queryParams,
      country: country,
    };
  }
  if (city !== '') {
    queryParams = {
      ...queryParams,
      city: city,
    };
  }
  consoleLogFunc('queryParams--->', planId);
  if (planId) {
    queryParams = {
      ...queryParams,
      plan_id: planId,
    };
  }

  return await VPNApiClient('/api/nodes', 'GET', queryParams, token);
};
