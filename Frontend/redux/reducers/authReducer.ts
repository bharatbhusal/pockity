import { produce } from "immer";
import { AuthActionTypes, IAuthState } from "@/types/auth";
import { IUser } from "@/types/user";

const initialState: IAuthState = {
  loading: false,
  hasAuthCookie: false,
  authUser: {} as IUser,
  tempUser: {} as Partial<IUser>,
};

const authReducer = (state = initialState, action: { type: AuthActionTypes; payload?: IUser; response?: IUser }) =>
  produce(state, (draft) => {
    switch (action.type) {
      case AuthActionTypes.AUTH_START:
        draft.loading = true;
        break;

      case AuthActionTypes.SIGN_IN_SUCCESS:
      case AuthActionTypes.SIGN_UP_SUCCESS:
      case AuthActionTypes.SELF_UPDATE_SUCCESS:
        draft.loading = false;
        draft.hasAuthCookie = true;
        draft.authUser = action.response;
        delete draft.tempUser;
        break;

      case AuthActionTypes.AUTH_FAILURE:
        draft.loading = false;
        break;

      case AuthActionTypes.SIGN_OUT_SUCCESS:
        draft.authUser = initialState.authUser;
        draft.hasAuthCookie = false;
        draft.loading = false;
        break;

      case AuthActionTypes.SELF_ON_CHANGE:
        draft.tempUser = { ...draft.tempUser, ...action.payload };
        break;

      default:
        break;
    }
  });

export default authReducer;
