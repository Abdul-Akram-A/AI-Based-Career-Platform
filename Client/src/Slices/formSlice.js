import { createSlice } from "@reduxjs/toolkit";

const formSlice = createSlice({
  name: "form",
  initialState: {
    resume: "", // To store the file name
    frequency: 0, // To store number input
    location: "Not specific",
  },
  reducers: {
    updateField: (state, action) => {
      const { field, value } = action.payload;
      if (field === "resume") {
        // Storing only file metadata in Redux
        state.resume = value ? { name: value.name, size: value.size } : "";
      } else {
        state[field] = value;
      }
    },
    resetForm: (state) => {
      state.resume = "";
      state.frequency = 0;
      location = "Not specific";
    },
  },
});

export const { updateField, resetForm } = formSlice.actions;
export default formSlice.reducer;
