import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

export const PermissionRequestApi = createApi({
  reducerPath: 'permissionRequestApi',
  baseQuery: fetchBaseQuery({ baseUrl: import.meta.env.VITE_API_URL }),
  tagTypes: ['PermissionRequest'],
  endpoints: (builder) => ({
    // Get all Permission Requests (with pagination)
    getPermissionRequests: builder.query({
      query: ({ filter = 'all', page = 1, limit = 10 ,adminId}) => {
        const filterQuery = filter !== 'all' ? `&filter=${filter}` : '';
        return `/permission-requests/fetch-all-permission-requests?adminId=${adminId}&page=${page}&limit=${limit}${filterQuery}`;
      },
      providesTags: ['PermissionRequest'],
    }),

    // Create new Permission Request
    createPermissionRequest: builder.mutation({
      query: ({id,...data}) => ({
        url: `/permission-requests/create-permission-request/${id}`,
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['PermissionRequest'],
    }),

    // Update Permission Request
    updatePermissionRequest: builder.mutation({
      query: ({ id, ...data }) => ({
        url: `/permission-requests/update-permission-request/${id}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: ['PermissionRequest'],
    }),

    // Delete Permission Request
    deletePermissionRequest: builder.mutation({
      query: (id) => ({
        url: `/permission-requests/delete-permission-request/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['PermissionRequest'],
    }),


    // permission select api
    getPermissions: builder.query({
        query: () => `/permissions/fetched-all-permissions`,
        providesTags: ['PermissionRequest'],
      }),

      // markNotificationAsRead: builder.mutation({
      //   query: (id) => ({
      //     url: `/permission-requests/mark-as-read/${id}`,
      //     method: 'PATCH',
      //   }),
      //   invalidatesTags: ['PermissionRequests'],
      // }),
      // markAllNotificationsAsRead: builder.mutation({
      //   query: (userId) => ({
      //     url: `/permission-requests/mark-all-as-read/${userId}`,
      //     method: 'PATCH',
      //   }),
      //   invalidatesTags: ['PermissionRequests'],
      // }),

      // getPermissionRequestsMapping: builder.query({
      //   query: ({ filter = 'all', page = 1, limit = 10 ,adminId}) => {
      //     const filterQuery = filter !== 'all' ? `&filter=${filter}` : '';
      //     return `/permission-requests/fetch-all-permission-requests-mapping?adminId=${adminId}&page=${page}&limit=${limit}${filterQuery}`;
      //   },
      //   providesTags: ['PermissionRequest'],
      // }),
      markNotificationAsRead: builder.mutation({
        query: ({ permissionRequestId, adminId }) => ({
          url: `/permission-request-read-mapping/mark-as-read`,
          method: 'POST',
          body: { permissionRequestId, adminId },
        }),
        invalidatesTags: ['PermissionRequests'],
      }),

      markAllNotificationsAsRead: builder.mutation({
        query: (adminId) => ({
          url: `/permission-request-read-mapping/mark-all-as-read`,
          method: 'POST',
          body: { adminId },
        }),
        invalidatesTags: ['PermissionRequests'],
      }),

      deletePermissionRequestMapping: builder.mutation({
        query: ({permissionRequestId,adminId}) => ({
          url: `/permission-request-read-mapping/mark-as-delete/${permissionRequestId}/${adminId}`,
          method: 'DELETE',
        }),
        invalidatesTags: ['PermissionRequest'],
      }),


  }),
});

export const {
  useGetPermissionRequestsQuery,
  useGetPermissionsQuery,
  useMarkNotificationAsReadMutation,
  // useGetPermissionRequestsMappingQuery,
  useDeletePermissionRequestMappingMutation,
  useMarkAllNotificationsAsReadMutation,
  useCreatePermissionRequestMutation,
  useUpdatePermissionRequestMutation,
  useDeletePermissionRequestMutation,
} = PermissionRequestApi;
