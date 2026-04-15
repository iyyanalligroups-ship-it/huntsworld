import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

export const SubCategoryImageApi = createApi({
  reducerPath: "subCategoryImageApi",
  baseQuery: fetchBaseQuery({ baseUrl: import.meta.env.VITE_API_IMAGE_URL }),
  tagTypes: ["SubCategory"],
  endpoints: (builder) => ({
  

    // image upload/delete/update operations here
    uploadSubCategoryImage: builder.mutation({
        query: (formData) => ({
          url: "/subCategory-images/upload-sub-category",
          method: "POST",
          body: formData,
        }),
        invalidatesTags: ["SubCategory"],
      }),
      getSubCategoryImage: builder.mutation({
        query: (category_name) => ({
          url: `/subCategory-images/sub-category/${category_name}`,
          method: "GET",
          responseHandler: (response) => response.blob(),
        }),
        invalidatesTags: ["SubCategory"],
      }),
      deleteSubCategoryImage: builder.mutation({
        query: (sub_category_name) => ({
          url: `/subCategory-images/delete-sub-category`,
          method: "DELETE",
          body:  {sub_category_name} ,
        }),
        invalidatesTags: ["SubCategory"],
      }),
      updateSubCategoryImage: builder.mutation({
        query: ({ id, formData }) => ({
          url: `/subCategory-images/update-sub-category/${id}`,
          method: "PUT",
          body: formData,
        }),
        invalidatesTags: ["SubCategory"],
      }),
  }),
});

export const {

  useUploadSubCategoryImageMutation,
  useDeleteSubCategoryImageMutation,
  useUpdateSubCategoryImageMutation,
  useGetSubCategoryImageMutation
} = SubCategoryImageApi;
