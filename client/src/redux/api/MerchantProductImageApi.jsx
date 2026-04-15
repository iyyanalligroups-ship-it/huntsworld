import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

export const MerchantProductImageApi = createApi({
  reducerPath: "merchantProductImageApi",
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
  tagTypes: ["ProductImage"],
  endpoints: (builder) => ({
    // 🟢 Upload Image
    uploadMerchantProductImage: builder.mutation({
      query: (formData) => ({
        url: "/upload/product-image",
        method: "POST",
        body: formData,
      }),
      invalidatesTags: ["ProductImage"],
    }),

    // 🟠 Update Product Image (optional, if your backend supports)
    updateMerchantProductImage: builder.mutation({
      query: ({ id, formData }) => ({
        url: `/upload/product-image/${id}`,
        method: "PATCH",
        body: formData,
      }),
      invalidatesTags: ["ProductImage"],
    }),

    // 🔴 Delete Image
    deleteMerchantProductImage: builder.mutation({
      query: (filename) => ({
        url: `/upload/product-image/${filename}`,
        method: "DELETE",
      }),
      invalidatesTags: ["ProductImage"],
    }),
  }),
});

export const {
  useUploadMerchantProductImageMutation,
  useUpdateMerchantProductImageMutation,
  useDeleteMerchantProductImageMutation,
} = MerchantProductImageApi;
