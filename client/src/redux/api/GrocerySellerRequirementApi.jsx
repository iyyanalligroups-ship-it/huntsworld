import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

export const GrocerySellerRequirementApi = createApi({
  reducerPath: "grocerySellerRequirementApi",
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
  tagTypes: ["GrocerySellerRequirement"],
  endpoints: (builder) => ({
    getGrocerySellerRequirements: builder.query({
      query: ({ user_id }) => `/grocery-seller-requirement/fetch-all-grocery-seller-requirement-user-id/${user_id}`,
      providesTags: ["GrocerySellerRequirement"],
    }),
   

    getGrocerySellerRequirementsByLocation: builder.query({

      query: ({ user_id, page = 1, limit = 10 }) => ({
        url: `/grocery-seller-requirement/fetch-all-grocery-seller-requirement-by-location/${user_id}`,
        params: { page, limit },
      }),
      providesTags: ["GrocerySellerRequirement"],
    }),
    createGrocerySellerRequirement: builder.mutation({
      query: (data) => ({
        url: "/grocery-seller-requirement/create-grocery-seller-requirement",
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["GrocerySellerRequirement"],
    }),
    updateGrocerySellerRequirement: builder.mutation({
      query: ({ id, ...updatedData }) => ({
        url: `/grocery-seller-requirement/update-grocery-seller-requirement/${id}`,
        method: "PUT",
        body: updatedData,
      }),
      invalidatesTags: ["GrocerySellerRequirement"],
    }),
    deleteGrocerySellerRequirement: builder.mutation({
      query: (id) => ({
        url: `/grocery-seller-requirement/delete-grocery-seller-requirement/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["GrocerySellerRequirement"],
    }),
    getAllGrocerySellerRequirements: builder.query({
      query: ({ page, limit }) => ({
        url: '/grocery-seller-requirement/fetch-all-grocery-seller-requirement-for-chat',
        params: { page, limit },
      }),
    }),
    getAddressesForGrocerySellerRequirement: builder.query({
      query: () => '/address/fetch-all-address-for-grocery-seller-requirement',
      transformResponse: (response) => {
        // Extract unique state names from the response
        const states = [...new Set(response.map(address => address.state))].filter(Boolean);
        return states;
      },
    }),
    getMerchantAddress: builder.query({
      query: () => "/address/fetch-all-address-for-grocery-seller-requirement",
      providesTags: ["GrocerySellerRequirement"],
    }),

    getAllGrocerySellerDetails: builder.query({
      query: ({ page = 1, limit = 10 }) => ({
        url: '/grocery-seller-requirement/fetch-all-grocery-seller-requirement',
        params: { page, limit }
      })
    }),
    getSellerRequirementsByUserId: builder.query({
      query: ({ userId, page = 1, limit = 5 }) => ({
        url: `/grocery-seller-requirement/fetch-grocery-seller-requirement-by-user_id/${userId}`,
        params: { page, limit }
      })
    })

  }),
});

export const {
  useGetGrocerySellerRequirementsQuery,
  useGetMerchantAddressQuery,
  useGetSellerRequirementsByUserIdQuery,
  useLazyGetSellerRequirementsByUserIdQuery,
  useGetAllGrocerySellerDetailsQuery,
  useLazyGetAllGrocerySellerDetailsQuery,
  useGetGrocerySellerRequirementsByLocationQuery,
  useGetAllGrocerySellerRequirementsQuery,
  useGetAddressesForGrocerySellerRequirementQuery,
  useCreateGrocerySellerRequirementMutation,
  useUpdateGrocerySellerRequirementMutation,
  useDeleteGrocerySellerRequirementMutation,
} = GrocerySellerRequirementApi;
