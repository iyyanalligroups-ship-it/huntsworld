import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

export const MerchantProductApi = createApi({
  reducerPath: "merchantProductApi",
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
  tagTypes: ["Product"],
  endpoints: (builder) => ({
    // 🟢 GET all products
    getMerchantProducts: builder.query({
      query: () => "/products",
      providesTags: ["Product"],
    }),

    // 🟢 POST - Add new product
    addMerchantProduct: builder.mutation({
      query: (productData) => ({
        url: "/products/create",
        method: "POST",
        body: productData,
      }),
      invalidatesTags: ["Product"],
    }),

    // 🟠 PATCH - Update product by ID
    updateMerchantProduct: builder.mutation({
      query: ({ id, ...updatedData }) => ({
        url: `/products/update/${id}`,
        method: "PATCH",
        body: updatedData,
      }),
      invalidatesTags: ["Product"],
    }),

    // 🔴 DELETE - Delete product by ID
    deleteMerchantProduct: builder.mutation({
      query: (id) => ({
        url: `/products/delete/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Product"],
    }),
  }),
});

export const {
  useGetMerchantProductsQuery,
  useAddMerchantProductMutation,
  useUpdateMerchantProductMutation,
  useDeleteMerchantProductMutation,
} = MerchantProductApi;

