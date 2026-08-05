import { createSlice } from "@reduxjs/toolkit";

/**
 * Global UI state for the dashboard shell. Currently just the mobile sidebar
 * drawer's open/closed flag — shared between the Header (hamburger that opens
 * it) and the Sidebar (the overlay itself), which are not parent/child.
 */
interface UiState {
  sidebarOpen: boolean;
}

const initialState: UiState = {
  sidebarOpen: false
};

const uiSlice = createSlice({
  name: "ui",
  initialState,
  reducers: {
    openSidebar: (state) => {
      state.sidebarOpen = true;
    },
    closeSidebar: (state) => {
      state.sidebarOpen = false;
    },
    toggleSidebar: (state) => {
      state.sidebarOpen = !state.sidebarOpen;
    }
  }
});

export const { openSidebar, closeSidebar, toggleSidebar } = uiSlice.actions;
export default uiSlice.reducer;
