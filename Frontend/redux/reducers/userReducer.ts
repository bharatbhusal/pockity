/* eslint-disable @typescript-eslint/no-explicit-any */
import { produce } from "immer";
import { IUser, IUserState, UserActionTypes } from "@/types/user";

const initialState: IUserState = {
  loading: false,
  selectedUser: {} as IUser,
  tempUser: {} as Partial<IUser>,
};

const userReducer = (state = initialState, action: { type: UserActionTypes; payload?: any; response?: any }) =>
  produce(state, (draft) => {
    switch (action.type) {
      case UserActionTypes.USER_RETRIEVE_START:
        draft.loading = true;
        break;

      case UserActionTypes.USER_RETRIEVE_SUCCESS:
        draft.loading = false;
        draft.selectedUser = action.response;

      case UserActionTypes.USER_ON_CHANGE:
        draft.tempUser = { ...draft.tempUser, ...action.payload };
        break;

      case UserActionTypes.USER_RETRIEVE_FAILURE:
        draft.loading = false;
        break;

      default:
        break;
    }
  });

export default userReducer;
