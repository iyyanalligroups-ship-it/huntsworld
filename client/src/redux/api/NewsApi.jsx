// Frontend: features/news/newsApi.js (RTK Query API slice)
// Assume this is in a Redux setup with @reduxjs/toolkit and react-redux
// Base URL assumes backend API is proxied or at /api/news

import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

export const NewsApi = createApi({
  reducerPath: 'newsApi',
  baseQuery: fetchBaseQuery({
    baseUrl: `${import.meta.env.VITE_API_URL}`,
     prepareHeaders: (headers) => {
      const token = sessionStorage.getItem("token");
      if (token) {
        headers.set("Authorization", `Bearer ${token}`);
      }
      return headers;
    },
  }),
  tagTypes: ['News'],
  endpoints: (builder) => ({
    getAllNews: builder.query({
      query: () => '/news/fetch-all-news',
      providesTags: ['News'],
    }),
    getInProgressNews: builder.query({
      query: () => '/news/inprogress',
      providesTags: ['News'],
    }),
    createNews: builder.mutation({
      query: (body) => ({
        url: '/news/add-news',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['News'],
    }),
    updateNews: builder.mutation({
      query: ({ id, ...body }) => ({
        url: `/news/update-news/${id}`,
        method: 'PUT',
        body,
      }),
      invalidatesTags: ['News'],
    }),
    deleteNews: builder.mutation({
      query: (id) => ({
        url: `/news/delete-news/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['News'],
    }),
  }),
});

export const {
  useGetAllNewsQuery,
  useGetInProgressNewsQuery,
  useCreateNewsMutation,
  useUpdateNewsMutation,
  useDeleteNewsMutation,
} = NewsApi;