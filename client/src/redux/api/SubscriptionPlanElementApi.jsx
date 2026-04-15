  import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

  export const SubscriptionPlanElementsApi = createApi({
    reducerPath: 'subscriptionPlanElementsApi',
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
    tagTypes: ['SubscriptionPlanElements'],
    endpoints: (builder) => ({
      getElements: builder.query({
        query: () => '/subscription-plans-elements/fetch-all-subscriptionplanelements',
        providesTags: ['SubscriptionPlanElements'],
      }),
      createElement: builder.mutation({
        query: (data) => ({
          url: '/subscription-plans-elements/create-subscriptionplanelements',
          method: 'POST',
          body: data,
        }),
        invalidatesTags: ['SubscriptionPlanElements'],
      }),
      updateElement: builder.mutation({
        query: ({ id, ...data }) => ({
          url: `/subscription-plans-elements/update-subscriptionplanelements/${id}`,
          method: 'PUT',
          body: data,
        }),
        invalidatesTags: ['SubscriptionPlanElements'],
      }),
      deleteElement: builder.mutation({
        query: (id) => ({
          url: `/subscription-plans-elements/delete-subscriptionplanelements/${id}`,
          method: 'DELETE',
        }),
        invalidatesTags: ['SubscriptionPlanElements'],
      }),
    }),
  });

  export const {
    useGetElementsQuery,
    useCreateElementMutation,
    useUpdateElementMutation,
    useDeleteElementMutation,
  } = SubscriptionPlanElementsApi;
