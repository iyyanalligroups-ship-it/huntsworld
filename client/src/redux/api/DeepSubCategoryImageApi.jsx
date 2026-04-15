import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

export const DeepSubCategoryImageApi = createApi({
  reducerPath: "deepSubCategoryImageApi",
  baseQuery: fetchBaseQuery({ baseUrl: import.meta.env.VITE_API_IMAGE_URL }),
  tagTypes: ["DeepSubCategoryImage"],
  endpoints: (builder) => ({
    // Upload Deep Sub-Category Image
    uploadDeepSubCategoryImage: builder.mutation({
      query: (formData) => ({
        url: "/deepSubCategory-images/upload-deep-sub-category",
        method: "POST",
        body: formData,
      }),
      invalidatesTags: ["DeepSubCategoryImage"],
    }),

    // Get Deep Sub-Category Image by Name
    getDeepSubCategoryImage: builder.mutation({
      query: (deep_sub_category_name) => ({
        url: `/deepSubCategory-images/deep-sub-category/${deep_sub_category_name}`,
        method: "GET",
        responseHandler: (response) => response.blob(),
      }),
      invalidatesTags: ["DeepSubCategoryImage"],
    }),

    // Delete Deep Sub-Category Image
    deleteDeepSubCategoryImage: builder.mutation({
      query: (deep_sub_category_name) => ({
        url: `/deepSubCategory-images/delete-deep-sub-category`,
        method: "DELETE",
        body: { deep_sub_category_name },
      }),
      invalidatesTags: ["DeepSubCategoryImage"],
    }),

    // Update Deep Sub-Category Image
    updateDeepSubCategoryImage: builder.mutation({
      query: ({ id, formData }) => ({
        url: `/deepSubCategory-images/update-deep-sub-category/${id}`,
        method: "PUT",
        body: formData,
      }),
      invalidatesTags: ["DeepSubCategoryImage"],
    }),
  }),
});

export const {
  useUploadDeepSubCategoryImageMutation,
  useGetDeepSubCategoryImageMutation,
  useDeleteDeepSubCategoryImageMutation,
  useUpdateDeepSubCategoryImageMutation,
} = DeepSubCategoryImageApi;
