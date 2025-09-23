import { handleAsyncAction } from "./asyncAction";
import * as AuthApi from "../apis/authRequest";

import { IUser } from "@/types/user";
import { AuthActionTypes } from "@/types/auth";

export const verifySignIn = (payload: { email: string; password: string; otp: string }) =>
  handleAsyncAction(
    () => AuthApi.verifySignIn(payload),
    AuthActionTypes.AUTH_START,
    AuthActionTypes.SIGN_IN_SUCCESS,
    AuthActionTypes.AUTH_FAILURE,
    true,
    true,
  );

export const verifySignUp = (payload: { email: string; username: string; password: string; otp: string }) =>
  handleAsyncAction(
    () => AuthApi.verifySignUp(payload),
    AuthActionTypes.AUTH_START,
    AuthActionTypes.SIGN_UP_SUCCESS,
    AuthActionTypes.AUTH_FAILURE,
    true,
    true,
  );

export const signOut = () =>
  handleAsyncAction(
    AuthApi.signOut,
    AuthActionTypes.AUTH_START,
    AuthActionTypes.SIGN_OUT_SUCCESS,
    AuthActionTypes.AUTH_FAILURE,
    true,
    true,
  );

export const updateUserSensitive = (sensitiveDetails: IUser) =>
  handleAsyncAction(
    () => AuthApi.updateUserSensitive(sensitiveDetails),
    AuthActionTypes.AUTH_START,
    AuthActionTypes.SELF_UPDATE_SUCCESS,
    AuthActionTypes.AUTH_FAILURE,
    false,
    false,
  );

export const updateUser = (formData: FormData) =>
  handleAsyncAction(
    () => AuthApi.updateUser(formData),
    AuthActionTypes.AUTH_START,
    AuthActionTypes.SELF_UPDATE_SUCCESS,
    AuthActionTypes.AUTH_FAILURE,
    false,
    false,
  );
