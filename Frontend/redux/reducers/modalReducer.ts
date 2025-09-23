import { produce } from "immer";
import { IModalState, ModalActionTypes, ModalTypes } from "@/types/modal";

const initialState: IModalState = {
  // [ModalTypes.ADD_EMOTION_TYPE]: { isOpen: false },
};

const modalReducer = (state = initialState, action: { type: ModalActionTypes; payload?: { type?: ModalTypes } }) => {
  return produce(state, (draft) => {
    switch (action.type) {
      case ModalActionTypes.OPEN_MODAL:
        if (action.payload?.type) {
          draft[action.payload.type] = {
            isOpen: true,
          };
        }
        break;

      case ModalActionTypes.CLOSE_MODAL:
        if (action.payload?.type) {
          draft[action.payload.type] = {
            isOpen: false,
          };
        }
        break;

      default:
        break;
    }
  });
};

export default modalReducer;
