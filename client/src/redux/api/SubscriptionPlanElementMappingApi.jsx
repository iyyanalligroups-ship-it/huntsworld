import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

export const SubscriptionPlanElementMappingApi = createApi({
  reducerPath: "subscriptionPlanElementMappingApi",
  baseQuery: fetchBaseQuery({
    baseUrl: import.meta.env.VITE_API_URL,
    prepareHeaders: (headers) => {
      const token = sessionStorage.getItem("token");
      if (token) {
        headers.set("Authorization", `Bearer ${token}`);
      }
      return headers;
    },
  }),
  tagTypes: ["SubscriptionPlanElementMappings"],
  endpoints: (builder) => ({
    getMappings: builder.query({
      query: () =>
        "/subscription-plans-elements-mapping/fetch-all-subscriptionplanelementmappings",
      providesTags: ["SubscriptionPlanElementMappings"],
    }),
    createMapping: builder.mutation({
      query: (data) => ({
        url: "/subscription-plans-elements-mapping/create-subscriptionplanelementmappings",
        method: "POST",
        body: data, // The body contains the subscription plan id and elements
      }),
      invalidatesTags: ["SubscriptionPlanElementMappings"], // Invalidate the cache for this data after a successful mutation
    }),

    updateMapping: builder.mutation({
      query: ({ id, ...data }) => ({
        url: `/subscription-plans-elements-mapping/update-subscriptionplanelementmappings/${id}`,
        method: "PUT",
        body: data, // The body contains the updated data
      }),
      invalidatesTags: ["SubscriptionPlanElementMappings"], // Invalidate the cache to refetch the latest data
    }),
    deleteMapping: builder.mutation({
      query: ({ subscription_plan_id, element_id }) => ({
        url: '/subscription-plans-elements-mapping/delete-subscriptionplanelementmappings',
        method: 'DELETE',
        body: { subscription_plan_id, element_id }, // Sending both parameters
      }),
      invalidatesTags: ['SubscriptionPlanElementMappings'],
    }),

    getSubscriptionPlan: builder.query({
      query: () =>
        "/subscription-plans/fetch-all-subscriptionplans-for-mapping",
      providesTags: ["SubscriptionPlanElementMappings"],
    }),
    getSubscriptionPlanElement: builder.query({
      query: () =>
        "/subscription-plans-elements/fetch-all-subscriptionplanelements-for-mapping",
      providesTags: ["SubscriptionPlanElementMappings"],
    }),
  }),
});

export const {
  useGetMappingsQuery,
  useGetSubscriptionPlanQuery,
  useGetSubscriptionPlanElementQuery,
  useCreateMappingMutation,
  useUpdateMappingMutation,
  useDeleteMappingMutation,
} = SubscriptionPlanElementMappingApi;
