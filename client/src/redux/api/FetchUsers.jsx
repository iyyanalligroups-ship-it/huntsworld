import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";

export const fetchUser = createAsyncThunk(
  "fetchuser/fetchUser",
  async (searchQuery, { rejectWithValue }) => {
    try {
      let params = {};
      if (searchQuery.includes("@")) {
        params.email = searchQuery;
      } else if (/^\d+$/.test(searchQuery)) {
        params.phone_number = searchQuery;
      } else {
        params.name = searchQuery;
      }

      const response = await axios.get(`${import.meta.env.VITE_API_URL}/users/lookup`, { params });
      const users = response.data.users;

      if (!users || users.length === 0) {
        return null;
      }

      const user = users[0];

      if (user.role?.role !== "USER") {
        return null;
      }

      return user;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

const fetchuserSlice = createSlice({
  name: "fetchuser",
  initialState: {
    users: null,
    loading: false,
    error: null,
  },
  reducers: {
    clearUserState: (state) => {
      state.users = null;
      state.loading = false;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchUser.fulfilled, (state, action) => {
        state.loading = false;
        state.users = action.payload;
      })
      .addCase(fetchUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "An error occurred";
      });
  },
});

export const { clearUserState } = fetchuserSlice.actions;
export default fetchuserSlice.reducer;
