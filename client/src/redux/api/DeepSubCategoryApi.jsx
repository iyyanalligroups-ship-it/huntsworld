import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

export const DeepSubCategoryApi = createApi({
  reducerPath: "deepSubCategoryApi",
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
  tagTypes: ["DeepSubCategory"],
  endpoints: (builder) => ({
    // 1. Get paginated deep sub-categories with optional search
    getDeepSubCategories: builder.query({
      query: ({ page = 1, search = "" }) =>
        `/deep-sub-categories/fetch-all-deep-sub-category?page=${page}&search=${search}`,
      providesTags: ["DeepSubCategory"],
    }),

    // 2. Get deep sub-category by ID
    getDeepSubCategoryById: builder.query({
      query: (id) => `/deep-sub-categories/fetch-deep-sub-category-by-id/${id}`,
    }),

    // 3. Create deep sub-category
    createDeepSubCategory: builder.mutation({
      query: (data) => ({
        url: `/deep-sub-categories/create-deep-sub-category`,
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["DeepSubCategory"],
    }),

    // 4. Update deep sub-category
    updateDeepSubCategory: builder.mutation({
      query: ({ id, ...body }) => ({
        url: `/deep-sub-categories/update-deep-sub-category/${id}`,
        method: "PUT",
        body,
      }),
      invalidatesTags: ["DeepSubCategory"],
    }),

    // 5. Delete deep sub-category
    deleteDeepSubCategory: builder.mutation({
      query: (id) => ({
        url: `/deep-sub-categories/delete-deep-sub-category/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["DeepSubCategory"],
    }),

    // 6. Get categories for dropdown
    getCategories: builder.query({
      query: () => `/categories/fetch-all-category-for-super-sub-category`,
      transformResponse: (response) => response.data,
      providesTags: ["DeepSubCategory"],
    }),

    // 7. Get sub-categories for dropdown
    getSubCategories: builder.query({
      query: () =>
        `/sub-categories/fetch-all-sub-category-for-super-sub-category`,
      transformResponse: (response) => response.data,
      providesTags: ["DeepSubCategory"],
    }),

    // Optional: Get super sub-categories for dropdown
    getSuperSubCategories: builder.query({
      query: () =>
        `/super-sub-categories/fetch-all-super-sub-category-deep-sub-category`,
      transformResponse: (response) => response.data,
      providesTags: ["DeepSubCategory"],
    }),
  }),
});

export const {
  useGetDeepSubCategoriesQuery,
  useGetDeepSubCategoryByIdQuery,
  useCreateDeepSubCategoryMutation,
  useUpdateDeepSubCategoryMutation,
  useDeleteDeepSubCategoryMutation,
  useGetCategoriesQuery,
  useGetSubCategoriesQuery,
  useGetSuperSubCategoriesQuery,
} = DeepSubCategoryApi;
