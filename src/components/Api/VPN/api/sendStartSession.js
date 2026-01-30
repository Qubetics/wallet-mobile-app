import { IP_V4_REGEX } from "../../../../Constants";
import { consoleLogFunc } from "../../../../Utils/MethodsUtils";

export const sendStartSession = async ({
  url,
  pubKey,
  sessionId,
  signatureBase64,
  public_key,
}) => {
  const sessionData = {public_key};
  const jsonData = JSON.stringify(sessionData);
  const dataBase64 = Buffer.from(jsonData).toString('base64');

  const payload = {
    id: parseInt(sessionId),
    pub_key: `ethsecp256k1:${pubKey}`,
    data: dataBase64,
    signature: signatureBase64,
  };

  const getHostname = (urlStr) => {
    try {
      const u = urlStr.startsWith('http') ? urlStr : `http://${urlStr}`;
      consoleLogFunc('getHostname u--->>>', u);
      consoleLogFunc('getHostname new URL(u)--->>>', new URL(u));
      return new URL(u).hostname;
    } catch {
      return '';
    }
  };
  const isIPv4 = (host) => IP_V4_REGEX.test(host);
  const isIPv6 = (host) => host.includes(':');
  const isIPBasedUrl = (urlStr) => {
    const host = getHostname(urlStr);
    return host ? isIPv4(host) || isIPv6(host) : false;
  };

  const cleanUrl = isIPBasedUrl(url)
    ? url.replace(/^https?:\/\//, 'http://')
    : url;

  try {
    const response = await fetch(`${cleanUrl}/sessions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const responseText = await response.text();
    consoleLogFunc('After sendStartSession RESPONSE TEXT--->>>', responseText);
    const jsonResponse = JSON.parse(responseText); // ✅ Parse here

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${responseText}`);
    }

    return jsonResponse;
  } catch (error) {
    console.error('sendStartSession ERROR--->>>', error);
    return null;
  }
};
