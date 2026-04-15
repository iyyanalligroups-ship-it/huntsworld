// src/redux/api/topListingApi.js
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

export const TopListingApi = createApi({
  reducerPath: 'TopListingApi',
  baseQuery: fetchBaseQuery({
     baseUrl: import.meta.env.VITE_API_URL, prepareHeaders: (headers) => {
       const token = sessionStorage.getItem("token");
       if (token) {
         headers.set("Authorization", `Bearer ${token}`);
       }
       return headers;
     }
   }),
  tagTypes: ['TopListing', 'UserSubscription'], // for auto-refetching / invalidation
  endpoints: (builder) => ({
    // ─── Get active + pending top listing for current user ───────────────────────
    getActiveTopListing: builder.query({
      query: (userId) => ({
        url: `/top-listing-plan-payment/active/${userId}`,
        method: 'GET',
      }),
      providesTags: (result, error, userId) =>
        result ? [{ type: 'TopListing', id: 'ACTIVE' }] : [],
    }),

    // ─── Create new top listing order (first-time activation) ────────────────────
    createTopListingOrder: builder.mutation({
      query: (body) => ({
        url: '/top-listing-plan-payment/create-order',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['TopListing'],
    }),

    // ─── Upgrade / Extend existing top listing ──────────────────────────────────
    upgradeTopListing: builder.mutation({
      query: (body) => ({
        url: '/top-listing-plan-payment/upgrade',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['TopListing'],
    }),

    // ─── Verify Razorpay payment (works for both create & upgrade) ──────────────
    verifyTopListingPayment: builder.mutation({
      query: (body) => ({
        url: '/top-listing-plan-payment/verify-payment',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['TopListing'],
    }),

    // ─── Cancel active top listing ──────────────────────────────────────────────
    cancelTopListing: builder.mutation({
      query: (body) => ({
        url: '/top-listing-plan-payment/cancel',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['TopListing'],
    }),
  }),
});

// Export hooks for usage in functional components
export const {
  useGetActiveTopListingQuery,
  useCreateTopListingOrderMutation,
  useUpgradeTopListingMutation,
  useVerifyTopListingPaymentMutation,
  useCancelTopListingMutation,
} = TopListingApi;
