import { createSlice } from "@reduxjs/toolkit";
import { parseJwt } from "../lib/parse_jwt";

export const DEFAULT_SETTINGS = parseJwt(window.localStorage.getItem("authToken"))

export const applicationSlice = createSlice({
  name: "application",
  initialState: {
    authToken: window.localStorage.getItem("authToken"),
    settings: DEFAULT_SETTINGS,
  },
  reducers: {
    setAuthToken: (state, {payload}) => {
      if (payload) {
        state.settings = parseJwt(payload)
        window.localStorage.setItem("authToken", payload);
      } else {
        window.localStorage.removeItem("authToken");
      }
      state.authToken = payload;
    },
  }
});

export const { setAuthToken } = applicationSlice.actions;

export const applicationReducer = applicationSlice.reducer;