import axios from "axios";

const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
});

const authHeader = (token) => ({
  headers: { Authorization: `Bearer ${token}` },
});

export const getReports = async (token) => {
  const response = await API.get("/admin/reports", authHeader(token));
  return response.data;
};

export const getAnalytics = async (token) => {
  const response = await API.get("/admin/analytics", authHeader(token));
  return response.data;
};

export const setUserDisabled = async (token, userId, disabled) => {
  const response = await API.put(
    `/admin/users/${userId}/disable`,
    { disabled },
    authHeader(token)
  );
  return response.data;
};