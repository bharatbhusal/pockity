import { handleAsyncAction } from "./asyncAction";
import * as UserApi from "../apis/userRequest";
import { UserActionTypes } from "@/types/user";

export const getUserById = (userId: string) =>
  handleAsyncAction(
    () => UserApi.getUserById(userId),
    UserActionTypes.USER_RETRIEVE_START,
    UserActionTypes.USER_RETRIEVE_SUCCESS,
    UserActionTypes.USER_RETRIEVE_FAILURE,
    false,
    false,
  );

export const getUserByUsername = (username: string) =>
  handleAsyncAction(
    () => UserApi.getUserByUsername(username),
    UserActionTypes.USER_RETRIEVE_START,
    UserActionTypes.USER_RETRIEVE_SUCCESS,
    UserActionTypes.USER_RETRIEVE_FAILURE,
    false,
    true,
  );
