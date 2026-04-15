import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

export const SellerApi = createApi({
  reducerPath: 'sellerApi',
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
  endpoints: (builder) => ({
    getSellerBySlug: builder.query({
      query: (slug) => `/sellers/fetch-seller-by-slug/${slug}`,
    }),
  }),
});

export const { useGetSellerBySlugQuery } = SellerApi;