import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

export const UserSubscriptionPlanApi = createApi({
  reducerPath: 'UserSubscriptionPlanApi',
  baseQuery: fetchBaseQuery({
    baseUrl: import.meta.env.VITE_API_URL,
    prepareHeaders: (headers) => {
      const token = sessionStorage.getItem('token');
      if (token) {
        headers.set('Authorization', `Bearer ${token}`);
      }
      return headers;
    },
  }),
  tagTypes: ['Plans', 'UserSubscriptions'],
  endpoints: (builder) => ({
    getAllPlans: builder.query({
      query: () => '/subscription-plans-elements-mapping/fetch-all-subscriptionplanelementmappings',
      providesTags: ['Plans'],
    }),
    getUserActiveSubscription: builder.query({
      query: (user_id) => `/user-subscription-plan/fetch-user-active-subscription/${user_id}`,
      providesTags: ['UserSubscriptions'],
    }),
    cancelSubscription: builder.mutation({
      query: (id) => ({
        url: `/user-subscription-plan/cancel-usersubscriptionplans/${id}`,
        method: 'POST',
      }),
      invalidatesTags: ['UserSubscriptions'],
    }),
    createSubscription: builder.mutation({
      query: (subscription) => ({
        url: '/user-subscription-plan/create-usersubscriptionplans',
        method: 'POST',
        body: subscription,
      }),
      invalidatesTags: ['UserSubscriptions'],
    }),
    upgradeSubscription: builder.mutation({
      query: ({
        user_id,
        subscription_plan_id,
        old_subscription_id,
        amount,
        razorpay_order_id,
        razorpay_payment_id,
        razorpay_signature,
        razorpay_subscription_id,
      }) => ({
        url: '/user-subscription-plan/upgrade-usersubscriptionplans',
        method: 'POST',
        body: {
          user_id,
          subscription_plan_id,
          old_subscription_id,
          amount,
          razorpay_order_id,
          razorpay_payment_id,
          razorpay_signature,
          razorpay_subscription_id,
        },
      }),
      invalidatesTags: ['UserSubscriptions'],
    }),
    toggleAutoPay: builder.mutation({
      query: ({ id, auto_renew }) => ({
        url: `/user-subscription-plan/subscriptions/${id}/toggle-autopay`,
        method: 'PATCH',
        body: { auto_renew },
      }),
      invalidatesTags: ['UserSubscriptions'],
    }),
    updatePlan: builder.mutation({
      query: ({ id, ...plan }) => ({
        url: `/user-subscription-plan/update-usersubscriptionplans-by-id/${id}`,
        method: 'PUT',
        body: plan,
      }),
      invalidatesTags: ['Plans'],
    }),
    deletePlan: builder.mutation({
      query: (id) => ({
        url: `/user-subscription-plan/delete-usersubscriptionplans-by-id/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Plans'],
    }),
    createRazorpayOrder: builder.mutation({
      query: ({ user_id, subscription_plan_id, amount, auto_off, auto_renew }) => ({
        url: '/user-subscription-plan/create-order',
        method: 'POST',
        body: { user_id, subscription_plan_id, amount, auto_off, auto_renew },
      }),
    }),
    verifyPayment: builder.mutation({
      query: (paymentData) => ({
        url: '/user-subscription-plan/verify-payment',
        method: 'POST',
        body: paymentData,
      }),
    }),
    getUserBySearch: builder.query({
      query: (searchValue) =>
        `/user-subscription-plan/fetch-merchant-by-number-or-email?query=${encodeURIComponent(searchValue)}`,
      providesTags: ['UserSubscriptions'],
    }),
    getAllActiveSubscriptions: builder.query({
      query: ({ page = 1, limit = 5 }) =>
        `/user-subscription-plan/active/all?page=${page}&limit=${limit}`,
    }),
    getAllActiveEbookPayments: builder.query({
      query: ({ page = 1, limit = 5 }) => `/e-book-payment/active-ebook-payments?page=${page}&limit=${limit}`,
      providesTags: ['UserSubscriptions'],
    }),
    getRoyalPlanCompanies: builder.query({
      query: ({ page = 1, limit = 5 }) => ({
        url: '/user-subscription-plan/royal-plan-companies',
        params: { page, limit },
      }),
      transformResponse: (response) => response,
    }),
    getTrendingDeepSubCategories: builder.query({
      query: ({ letter }) => ({
        url: '/user-subscription-plan/trending-deep-sub-categories',
        params: letter ? { letter } : {},
      }),
      transformResponse: (response) => response,
    }),
    getSubscriptionStatus: builder.query({
      query: (userId) => `/user-subscription-plan/subscriptions/subscription-status/${userId}`,
      providesTags: ['UserSubscriptions'],
    }),
  }),
});

export const {
  useGetAllPlansQuery,
  useGetRoyalPlanCompaniesQuery,
  useGetTrendingDeepSubCategoriesQuery,
  useGetUserBySearchQuery,
  useGetAllActiveSubscriptionsQuery,
  useGetAllActiveEbookPaymentsQuery,
  useGetUserActiveSubscriptionQuery,
  useCreateSubscriptionMutation,
  useUpgradeSubscriptionMutation,
  useUpdatePlanMutation,
  useCancelSubscriptionMutation,
  useDeletePlanMutation,
  useCreateRazorpayOrderMutation,
  useVerifyPaymentMutation,
  useGetSubscriptionStatusQuery,
  useToggleAutoPayMutation,
} = UserSubscriptionPlanApi;