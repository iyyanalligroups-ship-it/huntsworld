import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

export const GrocerySellerOnboardingApi = createApi({
  reducerPath: 'GrocerySellerOnboardingApi',
  baseQuery: fetchBaseQuery({
      baseUrl: import.meta.env.VITE_API_URL, prepareHeaders: (headers) => {
        const token = sessionStorage.getItem("token");
        if (token) {
          headers.set("Authorization", `Bearer ${token}`);
        }
        return headers;
      },
    }),
  endpoints: (builder) => ({
    fetchAllRoles: builder.query({
      query: () => '/role/fetch-all-role',
      transformResponse: (response) => response.data || [],
    }),
    searchUser: builder.query({
      query: (searchTerm) => `/users/lookup?name=${encodeURIComponent(searchTerm)}`,
      transformResponse: (response) => ({
        success: response.success,
        users: response.users || [],
      }),
    }),
    createAddress: builder.mutation({
      query: (addressData) => ({
        url: '/address/create-address',
        method: 'POST',
        body: addressData,
      }),
      transformResponse: (response) => response,
    }),
    createGrocerySeller: builder.mutation({
      query: (sellerData) => ({
        url: '/grocery-sellers/create-grocery-seller',
        method: 'POST',
        body: sellerData,
      }),
      transformResponse: (response) => response,
    }),
  }),
});

export const {
  useFetchAllRolesQuery,
  useSearchUserQuery,
  useCreateAddressMutation,
  useCreateGrocerySellerMutation,
} = GrocerySellerOnboardingApi;
