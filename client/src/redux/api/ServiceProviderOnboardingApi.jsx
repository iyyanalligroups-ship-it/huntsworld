import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

export const ServiceProviderOnboardingApi = createApi({
  reducerPath: 'serviceProviderOnboardingApi',
  baseQuery: fetchBaseQuery({ baseUrl: import.meta.env.VITE_API_URL }),
  endpoints: (builder) => ({
    getRoles: builder.query({
      query: () => 'role/fetch-all-role',
    }),
    lookupUser: builder.query({
      query: (searchQuery) => `users/lookup?name=${encodeURIComponent(searchQuery)}`,
    }),
    updateUserRole: builder.mutation({
      query: (data) => ({
        url: 'users/update-role-by-user-id',
        method: 'PUT',
        body:{data},
      }),
    }),
    createAddress: builder.mutation({
      query: (body) => ({
        url: 'address/create-address',
        method: 'POST',
        body,
      }),
    }),
    createServiceProvider: builder.mutation({
      query: (body) => ({
        url: 'service-providers/create-service-providers',
        method: 'POST',
        body,
      }),
    }),
  }),
});

export const {
  useGetRolesQuery,
  useLazyLookupUserQuery,
  useUpdateUserRoleMutation,
  useCreateAddressMutation,
  useCreateServiceProviderMutation,
} = ServiceProviderOnboardingApi;
