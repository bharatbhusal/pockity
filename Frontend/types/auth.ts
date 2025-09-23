import { IUser } from "./user";

export interface IAuthState {
  authUser?: IUser;
  tempUser?: Partial<IUser>;
  loading: boolean;
  hasAuthCookie: boolean;
}

export enum AuthActionTypes {
  AUTH_START = "AUTH_START",

  SIGN_IN_SUCCESS = "SIGN_IN_SUCCESS",
  SIGN_UP_SUCCESS = "SIGN_UP_SUCCESS",
  SIGN_OUT_SUCCESS = "SIGN_OUT_SUCCESS",
  SELF_UPDATE_SUCCESS = "SELF_UPDATE_SUCCESS",

  AUTH_FAILURE = "AUTH_FAILURE",

  SELF_ON_CHANGE = "SELF_ON_CHANGE",
}
