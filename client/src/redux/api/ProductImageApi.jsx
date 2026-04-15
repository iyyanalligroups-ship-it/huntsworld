import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

export const ProductImageApi = createApi({
  reducerPath: "productImageApi",
  baseQuery: fetchBaseQuery({
    baseUrl: import.meta.env.VITE_API_IMAGE_URL,
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
    // Upload Product Image
    uploadProductImage: builder.mutation({
      query: (formData) => ({
        url: "/product-images/upload-product",
        method: "POST",
        body: formData,
      }),
      invalidatesTags: ["ProductImage"],
    }),
    // Update Product Image
    updateProductImage: builder.mutation({
        query: (product_name) => ({
          url: `/product-images/update-product`,
          method: "PUT",
          body:{product_name}
        }),
        invalidatesTags: ["ProductImage"],
      }),
    // Delete Product Image
    deleteProductImage: builder.mutation({
      query: ({ product_name, file_names }) => ({
        url: `/product-images/delete-product`,
        method: "DELETE",
        body: {
          product_name, // Pass the product name
          file_names, // Pass the array of file names
        },
      }),
      invalidatesTags: ["ProductImage"], // Assuming you have caching setup for this tag
    }),
    
  }),
});

export const {
  useUploadProductImageMutation,
  useUpdateProductImageMutation,
  useDeleteProductImageMutation,
} = ProductImageApi;
