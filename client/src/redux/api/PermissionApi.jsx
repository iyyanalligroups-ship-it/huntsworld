import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

export const PermissionApi = createApi({
  reducerPath: 'permissionApi',
  baseQuery: fetchBaseQuery({ baseUrl: import.meta.env.VITE_API_URL}),
  tagTypes: ['Permission'],
  endpoints: (builder) => ({
    getPermissions: builder.query({
      query: () => '/permissions/fetched-all-permissions',
      providesTags: ['Permission']
    }),
    createPermission: builder.mutation({
      query: (data) => ({
        url: '/permissions/create-permission',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Permission']
    }),
    updatePermission: builder.mutation({
      query: ({ id, ...data }) => ({
        url: `/permissions/update-permission/${id}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: ['Permission']
    }),
    deletePermission: builder.mutation({
      query: (id) => ({
        url: `/permissions/delete-permission/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Permission']
    }),
  })
});

export const {
  useGetPermissionsQuery,
  useCreatePermissionMutation,
  useUpdatePermissionMutation,
  useDeletePermissionMutation
} = PermissionApi;
