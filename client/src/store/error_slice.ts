import { createSlice } from "@reduxjs/toolkit";

export const errorSlice = createSlice({
  name: "error",
  initialState: {
    errorMessage: "",
  },
  reducers: {
    setError: (state, { payload }) => {
      console.log(payload);
      state.errorMessage = payload;
    },
    clearError: (state) => {
      state.errorMessage = "";
    },
  }
});

export const { setError, clearError } = errorSlice.actions;

export const errorReducer = errorSlice.reducer;