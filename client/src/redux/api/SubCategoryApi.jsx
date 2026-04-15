import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

export const SubCategoryApi = createApi({
  reducerPath: "subCategoryApi",
  baseQuery: fetchBaseQuery({ baseUrl: import.meta.env.VITE_API_URL , prepareHeaders: (headers) => {
    const token = sessionStorage.getItem("token");
    if (token) {
      headers.set("Authorization", `Bearer ${token}`);
    }
    return headers;
  },}),
  tagTypes: ["SubCategory"],
  endpoints: (builder) => ({
    getSubCategories: builder.query({
      query: ({ page = 1, limit = 10, search = "" }) =>
        `/sub-categories/fetch-all-sub-category?page=${page}&limit=${limit}&search=${search}`,
      providesTags: ["SubCategory"],
    }),
    
    createSubCategory: builder.mutation({
      query: (data) => ({
        url: "/sub-categories/create-sub-category",
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["SubCategory"],
    }),
    updateSubCategory: builder.mutation({
      query: ({ id, ...data }) => ({
        url: `/sub-categories/update-sub-category/${id}`,
        method: "PUT",
        body: data,
      }),
      invalidatesTags: ["SubCategory"],
    }),
    deleteSubCategory: builder.mutation({
      query: (id) => ({
        url: `/sub-categories/delete-sub-category/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["SubCategory"],
    }),

    getCategories: builder.query({
      query: () => "/categories/fetch-all-category-for-super-sub-category",
      transformResponse: (response) => response.data,
      providesTags: ["SubCategory"],
    }),
  }),
});

export const {
  useGetSubCategoriesQuery,
  useGetCategoriesQuery,
  useCreateSubCategoryMutation,
  useUpdateSubCategoryMutation,
  useDeleteSubCategoryMutation,
} = SubCategoryApi;
