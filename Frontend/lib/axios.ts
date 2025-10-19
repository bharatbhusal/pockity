import axios from "axios";
import { env } from "@/config/env";

const API = axios.create({
  baseURL: `${env.NEXT_PUBLIC_SERVER_URL}/api`,
  headers: {
    "Content-Type": "application/json", // default is JSON
    Accept: "application/json, multipart/form-data",
  },
  withCredentials: true, // Important for sending cookies
});

// Request interceptor
API.interceptors.request.use(
  (config) => {
    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

// Response interceptor
API.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // Handle errors globally if needed
    if (error.response?.status === 401) {
      // Could redirect to login here if needed
      console.error("Unauthorized");
    }
    return Promise.reject(error);
  },
);

export default API;
