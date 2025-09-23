export interface IUser {
  _id?: string;
  username: string;
  password?: string;
  email?: string;
  avatar?: string | File;
  cover?: string | File;
  name?: {
    first: string;
    middle?: string;
    last: string;
  };
  bio?: string;
  location?: string;
  dob?: string;
}

export interface IUserState {
  selectedUser?: IUser;
  tempUser?: Partial<IUser>;
  loading: boolean;
}

export enum UserActionTypes {
  USER_RETRIEVE_START = "USER_RETRIEVE_START",
  USER_RETRIEVE_SUCCESS = "USER_RETRIEVE_SUCCESS",
  USER_RETRIEVE_FAILURE = "USER_RETRIEVE_FAILURE",

  USER_ON_CHANGE = "USER_ON_CHANGE",
}
