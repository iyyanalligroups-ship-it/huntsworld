import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { CategoryApi } from "./CategoryApi";

export const ProductApi = createApi({
  reducerPath: "productApi",
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
  tagTypes: ["Product", "Review", "BuyLeads"],
  endpoints: (builder) => ({
    getProducts: builder.query({
      query: ({ page = 1, limit = 10, filter = "", search = "", user_id }) => {
        const params = new URLSearchParams({
          page: page.toString(),
          limit: limit.toString(),
          search,
          filter,
          user_id: user_id || "",
        });
        return `/products/fetch-all-products?${params.toString()}`;
      },
      transformResponse: (response) => response,
      providesTags: ["Product"],
    }),

    getUserSellerProductsById: builder.query({
      query: ({ page = 1, limit = 10, filter = "", search = "", userId }) => {
        const params = new URLSearchParams({
          page: page.toString(),
          limit: limit.toString(),
          search,
          filter,
        });
        return `/products/fetch-all-products-for-seller-by-id/${userId}?${params.toString()}`;
      },
      transformResponse: (response) => response,
      providesTags: ["Product"],
    }),

    getAllUserSellerProductsById: builder.query({
      query: ({ page = 1, limit = 10, filter = "", search = "", userId }) => {
        const params = new URLSearchParams({
          page: page.toString(),
          limit: limit.toString(),
          search,
          filter,
        });
        return `/products/fetch-all-products-by-seller-id/${userId}?${params.toString()}`;
      },
      transformResponse: (response) => response,
      providesTags: ["Product"],
    }),

    getAllUserServiceProviderProductsById: builder.query({
      query: ({ page = 1, limit = 10, filter = "", search = "", userId }) => {
        const params = new URLSearchParams({
          page: page.toString(),
          limit: limit.toString(),
          search,
          filter,
        });
        return `/products/fetch-all-products-by-service-provider-user-id/${userId}?${params.toString()}`;
      },
      transformResponse: (response) => response,
      providesTags: ["Product"],
    }),

    getAllProducts: builder.query({
      query: ({ skip = 0, limit = 10 }) => `/products/show-in-product-wise?skip=${skip}&limit=${limit}`,
      providesTags: ["Product"],
    }),

    giveTrendingPoint: builder.mutation({
      query: ({ user_id, product_id }) => ({
        url: "/trending-point/create-trending-points",
        method: "POST",
        body: { user_id, product_id },
      }),
      // 🔥 Invalidate BOTH ProductApi and CategoryApi Product tags
      async onQueryStarted(args, { dispatch, queryFulfilled }) {
        try {
          await queryFulfilled;
          // Invalidate ProductApi Product tag
          dispatch(ProductApi.util.invalidateTags(["Product"]));
          // Invalidate CategoryApi Product tag (for PopularProduct)
          dispatch(CategoryApi.util.invalidateTags(["Product"]));
        } catch (err) {
          console.error("Trending point error:", err);
        }
      },
    }),
    addTrendingForFavorite: builder.mutation({
      query: ({ user_id, product_id }) => ({
        url: "/trending-point/create-trending-points-for-favorite",
        method: "POST",
        body: { user_id, product_id },
      }),
      // 🔥 Invalidate BOTH ProductApi and CategoryApi Product tags
      async onQueryStarted(args, { dispatch, queryFulfilled }) {
        try {
          await queryFulfilled;
          // Invalidate ProductApi Product tag
          dispatch(ProductApi.util.invalidateTags(["Product"]));
          // Invalidate CategoryApi Product tag (for PopularProduct)
          dispatch(CategoryApi.util.invalidateTags(["Product"]));
        } catch (err) {
          console.error("Favorite trending point error:", err);
        }
      },
    }),
    createProduct: builder.mutation({
      query: (data) => ({
        url: "/products/create-products",
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["Product"],
    }),

    updateProduct: builder.mutation({
      query: ({ id, ...data }) => ({
        url: `/products/update-products/${id}`,
        method: "PUT",
        body: data,
      }),
      invalidatesTags: ["Product"],
    }),

    deleteProduct: builder.mutation({
      query: (id) => ({
        url: `/products/delete-products/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Product"],
    }),

    getMerchantByEmailOrPhone: builder.query({
      query: ({ email, page = 1, limit = 10 }) =>
        `/merchants/fetch-all-merchant-products?email=${email}&page=${page}&limit=${limit}`,
      providesTags: ["Product"],
    }),

    getCategories: builder.query({
      query: () => "/categories/fetch-all-category-for-super-sub-category",
      providesTags: ["Product"],
    }),

    getSubCategories: builder.query({
      query: (categoryId) =>
        `/sub-categories/fetch-all-sub-category-for-super-sub-category?category=${categoryId}`,
      providesTags: ["Product"],
    }),

    getSuperSubCategories: builder.query({
      query: (subCategoryId) =>
        `/super-sub-categories/fetch-all-super-sub-category-deep-sub-category?subCategory=${subCategoryId}`,
      providesTags: ["Product"],
    }),

    getDeepSubCategories: builder.query({
      query: (superSubCategoryId) =>
        `/deep-sub-categories/fetch-all-deep-sub-category-for-product?superSubCategory=${superSubCategoryId}`,
      providesTags: ["Product"],
    }),

    getProductByName: builder.query({
      query: ({ productId }) => `/products/fetch-product-by-id/${productId}`,
      providesTags: ["Product"],
    }),

    createProductQuote: builder.mutation({
      query: (quoteData) => ({
        url: "/products/create-products",
        method: "POST",
        body: quoteData,
      }),
      invalidatesTags: ["Product"],
    }),

    getReviewsByProduct: builder.query({
      query: (productId) => `/reviews/fetch-all-reviews-by-product/${productId}`,
      transformResponse: (response) => {
        const reviews = response || [];
        const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
        const averageRating = reviews.length > 0 ? (totalRating / reviews.length).toFixed(1) : 0;
        return { reviews, averageRating: parseFloat(averageRating) };
      },
      providesTags: ["Review"],
    }),

    createReview: builder.mutation({
      query: ({ userId, productId, rating, comments }) => ({
        url: "/reviews/create-review",
        method: "POST",
        body: { userId, productId, rating, comments },
      }),
      invalidatesTags: ["Review"],
    }),

    getReviewById: builder.query({
      query: (id) => `/reviews/fetch-review-by-id/${id}`,
      providesTags: ["Review"],
    }),

    updateReview: builder.mutation({
      query: ({ id, rating, comments }) => ({
        url: `/reviews/update-review-by-id/${id}`,
        method: "PUT",
        body: { rating, comments },
      }),
      invalidatesTags: ["Review"],
    }),

    deleteReview: builder.mutation({
      query: (id) => ({
        url: `/reviews/delete-review-by-id/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Review"],
    }),

    getMerchantByUserId: builder.query({
      query: (userId) => `/products/merchant-info-by-user-id/${userId}`,
      providesTags: ["Product"],
    }),

    verifyProduct: builder.mutation({
      query: (id) => ({
        url: `/products/${id}/verify`,
        method: "PUT",
      }),
      invalidatesTags: ["Product"],
    }),

    getSuggestions: builder.query({
      query: ({ term = "", category = "", city = "" } = {}) => {
        const params = new URLSearchParams();
        params.append("category", category);
        if (term?.trim()) params.append("term", term.trim());
        if (city?.trim()) params.append("city", city.trim());

        return `/products/get-suggestion?${params.toString()}`;
      },
      transformResponse: (response) => {
        // Correctly extract suggestions and message from the object response
        return {
          suggestions: response.suggestions || [],
          message: response.message || null
        };
      },
    }),

    searchProducts: builder.query({
      query: ({ term = "", city = "", page = 1, limit = 10 }) => {
        const params = new URLSearchParams({
          page: page.toString(),
          limit: limit.toString(),
        });

        if (term?.trim()) params.append("term", term.trim());
        if (city?.trim()) params.append("city", city.trim());

        return `/products/get-products?${params.toString()}`;
      },
    }),

    searchCompanies: builder.query({
      query: ({ term = "", city = "", type = "", page = 1, limit = 10 }) => {
        const params = new URLSearchParams({
          page: page.toString(),
          limit: limit.toString(),
        });

        if (type) params.append("type", type);
        if (term?.trim()) params.append("term", term.trim());
        if (city?.trim()) params.append("city", city.trim());

        return `/products/get-company?${params.toString()}`;
      },
    }),

    createBuyLead: builder.mutation({
      query: ({ searchTerm = "", type = "", user_id, city = "", category_id = null, sub_category_id = null }) => ({
        url: "/buy-leads/create-buylead",
        method: "POST",
        body: {
          searchTerm: searchTerm.trim(),
          type,
          user_id,
          city: city.trim(),
          category_id,
          sub_category_id
        },
      }),
    }),
    getTopListingSellerProducts: builder.query({
      query: (page = 1) => `/top-listing-plan-payment/seller-products?page=${page}&limit=20`,
      providesTags: ["Product"],
    }),
    getBuyLeads: builder.query({
      query: ({ page = 1, limit = 10 }) =>
        `/buy-leads/get-buyleads?page=${page}&limit=${limit}`,
      keepUnusedDataFor: 60,
      providesTags: (result, error, { page }) => [{ type: "BuyLeads", id: page }],
    }),
  }),
});

export const {
  useGetBuyLeadsQuery,
  useCreateBuyLeadMutation,
  useGetSuggestionsQuery,
  useSearchCompaniesQuery,
  useSearchProductsQuery,
  useGetProductsQuery,
  useGetUserSellerProductsByIdQuery,
  useGetAllUserSellerProductsByIdQuery,
  useGetAllUserServiceProviderProductsByIdQuery,
  useGetAllProductsQuery,
  useGetMerchantByUserIdQuery,
  useCreateProductMutation,
  useAddTrendingForFavoriteMutation,
  useGiveTrendingPointMutation,
  useGetProductByNameQuery,
  useUpdateProductMutation,
  useCreateProductQuoteMutation,
  useDeleteProductMutation,
  useGetMerchantByEmailOrPhoneQuery,
  useLazyGetMerchantByEmailOrPhoneQuery,
  useGetCategoriesQuery,
  useGetSubCategoriesQuery,
  useGetSuperSubCategoriesQuery,
  useGetDeepSubCategoriesQuery,
  useGetReviewsByProductQuery,
  useCreateReviewMutation,
  useGetReviewByIdQuery,
  useUpdateReviewMutation,
  useDeleteReviewMutation,
  useVerifyProductMutation,
  useGetTopListingSellerProductsQuery
} = ProductApi;
