import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

export const MerchantAuthApi = createApi({
  reducerPath: "merchantAuthApi",
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
  tagTypes: ["Merchant"],
  endpoints: (builder) => ({
    lookupUser: builder.query({
      query: ({ field, value }) => ({
        url: `/users/lookup?${field}=${encodeURIComponent(value)}`,
        method: "GET",
      }),
      transformResponse: (response) => ({
        user_id: response.user_id,
        name: response.name,
        email: response.email,
        phone_number: response.phone_number,
      }),
    }),
    createAddress: builder.mutation({
      query: (addressData) => ({
        url: "/address/create-address",
        method: "POST",
        body: addressData,
      }),
      transformResponse: (response) => ({
        address_id: response.address_id,
      }),
    }),
  }),
});

export const {
  useLookupUserQuery,
  useLazyLookupUserQuery,
  useCreateAddressMutation,
} = MerchantAuthApi;