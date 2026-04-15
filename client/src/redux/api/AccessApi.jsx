import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

export const AccessApi = createApi({
  reducerPath: 'accessApi',
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
  tagTypes: ['Access'],

  endpoints: (builder) => ({
    // Get access by user_id
    getCategoryAccess: builder.query({
      query: () => `/access/fetch-all-access`,
      providesTags: ['Access'],
    }),

    // Update or create category access
    updateCategoryAccess: builder.mutation({
      query: (body) => ({
        url: '/access/is-category-wise-show',
        method: 'PUT',
        body,
      }),
      invalidatesTags: ['Access'],
    }),
  }),
});

export const {
  useGetCategoryAccessQuery,
  useUpdateCategoryAccessMutation,
} = AccessApi;
