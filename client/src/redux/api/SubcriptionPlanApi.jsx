import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

export const SubscriptionPlansApi = createApi({
  reducerPath: 'subscriptionPlansApi',
  baseQuery: fetchBaseQuery({ baseUrl: import.meta.env.VITE_API_URL , prepareHeaders: (headers) => {
    const token = sessionStorage.getItem("token");
    if (token) {
      headers.set("Authorization", `Bearer ${token}`);
    }
    return headers;
  } }),
  tagTypes: ['SubscriptionPlans'],
  endpoints: (builder) => ({
    getPlans: builder.query({
      query: () => '/subscription-plans/fetch-all-subscriptionplans',
      providesTags: ['SubscriptionPlans'],
    }),
    getPlansWithDetails: builder.query({
      query: () => '/subscription-plans/fetch-all-subscriptionplans-with-details',
      providesTags: ['SubscriptionPlans'],
    }),
    createPlan: builder.mutation({
      query: (data) => ({
        url: '/subscription-plans/create-subscriptionplans',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['SubscriptionPlans'],
    }),
    updatePlan: builder.mutation({
      query: ({ id, ...data }) => ({
        url: `/subscription-plans/update-subscriptionplans/${id}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: ['SubscriptionPlans'],
    }),
    deletePlan: builder.mutation({
      query: (id) => ({
        url: `/subscription-plans/delete-subscriptionsplans/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['SubscriptionPlans'],
    }),
  }),
});

export const {
  useGetPlansQuery,
  useGetPlansWithDetailsQuery,
  useCreatePlanMutation,
  useUpdatePlanMutation,
  useDeletePlanMutation,
} = SubscriptionPlansApi;
