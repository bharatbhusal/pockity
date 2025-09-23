import { produce } from "immer";
import { ISettingState, screenSize, SettingActionTypes, theme } from "@/types/setting";

const initialState: ISettingState = {
  currentTheme: theme.DARK,
};

const settingReducer = (
  state = initialState,
  action: { type: SettingActionTypes; payload?: { type: theme | screenSize } },
) => {
  return produce(state, (draft) => {
    switch (action.type) {
      case SettingActionTypes.UPDATE_CURRENT_THEME:
        draft.currentTheme = (action.payload as { type: theme }).type;
        break;

      case SettingActionTypes.UPDATE_SCREEN_SIZE:
        draft.currentScreenSize = (action.payload as { type: screenSize }).type;
        break;
    }
  });
};

export default settingReducer;
