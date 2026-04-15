import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

export const CategoryImageApi = createApi({
  reducerPath: "categoryImageApi",
  baseQuery: fetchBaseQuery({ baseUrl: import.meta.env.VITE_API_IMAGE_URL }),
  tagTypes: ["Category"],
  endpoints: (builder) => ({
  

    // image upload/delete/update operations here
    uploadCategoryImage: builder.mutation({
        query: (formData) => ({
          url: "/category-images/upload-category",
          method: "POST",
          body: formData,
        }),
        invalidatesTags: ["Category"],
      }),
      getCategoryImage: builder.mutation({
        query: (category_name) => ({
          url: `/category-images/category/${category_name}`,
          method: "GET",
          responseHandler: (response) => response.blob(),
        }),
        invalidatesTags: ["Category"],
      }),
      deleteCategoryImage: builder.mutation({
        query: (category_name) => ({
          url: `/category-images/delete-category`,
          method: "DELETE",
          body:  {category_name} ,
        }),
        invalidatesTags: ["Category"],
      }),
      updateCategoryImage: builder.mutation({
        query: ({ id, formData }) => ({
          url: `/category-images/update-category/${id}`,
          method: "PUT",
          body: formData,
        }),
        invalidatesTags: ["Category"],
      }),
  }),
});

export const {

  useUploadCategoryImageMutation,
  useDeleteCategoryImageMutation,
  useUpdateCategoryImageMutation,
  useGetCategoryImageMutation
} = CategoryImageApi;
