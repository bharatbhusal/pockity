export interface IModalState {
  [type: string]: {
    isOpen: boolean;
  };
}

export enum ModalTypes {
  UPDATE_PROFILE = "UPDATE_PROFILE",
  SETTINGS = "SETTINGS",
}

export enum ModalActionTypes {
  OPEN_MODAL = "OPEN_MODAL",
  CLOSE_MODAL = "CLOSE_MODAL",
}

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}
