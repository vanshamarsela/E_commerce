const BASE_URL = "https://dummyjson.com";

export const dummyjson_fetch = async (endpoint, options = {}) => {
  const response = await fetch(`${BASE_URL}${endpoint}`, {
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
    ...options,
  });

  // fetch does NOT auto-throw errors
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || "Fetch error");
  }

  return response.json(); // return parsed JSON
};
