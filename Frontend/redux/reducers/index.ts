import userReducer from "./userReducer";
import modalReducer from "./modalReducer";
import authReducer from "./authReducer";
import settingReducer from "./settingReducer";

const rootReducer = {
  authReducer: authReducer,
  userReducer: userReducer,
  modalReducer: modalReducer,
  settingReducer: settingReducer,
};

export default rootReducer;
