import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

export const SubAdminAccessRequestApi = createApi({
  reducerPath: 'accessRequestApi',
  baseQuery: fetchBaseQuery({
    baseUrl: `${import.meta.env.VITE_API_URL}`,
    prepareHeaders: (headers) => {
      const token = sessionStorage.getItem("token");
      if (token) {
        headers.set("Authorization", `Bearer ${token}`);
      }
      return headers;
    },
  }),
  tagTypes: ['AccessRequests'],
  endpoints: (builder) => ({
    requestAccess: builder.mutation({
      query: (data) => ({
        url: '/subAdmin-request-access/request',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['AccessRequests'],
    }),
    approveAccess: builder.mutation({
      query: (data) => ({
        url: '/subAdmin-request-access/approve',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['AccessRequests'],
    }),
    rejectAccess: builder.mutation({
      query: (data) => ({
        url: '/subAdmin-request-access/reject',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['AccessRequests'],
    }),
    getAccessRequests: builder.query({
      query: () => '/subAdmin-request-access/fetch-request',
      providesTags: ['AccessRequests'],
    }),
    markNotificationAsRead: builder.mutation({
      query: (data) => ({
        url: '/subAdmin-request-access/mark-read',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['AccessRequests'],
    }),
    getUserById: builder.query({
      query: (user_id) => `/subAdmin-request-access/user/${user_id}`,
      providesTags: ['AccessRequests'],
    }),
    searchSubadmins: builder.query({
      query: (query) => ({
        url: '/subAdmin-request-access/search',
        params: { query },
      }),
      providesTags: ['AccessRequests'],
    }),
    // Get access requests for a specific subadmin
    getAccessRequestsBySubadminId: builder.query({
      query: ({ subadminId, page = 1, limit = 5 }) => 
        `/subAdmin-request-access/requests/${subadminId}?page=${page}&limit=${limit}`,
      providesTags: ['AccessRequests'],
    }),
    // Update an access request
    updateAccessRequest: builder.mutation({
      query: ({ request_id, approved_permissions }) => ({
        url: `/subAdmin-request-access/requests/${request_id}`,
        method: 'PUT',
        body: { approved_permissions },
      }),
      invalidatesTags: ['AccessRequests'],
    }),
    // Delete an access request
    deleteAccessRequest: builder.mutation({
      query: ({ request_id }) => ({
        url: `/subAdmin-request-access/requests/${request_id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['AccessRequests'],
    }),
  }),
});

export const {
  useSearchSubadminsQuery,
  useGetAccessRequestsBySubadminIdQuery,
  useUpdateAccessRequestMutation,
  useDeleteAccessRequestMutation,
  useRequestAccessMutation,
  useApproveAccessMutation,
  useRejectAccessMutation,
  useGetAccessRequestsQuery,
  useMarkNotificationAsReadMutation,
  useGetUserByIdQuery,
} = SubAdminAccessRequestApi;