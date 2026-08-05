import { configureStore } from "@reduxjs/toolkit";
import headerReducer from "./header";
import uiReducer from "./ui";

export const store = configureStore({
  reducer: {
    header: headerReducer,
    ui: uiReducer
  }
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
