import { IUser } from "@/types/user";
import API from "./axiosConfig";

// Step 1: Request OTP for sign in
export const requestSignIn = (email: string) =>
  API.post("/auth/request-login", { email })
    .then((response) => response.data)
    .catch((error) => {
      throw error;
    });

// Step 2: Verify OTP and sign in
export const verifySignIn = (payload: { email: string; password: string; otp: string }) =>
  API.post("/auth/verify-login", payload)
    .then((response) => response.data)
    .catch((error) => {
      throw error;
    });

// Step 1: Request OTP for sign up
export const requestSignUp = (email: string) =>
  API.post("/auth/request-register", { email })
    .then((response) => response.data)
    .catch((error) => {
      throw error;
    });

// Step 2: Verify OTP and sign up
export const verifySignUp = (payload: { email: string; name: string; password: string; otp: string }) =>
  API.post("/auth/verify-register", payload)
    .then((response) => response.data)
    .catch((error) => {
      throw error;
    });

// API function for sign out
export const signOut = () =>
  API.post("/auth/signOut")
    .then((response) => {
      return response.data;
    })
    .catch((error) => {
      throw error;
    });

export const updateUserSensitive = (sensitiveDetails: IUser) =>
  API.put("/auth/update", sensitiveDetails)
    .then((response) => response.data)
    .catch((error) => {
      throw error;
    });

export const updateUser = (formData: FormData) =>
  API.put("/users/", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  })
    .then((response) => response.data)
    .catch((error) => {
      throw error;
    });
