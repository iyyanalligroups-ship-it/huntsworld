import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

export const TrendingPointsPaymentApi = createApi({
  reducerPath: 'TrendingPointsPaymentApi',
  baseQuery: fetchBaseQuery({ baseUrl: import.meta.env.VITE_API_URL }),
  tagTypes: ['TrendingPointsPayments', 'Subscriptions'],
  endpoints: (builder) => ({
    createTrendingPointsOrder: builder.mutation({
      query: ({ user_id, points, amount, subscription_id }) => ({
        url: '/trending-points-payment/create-order',
        method: 'POST',
        body: { user_id, points, amount, subscription_id },
      }),
    }),
    verifyTrendingPointsPayment: builder.mutation({
      query: (paymentData) => ({
        url: '/trending-points-payment/verify-payment',
        method: 'POST',
        body: paymentData,
      }),
    }),
    getTrendingPointsWithProductByUser: builder.query({
      query: ({ userId, page = 1, limit = 10, search = '', filter = 'all' }) =>
        `/trending-point/get-products/${userId}?page=${page}&limit=${limit}&search=${encodeURIComponent(search)}&filter=${filter}`,
      providesTags: ['TrendingPoints'],
      transformResponse: (response) => ({
        data: response.data,
        total: response.total,
        page: response.page,
        limit: response.limit,
      }),
    }),
    getActiveTrendingPoints: builder.query({
      query: (user_id) => `/trending-points-payment/active/${user_id}`,
      providesTags: ['TrendingPointsPayments'],
    }),
    cancelTrendingPoints: builder.mutation({
      query: ({ user_id, trending_points_payment_id }) => ({
        url: `/trending-points-payment/cancel/${user_id}`,
        method: 'POST',
        body: { trending_points_payment_id }
      }),
      invalidatesTags: ['TrendingPointsPayments'],
    }),
    upgradeTrendingPoints: builder.mutation({
      query: (pointsData) => ({
        url: '/trending-points-payment/upgrade',
        method: 'POST',
        body: pointsData,
      }),
      invalidatesTags: ['TrendingPointsPayments'],
    }),
    getTrendingPointsConfig: builder.query({
      query: () => '/trending-points-payment/config',
      providesTags: ['Config'],
    }),
    checkUserSubscription: builder.query({
      query: (user_id) => `/banner-payment/check-subscription-and-plan/${user_id}`,
      providesTags: ['Subscriptions'],
    }),
    createTrendingPoints: builder.mutation({
      query: (data) => ({
        url: '/trending-point/add-custom-trend-points',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['TrendingPoints'],
    }),
    updateTrendingPoints: builder.mutation({
      query: (data) => ({
        url: '/trending-point/update-custom-trend-points',
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: ['TrendingPoints'],
    }),
    deleteTrendingPoints: builder.mutation({
      query: ({ trending_points_id }) => ({
        url: '/trending-point/delete-custom-trend-points',
        method: 'DELETE',
        body: { trending_points_id },
      }),
      invalidatesTags: ['TrendingPoints'],
    }),
getUserProducts: builder.query({
  query: ({ userId, page = 1, limit = 10 }) =>
    `/products/fetch-all-products-for-seller/${userId}?page=${page}&limit=${limit}`,
  providesTags: ['Products'],
}),
    getProductDetails: builder.query({
      query: (productId) => `/products/fetch-products-by-id/${productId}`,
      providesTags: ['Products'],
    }),
     searchMerchants: builder.query({
      query: (query) => `/trending-points-payment/search-merchants?query=${query}`,
       providesTags: ['TrendingPointsPayments'],
    }),
     getAllActiveTrendingPointUsers: builder.query({
      query: () => `/trending-points-payment/fetch-all-active-trending-points-users`,
       providesTags: ['TrendingPointsPayments'],
    }),
  }),
});

export const {
  useGetUserProductsQuery,
  useSearchMerchantsQuery,
  useGetAllActiveTrendingPointUsersQuery,
  useGetProductDetailsQuery,
  useCreateTrendingPointsOrderMutation,
  useVerifyTrendingPointsPaymentMutation,
  useGetTrendingPointsWithProductByUserQuery,
  useGetActiveTrendingPointsQuery,
  useCancelTrendingPointsMutation,
  useGetTrendingPointsConfigQuery,
  useUpgradeTrendingPointsMutation,
  useCheckUserSubscriptionQuery,
  useCreateTrendingPointsMutation,
  useUpdateTrendingPointsMutation,
  useDeleteTrendingPointsMutation,
} = TrendingPointsPaymentApi;
