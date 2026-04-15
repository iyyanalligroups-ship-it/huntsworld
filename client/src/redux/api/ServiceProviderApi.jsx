import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

export const ServiceProviderApi = createApi({
  reducerPath: "serviceProviderApi",
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
  tagTypes: ["ServiceProvider"],
  endpoints: (builder) => ({
    getServiceProviders: builder.query({
      query: () => "/service-providers/fetch-all-service-providers",
      transformResponse: (response) => response.data,
      providesTags: ["ServiceProvider"],
    }),
    getServiceProviderById: builder.query({
      query: (id) => ({
        url: `/service-providers/fetch-by-id-service-providers/${id}`,
        method: "GET",
      }),
      transformResponse: (response) => response.data,
      providesTags: (result, error, id) => [{ type: "ServiceProvider", id }],
    }),
    getServiceProviderByUserId: builder.query({
      query: (userId) => `/service-providers/fetch-by-user-id/${userId}`,
      transformResponse: (response) => response.data,
      providesTags: ["ServiceProvider"],
    }),
    addServiceProvider: builder.mutation({
      query: (newProvider) => ({
        url: "/service-providers/create-service-providers",
        method: "POST",
        body: newProvider,
      }),
      invalidatesTags: ["ServiceProvider"],
    }),
    updateServiceProvider: builder.mutation({
      query: ({ id, updatedProvider }) => ({
        url: `/service-providers/update-service-providers/${id}`,
        method: "PUT",
        body: updatedProvider,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: "ServiceProvider", id },
        "ServiceProvider",
      ],
    }),
    deleteServiceProvider: builder.mutation({
      query: (id) => ({
        url: `/service-providers/delete-service-providers/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["ServiceProvider"],
    }),
    getServiceByEmailOrPhone: builder.query({
      query: ({ email, page = 1, limit = 10 }) =>
        `/service-providers/fetch-all-service-provider-products?email=${email}&page=${page}&limit=${limit}`,
      providesTags: ["Product"],
    }),
  }),
});

export const {
  useGetServiceProvidersQuery,
  useGetServiceProviderByIdQuery,
  useGetServiceProviderByUserIdQuery,
  useLazyGetServiceByEmailOrPhoneQuery,
  useGetServiceByEmailOrPhoneQuery,
  useAddServiceProviderMutation,
  useUpdateServiceProviderMutation,
  useDeleteServiceProviderMutation,
} = ServiceProviderApi;