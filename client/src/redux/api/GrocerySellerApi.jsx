import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

export const GrocerySellerApi = createApi({
  reducerPath: "grocerySellerApi",
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
  tagTypes: ["GrocerySeller", "Address"],
  endpoints: (builder) => ({
    getAllGrocerySellers: builder.query({
      query: ({ page = 1, limit = 10 }) => ({
        url: `/grocery-sellers/fetch-all-grocery-seller?page=${page}&limit=${limit}`,
        method: "GET",
      }),
      transformResponse: (response) => ({
        sellers: response.data,
        pagination: response.pagination,
      }),
      providesTags: ["GrocerySeller"],
    }),

    getGrocerySellerById: builder.query({
      query: (id) => ({
        url: `/grocery-sellers/fetch-by-id-grocery-seller/${id}`,
        method: "GET",
      }),
      transformResponse: (response) => response.data,
      providesTags: ["GrocerySeller"],
    }),

    createGrocerySeller: builder.mutation({
      query: (sellerData) => ({
        url: "/grocery-sellers/create-grocery-seller",
        method: "POST",
        body: sellerData,
      }),
      invalidatesTags: ["GrocerySeller"],
    }),

    updateGrocerySeller: builder.mutation({
      query: ({ id, updatedSeller }) => ({
        url: `/grocery-sellers/update-grocery-seller/${id}`,
        method: "PUT",
        body: updatedSeller,
      }),
      invalidatesTags: ["GrocerySeller"],
    }),

    deleteGrocerySeller: builder.mutation({
      query: (id) => ({
        url: `/grocery-sellers/delete-grocery-seller/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["GrocerySeller"],
    }),

    // Fixed: Corrected URL to match backend route
    createAddress: builder.mutation({
      query: (addressData) => ({
        url: "/address/create-address", // Changed from "/api/address/create-address"
        method: "POST",
        body: addressData,
      }),
      invalidatesTags: ["Address"],
      transformResponse: (response) => response,
    }),

    getAllAddresses: builder.query({
      query: () => ({
        url: "/address/fetch-all-address",
        method: "GET",
      }),
      transformResponse: (response) => response,
      providesTags: ["Address"],
    }),

    getAddressById: builder.query({
      query: (id) => ({
        url: `/address/fetch-address-by-id/${id}`,
        method: "GET",
      }),
      transformResponse: (response) => response,
      providesTags: ["Address"],
    }),

    updateAddress: builder.mutation({
      query: ({ userId, updatedAddress }) => ({
        url: `/address/update-address/${userId}`,
        method: "PUT",
        body: updatedAddress,
      }),
      invalidatesTags: ["Address"],
    }),

    deleteAddress: builder.mutation({
      query: ({address_id,user_id}) => ({
        url: `/address/delete-address-addressId-userId`,
        method: "DELETE",
        body:{address_id,user_id}
      }),
      invalidatesTags: ["Address"],
    }),
  }),
});

export const {
  useGetAllGrocerySellersQuery,
  useGetGrocerySellerByIdQuery,
  useCreateGrocerySellerMutation,
  useUpdateGrocerySellerMutation,
  useDeleteGrocerySellerMutation,
  useCreateAddressMutation,
  useGetAllAddressesQuery,
  useGetAddressByIdQuery,
  useUpdateAddressMutation,
  useDeleteAddressMutation,
} = GrocerySellerApi;