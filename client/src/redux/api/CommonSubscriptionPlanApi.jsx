// === 1. RTK Query API Slice (subscriptionPlanApi.js) ===
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

export const CommonSubscriptionPlanApi = createApi({
  reducerPath: 'subscriptionPlanApi',
  baseQuery: fetchBaseQuery({ baseUrl: import.meta.env.VITE_API_URL }),
  tagTypes: ['SubscriptionPlans'],
  endpoints: (builder) => ({
    getAllPlans: builder.query({
      query: () => '/common-subscription-plan/fetch-all-common-subscription',
      providesTags: ['SubscriptionPlans']
    }),
    getPlanById: builder.query({
      query: (id) => `/common-subscription-plan/fetch-common-plan-by-id/${id}`
    }),
    getEbookSubscriptionPlans: builder.query({
      query: () => '/common-subscription-plan/ebook-plans',
      providesTags: ['SubscriptionPlans']
    }),
    createPlan: builder.mutation({
      query: (body) => ({
        url: '/common-subscription-plan/create-common-subscription-plan/',
        method: 'POST',
        body
      }),
      invalidatesTags: ['SubscriptionPlans']
    }),
    updatePlan: builder.mutation({
      query: ({ id, ...body }) => ({
        url: `/common-subscription-plan/update-common-plan/${id}`,
        method: 'PUT',
        body
      }),
      invalidatesTags: ['SubscriptionPlans']
    }),
    deletePlan: builder.mutation({
      query: (id) => ({
        url: `/common-subscription-plan/delete-common-plan/${id}`,
        method: 'DELETE'
      }),
      invalidatesTags: ['SubscriptionPlans']
    }),
    getGSTPlan: builder.query({
      query: () => '/common-subscription-plan/fetch-gst-data', // Endpoint for getSubscriptionPlanByFields
      providesTags: ['SubscriptionPlans']
    }),
    fetchBannerAdAmount: builder.query({
      query: () => '/common-subscription-plan/fetch-banner-ad-amount',
      providesTags: ['SubscriptionPlans']
    }),
  })
});

export const {
  useFetchBannerAdAmountQuery,
  useGetAllPlansQuery,
  useGetGSTPlanQuery,
  useGetEbookSubscriptionPlansQuery,
  useCreatePlanMutation,
  useUpdatePlanMutation,
  useDeletePlanMutation,
  useGetPlanByIdQuery
} = CommonSubscriptionPlanApi;
