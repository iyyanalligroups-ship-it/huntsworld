import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

export const viewPointApi = createApi({
  reducerPath: 'viewPointApi',
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
  tagTypes: ['ViewPoints'],
  endpoints: (builder) => ({
    // 🔹 POST
    createViewPoint: builder.mutation({
      query: (body) => ({
        url: '/view-points/create-viewpoints',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['ViewPoints'],
    }),

    // 🔹 GET
    getViewPointsByUser: builder.query({
      query: (userId) => `/view-points/fetch-viewpoints-by-id/${userId}`,
      providesTags: ['ViewPoints'],
    }),
    upsertViewPoint: builder.mutation({
      query: (body) => ({
        url: '/view-points/update-viewpoints-by-id',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['ViewPoints'],
    }),

  }),
});

export const {
  useCreateViewPointMutation,
  useGetViewPointsByUserQuery,
    useUpsertViewPointMutation,
} = viewPointApi;
