export const sendStartSession = async ({
  url,
  pubKey,
  sessionId,
  signatureBase64,
  public_key,
  private_key,
}) => {
  console.log('sendStartSession INPUT --->>', {
    url,
    pubKey,
    sessionId,
    signatureBase64,
    public_key,
    private_key,
  });
  const sessionData = {public_key};
  const jsonData = JSON.stringify(sessionData);
  const dataBase64 = Buffer.from(jsonData).toString('base64');

  const payload = {
    id: parseInt(sessionId),
    pub_key: `ethsecp256k1:${pubKey}`,
    data: dataBase64,
    signature: signatureBase64,
  };

  console.log('sendStartSession payload--->>>', payload);
  console.log('api url--->>>', `${url}/sessions`);
  const cleanUrl = url.replace(/^https?:\/\//, 'http://');
  console.log('cleanUrl url--->>>', `${cleanUrl}/sessions`);
  
  try {
    const response = await fetch(`${cleanUrl}/sessions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const responseText = await response.text();
    console.log('sendStartSession RESPONSE TEXT--->>>', responseText);
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
