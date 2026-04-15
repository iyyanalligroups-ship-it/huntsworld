import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

export const CategoryApi = createApi({
  reducerPath: "categoryApi",
  baseQuery: fetchBaseQuery({
    baseUrl: import.meta.env.VITE_API_URL, prepareHeaders: (headers) => {
      const token = sessionStorage.getItem("token");
      if (token) {
        headers.set("Authorization", `Bearer ${token}`);
      }
      return headers;
    },
  }),
  tagTypes: ["Category", "Product", "Favorite"],

  endpoints: (builder) => ({
    getCategories: builder.query({
      query: ({ page = 1, limit = 10, search = "" }) =>
        `/categories/fetch-all-category?page=${page}&limit=${limit}&search=${search}`,
      transformResponse: (response) => response,
      providesTags: ["Category"],
    }),
    createCategory: builder.mutation({
      query: (data) => ({
        url: "/categories/create-category",
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["Category"],
    }),
    updateCategory: builder.mutation({
      query: ({ id, ...data }) => ({
        url: `/categories/update-category/${id}`,
        method: "PUT",
        body: data,
      }),
      invalidatesTags: ["Category"],
    }),
    deleteCategory: builder.mutation({
      query: (id) => ({
        url: `/categories/delete-category/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Category"],
    }),
    getTopCategories: builder.query({
      query: () =>
        `/categories/fetch-top-categories`,
      transformResponse: (response) => response,
      providesTags: ["Category"],
    }),
    getTopSubCategories: builder.query({
      query: () =>
        `/categories/fetch-top-sub-categories`,
      transformResponse: (response) => response,
      providesTags: ["Category"],
    }),
    getTopProducts: builder.infiniteQuery({

      query: ({ pageParam = 1, queryArg: { limit = 10 } }) =>
        `/categories/fetch-top-products?page=${pageParam}&limit=${limit}`,
      providesTags: ['Product'],
      infiniteQueryOptions: {
        initialPageParam: 1,
        getNextPageParam: (lastPage, allPages, lastPageParam) => {
          if (!lastPage?.pagination?.hasMore) return undefined;
          return lastPageParam + 1;
        },

      },
      serializeQueryArgs: ({ endpointName }) => endpointName,
    }),

    getCategoryByName: builder.query({
      query: ({ category_name, page = 1, country }) =>
        country
          ? `/categories/fetch-categories-by-country-name/${country}/${category_name}?page=${page}`
          : `/categories/fetch-categories-by-name/${category_name}?page=${page}`,
      transformResponse: (response) => response,
      providesTags: ['Category'],
    }),
    getSubCategoryByName: builder.query({
      query: ({ sub_category_name, page = 1 }) =>
        `/categories/fetch-sub-categories-by-name/${sub_category_name}?page=${page}`,
      transformResponse: (response) => response,
      providesTags: ["Category"],
    }),
    getSubCategoryByCountryName: builder.query({
      query: ({ sub_category_name, country, page = 1 }) =>
        `/categories/fetch-sub-categories-by-country-name/${country}/${sub_category_name}?page=${page}`,
      transformResponse: (response) => response,
      providesTags: ["Category"],
    }),

    // getDeepSubProductsByName: builder.query({
    //   query: ({
    //     modelName = "deep-sub-category",
    //     sub_category_name,
    //     city,
    //     lat,
    //     lng,
    //     searchLocation,
    //     page = 1,
    //     type, // 1. ADD 'type' HERE
    //   }) => {
    //     const params = new URLSearchParams();
    //     if (city) params.append("city", city);
    //     if (lat && lng) {
    //       params.append("lat", lat);
    //       params.append("lng", lng);
    //     }
    //     if (searchLocation) params.append("searchLocation", searchLocation);

    //     // 2. APPEND THE TYPE TO THE QUERY PARAMS
    //     if (type && type !== "products") {
    //       params.append("type", type);
    //     }

    //     params.append("page", page);

    //     return `/categories/fetch-deep-sub-category-products/${modelName}/${sub_category_name}?${params.toString()}`;
    //   },
    //   transformResponse: (response) => response,
    //   providesTags: ["Category"],
    // })
    getDeepSubProductsByName: builder.query({
      query: ({
        modelName = "deep-sub-category",
        sub_category_name,
        city,
        lat,
        lng,
        searchLocation,
        page = 1,
        type,
        limit = 6, // 1. ADD limit HERE (Default to 6)
      }) => {
        const params = new URLSearchParams();

        // Add optional parameters if they exist
        if (city) params.append("city", city);
        if (lat && lng) {
          params.append("lat", lat);
          params.append("lng", lng);
        }
        if (searchLocation) params.append("searchLocation", searchLocation);

        // Add type if it's not the default "products"
        if (type && type !== "products") {
          params.append("type", type);
        }

        // Always add page and limit
        params.append("page", page);
        params.append("limit", limit); // 2. SEND limit TO BACKEND

        return `/categories/fetch-deep-sub-category-products/${modelName}/${sub_category_name}?${params.toString()}`;
      },
      transformResponse: (response) => response,
      providesTags: ["Category"],
    }),

  }),
});

export const {
  useGetCategoriesQuery,
  useGetTopCategoriesQuery,
  useGetSubCategoryByCountryNameQuery,
  useGetSubCategoryByNameQuery,
  useGetDeepSubProductsByNameQuery,
  useGetCategoryByNameQuery,
  useGetTopProductsInfiniteQuery,
  useGetTopSubCategoriesQuery,
  useCreateCategoryMutation,
  useUpdateCategoryMutation,
  useDeleteCategoryMutation,

} = CategoryApi;
