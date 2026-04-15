// redux/api/FavoriteApi.js
import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

export const favoriteApi = createApi({
  reducerPath: "favoriteApi",
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
  tagTypes: ["Favorite", "Product"],
  endpoints: (builder) => ({
    toggleFavorite: builder.mutation({
      query: ({ productId }) => ({
        url: `/favorite-products/add-favorite-specific-user`,
        method: "POST",
        body: { productId },
      }),
      invalidatesTags: ["Favorite", "Product"], // 🔥 Also invalidate Product for trending sync
    }),
    getFavoritesByUser: builder.query({
      query: (userId) => `/favorite-products/fetch-favorite-product-by-user/${userId}`,
      providesTags: ["Favorite"],
    }),
    getFavoritesUsers: builder.query({
      query: (userId) => `/favorite-products/favorite-products/${userId}`,
      providesTags: ["Favorite"],
    }),
    removeFavorite: builder.mutation({
      query: (favoriteId) => ({
        url: `/favorite-products/delete-favorite-products-by-id/${favoriteId}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Favorite'],
    }),

  }),
});

export const {

  useToggleFavoriteMutation,
  useGetFavoritesByUserQuery,
  useRemoveFavoriteMutation,
  useGetFavoritesUsersQuery
} = favoriteApi;
