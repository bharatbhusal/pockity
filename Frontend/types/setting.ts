export enum theme {
  LIGHT = "light",
  DARK = "dark",
}

export enum screenSize {
  MOBILE = "mobile",
  TABLET = "tablet",
  DESKTOP = "desktop",
}

export interface ISettingState {
  currentTheme: theme;
  currentScreenSize?: screenSize;
}

export enum SettingActionTypes {
  UPDATE_CURRENT_THEME = "UPDATE_CURRENT_THEME",
  UPDATE_SCREEN_SIZE = "UPDATE_SCREEN_SIZE",
}
