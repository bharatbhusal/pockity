import { ModalActionTypes, ModalTypes } from "@/types/modal";

export const openModal = (modalType: ModalTypes) => ({
  type: ModalActionTypes.OPEN_MODAL,
  payload: { type: modalType },
});

export const closeModal = (modalType: ModalTypes) => ({
  type: ModalActionTypes.CLOSE_MODAL,
  payload: { type: modalType },
});
