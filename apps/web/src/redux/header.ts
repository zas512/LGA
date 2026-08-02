import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface HeaderState {
  title: string;
  breadcrumb: string;
}

const initialState: HeaderState = {
  title: "Dashboard",
  breadcrumb: "Firm / Overview"
};

const headerSlice = createSlice({
  name: "header",
  initialState,
  reducers: {
    setHeaderData: (
      state,
      action: PayloadAction<{ title: string; breadcrumb: string }>
    ) => {
      state.title = action.payload.title;
      state.breadcrumb = action.payload.breadcrumb;
    },
    setHeaderTitle: (state, action: PayloadAction<string>) => {
      state.title = action.payload;
    },
    setHeaderBreadcrumb: (state, action: PayloadAction<string>) => {
      state.breadcrumb = action.payload;
    },
    resetHeader: (state) => {
      state.title = initialState.title;
      state.breadcrumb = initialState.breadcrumb;
    }
  }
});

export const {
  setHeaderData,
  setHeaderTitle,
  setHeaderBreadcrumb,
  resetHeader
} = headerSlice.actions;

export default headerSlice.reducer;
