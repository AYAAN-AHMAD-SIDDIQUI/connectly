
import axios from "axios";

const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
});

export const googleLogin = async (idToken) => {
  const response = await API.post("/auth/google", { idToken });

  return response.data;
};

export const saveProfile = async (token, profileData) => {
  const response = await API.put("/auth/profile", profileData, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return response.data;
};

export const getCurrentUser = async (token) => {
  const response = await API.get("/auth/me", {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return response.data;
};
