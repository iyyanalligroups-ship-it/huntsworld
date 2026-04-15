import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

export const SuperSubCategoryApi = createApi({
  reducerPath: "superSubCategoryApi",
  baseQuery: fetchBaseQuery({ baseUrl: import.meta.env.VITE_API_URL }),
  tagTypes: ["SuperSubCategory"],
  endpoints: (builder) => ({
    // Get paginated super sub-categories
    getSuperSubCategories: builder.query({
      query: (page = 1) => `/super-sub-categories/fetch-all-super-sub-category?page=${page}`,
    //   transformResponse: (response) => response.data,
      providesTags: ["SuperSubCategory"],
    }),

    // Get by ID
    getSuperSubCategoryById: builder.query({
      query: (id) => `/super-sub-categories/fetch-super-sub-category-by-id/${id}`,
    }),

    // Add
    createSuperSubCategory: builder.mutation({
      query: (data) => ({
        url: "/super-sub-categories/create-super-sub-category",
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["SuperSubCategory"],
    }),

    // Update
    updateSuperSubCategory: builder.mutation({
      query: ({ id, ...body }) => ({
        url: `/super-sub-categories/update-super-sub-category/${id}`,
        method: "PUT",
        body,
      }),
      invalidatesTags: ["SuperSubCategory"],
    }),

    // Delete
    deleteSuperSubCategory: builder.mutation({
      query: (id) => ({
        url: `/super-sub-categories/delete-super-sub-category/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["SuperSubCategory"],
    }),

    // Get all categories and sub-categories for super sub-categories dropdowns
    getCategories: builder.query({
      query: () => `/categories/fetch-all-category-for-super-sub-category`,
      transformResponse: (response) => response.data,
      providesTags: ["SuperSubCategory"],
    }),
    getSubCategories: builder.query({
      query: () =>
        `/sub-categories/fetch-all-sub-category-for-super-sub-category`,
      transformResponse: (response) => response.data,
      providesTags: ["SuperSubCategory"],
    }),
  }),
});

export const {
  useGetSuperSubCategoriesQuery,
  useGetSuperSubCategoryByIdQuery,
  useCreateSuperSubCategoryMutation,
  useUpdateSuperSubCategoryMutation,
  useDeleteSuperSubCategoryMutation,
  useGetCategoriesQuery,
  useGetSubCategoriesQuery,
} = SuperSubCategoryApi;
