import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

export const ProductQuoteApi = createApi({
  reducerPath: 'productQuoteApi',
  baseQuery: fetchBaseQuery({
    baseUrl: import.meta.env.VITE_API_URL,
  }),
  tagTypes: ['Quotes'],
  endpoints: (builder) => ({
    // Fetch all quotes (optionally filtered by ownerId)
    getQuotes: builder.query({
      query: (ownerId) => {
        const url = ownerId ? `/product-quotes/fetch-product-quotes-by-owner?ownerId=${ownerId}` : '/quotes';
        return { url };
      },
      providesTags: ['Quotes'],
    }),

    // Fetch single quote by ID
    getQuoteById: builder.query({
      query: (id) => `/product-quotes/fetch-product-quotes-by-id/${id}`,
      providesTags: ['Quotes'],
    }),

    // Create a new quote
    addQuote: builder.mutation({
      query: (newQuote) => ({
        url: '/product-quotes/create-product-quotes',
        method: 'POST',
        body: newQuote,
      }),
      invalidatesTags: ['Quotes'],
    }),

    // Update a quote
    updateQuote: builder.mutation({
      query: ({ id, ...updateData }) => ({
        url: `/product-quotes/update-product-quotes/${id}`,
        method: 'PUT',
        body: updateData,
      }),
      invalidatesTags: ['Quotes'],
    }),

    // Delete a quote
    deleteQuote: builder.mutation({
      query: (id) => ({
        url: `/product-quotes/delete-product-quotes/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Quotes'],
    }),
  }),
});

export const {
  useGetQuotesQuery,
  useGetQuoteByIdQuery,
  useAddQuoteMutation,
  useUpdateQuoteMutation,
  useDeleteQuoteMutation,
} = ProductQuoteApi;
