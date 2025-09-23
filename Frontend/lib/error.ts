/* eslint-disable @typescript-eslint/no-explicit-any */
export const extractErrorMessage = (error: any, fallback = "Something went wrong") => {
  if (error?.response?.data?.data) {
    return error.response.data.data;
  }
  if (error?.response?.data?.message) {
    return error.response.data.message;
  }
  if (error?.message) {
    return error.message;
  }
  return fallback;
};
