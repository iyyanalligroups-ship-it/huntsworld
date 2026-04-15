import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

export const PostByRequirementApi = createApi({
  reducerPath: "postByRequirementApi",
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
  tagTypes: ["PostByRequirement"],
  endpoints: (builder) => ({
    getPostByRequirements: builder.query({
      query: ({ user_id }) => `/post-by-requirement/fetch-all-post-requirement-user-id/${user_id}`,
      providesTags: ["PostByRequirement"],
    }),


    getPostByRequirementsByLocation: builder.query({

      query: ({ user_id, page = 1, limit = 10 }) => ({
        url: `/post-by-requirement/fetch-all-post-requirement-by-location/${user_id}`,
        params: { page, limit },
      }),
      providesTags: ["PostByRequirement"],
    }),
    createPostByRequirement: builder.mutation({
      query: (data) => ({
        url: "/post-by-requirement/create-post-by-requirement",
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["PostByRequirement"],
    }),
    updatePostByRequirement: builder.mutation({
      query: ({ id, ...updatedData }) => ({
        url: `/post-by-requirement/update-post-requirement/${id}`,
        method: "PUT",
        body: updatedData,
      }),
      invalidatesTags: ["PostByRequirement"],
    }),
    deletePostByRequirement: builder.mutation({
      query: (id) => ({
        url: `/post-by-requirement/delete-post-requirement/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["PostByRequirement"],
    }),

    getAllPostByRequirements: builder.query({
      query: ({ page, limit }) => ({
        url: '/post-by-requirement/fetch-all-post-requirement-for-chat',
        params: { page, limit },
      }),
    }),

    getAddressesForPostByRequirement: builder.query({
      query: () => '/address/fetch-all-address-for-post-by-requirement',
      transformResponse: (response) => {
        // Extract unique state names from the response
        const states = [...new Set(response.map(address => address.state))].filter(Boolean);
        return states;
      },
    }),
    getMerchantAddress: builder.query({
      query: () => "/address/fetch-all-address-for-post-by-requirement",
      providesTags: ["PostByRequirement"],
    }),

  }),
});

export const {
  useGetPostByRequirementsQuery,
  useGetMerchantAddressQuery,
  useGetPostByRequirementsByLocationQuery,
  useGetAllPostByRequirementsQuery,
  useGetAddressesForPostByRequirementQuery,
  useCreatePostByRequirementMutation,
  useUpdatePostByRequirementMutation,
  useDeletePostByRequirementMutation,
} = PostByRequirementApi;
