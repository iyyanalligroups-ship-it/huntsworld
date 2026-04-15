

import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

export const BannerPaymentApi = createApi({
  reducerPath: 'BannerPaymentApi',
  baseQuery: fetchBaseQuery({
    baseUrl: import.meta.env.VITE_API_URL,
  }),

  tagTypes: ['BannerPayments', 'Banners', 'Subscriptions'],

  endpoints: (builder) => ({

    // ==============================
    // 🔹 Get Active Banner (Per User)
    // ==============================
    getActiveBanner: builder.query({
      query: (user_id) => `/banner-payment/active/${user_id}`,
      providesTags: (result, error, user_id) => [
        { type: 'Banners', id: user_id },
      ],
    }),

    // ==============================
    // 🔹 Create Banner Order
    // ==============================
    createBannerOrder: builder.mutation({
      query: ({ user_id, days, amount, subscription_id }) => ({
        url: '/banner-payment/create-order',
        method: 'POST',
        body: { user_id, days, amount, subscription_id },
      }),
      invalidatesTags: (result, error, arg) => [
        { type: 'Banners', id: arg.user_id },
        { type: 'BannerPayments', id: arg.user_id },
      ],
    }),

    // ==============================
    // 🔹 Verify Payment
    // ==============================
    verifyBannerPayment: builder.mutation({
      query: (paymentData) => ({
        url: '/banner-payment/verify-payment',
        method: 'POST',
        body: paymentData,
      }),
      invalidatesTags: (result) =>
        result?.bannerPayment?.user_id
          ? [
            { type: 'Banners', id: result.bannerPayment.user_id },
            { type: 'BannerPayments', id: result.bannerPayment.user_id },
          ]
          : ['Banners'],
    }),

    // ==============================
    // 🔹 Cancel Banner
    // ==============================
    cancelBanner: builder.mutation({
      query: (id) => ({
        url: `/banner-payment/cancel/${id}`,
        method: 'POST',
      }),
      invalidatesTags: ['Banners', 'BannerPayments'],
    }),

    // ==============================
    // 🔹 Upgrade Banner
    // ==============================
    upgradeBanner: builder.mutation({
      query: (bannerData) => ({
        url: '/banner-payment/upgrade',
        method: 'POST',
        body: bannerData,
      }),
      invalidatesTags: (result, error, arg) => [
        { type: 'Banners', id: arg.user_id },
        { type: 'BannerPayments', id: arg.user_id },
      ],
    }),

    // ==============================
    // 🔹 Create Banner
    // ==============================
    createBanner: builder.mutation({
      query: (bannerData) => ({
        url: '/banner-payment/create-banner',
        method: 'POST',
        body: bannerData,
      }),
      invalidatesTags: (result, error, arg) => [
        { type: 'Banners', id: arg.user_id },
      ],
    }),

    // ==============================
    // 🔹 Update Banner
    // ==============================
    updateBanner: builder.mutation({
      query: ({ banner_id, user_id, ...body }) => ({
        url: `/banner-payment/update/${banner_id}`,
        method: 'PUT',
        body,
      }),
      invalidatesTags: (result, error, arg) => [
        { type: 'Banners', id: arg.user_id },
      ],
    }),

    // ==============================
    // 🔹 Delete Banner
    // ==============================
    deleteBanner: builder.mutation({
      query: ({ banner_id, user_id }) => ({
        url: `/banner-payment/delete/${banner_id}`,
        method: 'DELETE',
      }),
      invalidatesTags: (result, error, arg) => [
        { type: 'Banners', id: arg.user_id },
      ],
    }),

    // ==============================
    // 🔹 Get All Active Banner Payments (Admin)
    // ==============================
    getAllActiveBannerPayments: builder.query({
      query: ({ page, limit }) =>
        `/banner-payment/active-purchased-seller?page=${page}&limit=${limit}`,
      providesTags: ['BannerPayments'],
    }),

    // ==============================
    // 🔹 Check Subscription + Plan
    // ==============================
    checkUserSubscriptionAndPlan: builder.query({
      query: (user_id) =>
        `/banner-payment/check-subscription-and-plan/${user_id}`,
      providesTags: (result, error, user_id) => [
        { type: 'Subscriptions', id: user_id },
      ],
    }),

    checkUserSubscription: builder.query({
      query: (user_id) =>
        `/user-subscription-plan/fetch-user-active-subscription-for-banner/${user_id}`,
      providesTags: (result, error, user_id) => [
        { type: 'Subscriptions', id: user_id },
      ],
    }),

    getRectangleBanners: builder.query({
      query: (user_id) => ({
        url: `/banner-payment/rectangle/${user_id}`,
        method: "GET",
      }),
      providesTags: ["Banners"],
    }),

    getPremiumBanners: builder.query({
      query: () => ({
        url: `/banner-payment/premium`,
        method: "GET",
      }),
      providesTags: ["Banners"],
    }),

  }),
});

export const {
  useGetAllActiveBannerPaymentsQuery,
  useCreateBannerOrderMutation,
  useVerifyBannerPaymentMutation,
  useCreateBannerMutation,
  useGetActiveBannerQuery,
  useCancelBannerMutation,
  useUpgradeBannerMutation,
  useCheckUserSubscriptionQuery,
  useCheckUserSubscriptionAndPlanQuery,
  useUpdateBannerMutation,
  useDeleteBannerMutation,
  useGetPremiumBannersQuery,
  useGetRectangleBannersQuery,
  useLazyGetPremiumBannersQuery
} = BannerPaymentApi;
