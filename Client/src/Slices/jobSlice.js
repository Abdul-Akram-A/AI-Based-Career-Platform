import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";

// Function to load persisted data from sessionStorage
const loadState = () => {
  try {
    const serializedState = sessionStorage.getItem("jobData");
    return serializedState
      ? JSON.parse(serializedState)
      : {
          job_listings: [],
          predicted_category: "",
        };
  } catch (error) {
    console.error("Error loading state from sessionStorage:", error);
    return { job_listings: [], predicted_category: "" };
  }
};

// Async thunk to fetch job data
export const fetchJobData = createAsyncThunk(
  "jobData/fetchJobData",
  async ({ resumeFile, frequency, location }) => {
    if (!resumeFile || !frequency || !location) {
      throw new Error("resumeFile and frequency and location are required");
    }

    const formData = new FormData();
    formData.append("resume", resumeFile);
    formData.append("frequency", frequency);
    formData.append("location", location);

    try {
      const response = await axios.post("/matches", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      return response.data;
    } catch (error) {
      throw new Error(
        error.response?.data?.message || "Failed to fetch job data"
      );
    }
  }
);

const persistedState = loadState(); // Load saved state from sessionStorage

const initialState = {
  jobData: persistedState.job_listings || [], // Use saved data if available
  category: persistedState.predicted_category || "",
  status: "idle",
  error: null,
};

const jobSlice = createSlice({
  name: "jobData",
  initialState,
  reducers: {
    getJobData(state, action) {
      state.jobData = action.payload.job_listings;
      state.category = action.payload.predicted_category;
      sessionStorage.setItem("jobData", JSON.stringify(action.payload)); // Save to sessionStorage
    },
    removeCategory(state) {
      state.category = "";
      sessionStorage.removeItem("jobData"); // Remove saved data
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchJobData.pending, (state) => {
        state.status = "loading";
      })
      .addCase(fetchJobData.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.jobData = action.payload.job_listings;
        state.category = action.payload.predicted_category;
        sessionStorage.setItem("jobData", JSON.stringify(action.payload)); // Save data to sessionStorage
      })
      .addCase(fetchJobData.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.error.message;
      });
  },
});

export const { getJobData, removeCategory } = jobSlice.actions;
export default jobSlice.reducer;

// window.addEventListener("beforeunload", () => {
//   localStorage.removeItem("jobData");
// });
