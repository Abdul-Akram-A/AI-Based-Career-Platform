import { configureStore } from "@reduxjs/toolkit";
import formReducer from "../Slices/formSlice";
import jobReducer from "../Slices/jobSlice";

export const store = configureStore({
  reducer: {
    form: formReducer,
    jobData: jobReducer,
  },
});
