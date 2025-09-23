/* eslint-disable @typescript-eslint/no-explicit-any */
import { extractErrorMessage } from "@/lib/error";
import { Dispatch } from "@reduxjs/toolkit";
import { toast } from "react-toastify";

// Handler function
export const handleAsyncAction =
  (
    apiFunction: any,
    startActionType: string,
    successActionType: string,
    failActionType: string,
    toastifySuccess: boolean,
    toastifyFailure: boolean,
  ) =>
  async (dispatch: Dispatch) => {
    dispatch({ type: startActionType });
    console.log("Dispatched start action:", startActionType);

    try {
      const response = await apiFunction();
      dispatch({ type: successActionType, response: response.data });
      console.log("Dispatched success action:", successActionType, "with response:", response);
      if (toastifySuccess) {
        toast.success(response.message || successActionType);
      }
      return response.data;
    } catch (error: any) {
      dispatch({ type: failActionType });
      const errorMsg = extractErrorMessage(error, failActionType);
      if (toastifyFailure) {
        toast.error(errorMsg);
      }
      throw error;
    }
  };
