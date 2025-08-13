const ADD_PEER_BASE_URL = "http://188.239.33.82:5000";

export const AddPeerApiClient = async (
  endpoint,
  method = "POST",
  data = null,
  token = ""
) => {
  const headers = {
    "Content-Type": "application/json",
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const options = {
    method,
    headers,
  };

  if (data) {
    options.body = JSON.stringify(data);
  }

  const url = `${ADD_PEER_BASE_URL}${endpoint}`;

  try {
    const response = await fetch(url, options);
    const result = await response.json();

    if (!response.ok) {
      throw new Error(result?.message || "AddPeer API failed");
    }

    return result;
  } catch (err) {
    console.error("❌ AddPeerApiClient error", err);
    throw err?.message;
  }
};
