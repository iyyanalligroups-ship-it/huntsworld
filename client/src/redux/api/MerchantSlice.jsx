// import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
// import axios from "axios";

// const api = axios.create({
//   baseURL: import.meta.env.VITE_API_URL || "/api/v1/merchants",
//   headers: {
//     "Content-Type": "application/json",
//     Authorization: `Bearer ${sessionStorage.getItem("token")}`,
//   },
// });

// export const addMerchant = createAsyncThunk(
//   "merchant/addMerchant",
//   async (merchantData, { rejectWithValue }) => {
//     try {
//       const response = await api.post("/merchants/create-merchant", merchantData);
//       return response.data;
//     } catch (error) {
//       return rejectWithValue(error.response?.data?.message || "Failed to add merchant");
//     }
//   }
// );

// const merchantSlice = createSlice({
//   name: "merchant",
//   initialState: {
//     merchants: [],
//     status: "idle",
//     error: null,
//   },
//   reducers: {},
//   extraReducers: (builder) => {
//     builder
//       .addCase(addMerchant.pending, (state) => {
//         state.status = "loading";
//         state.error = null;
//       })
//       .addCase(addMerchant.fulfilled, (state, action) => {
//         state.status = "succeeded";
//         state.merchants.push(action.payload);
//         state.error = null;
//       })
//       .addCase(addMerchant.rejected, (state, action) => {
//         state.status = "failed";
//         state.error = action.payload;
//       });
//   },
// });

// export default merchantSlice.reducer;