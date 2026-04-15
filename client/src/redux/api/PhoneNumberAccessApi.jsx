import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

export const PhoneNumberAccessApi = createApi({
  reducerPath: 'phoneNumberAccessApi',

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

  tagTypes: ["PhoneNumberAccess"],

  endpoints: (builder) => ({

    // Request Access
    requestPhoneNumberAccess: builder.mutation({
      query: (data) => ({
        url: '/phone-number-access/request',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: [{ type: 'PhoneNumberAccess', id: 'LIST' }],
    }),

    // Approve
    approvePhoneNumberAccess: builder.mutation({
      query: (data) => ({
        url: '/phone-number-access/approve',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: (result, error, arg) => [
        { type: 'PhoneNumberAccess', id: arg.request_id },
        { type: 'PhoneNumberAccess', id: 'LIST' },
      ],
    }),

    // Reject
    rejectPhoneNumberAccess: builder.mutation({
      query: (data) => ({
        url: '/phone-number-access/reject',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: (result, error, arg) => [
        { type: 'PhoneNumberAccess', id: arg.request_id },
        { type: 'PhoneNumberAccess', id: 'LIST' },
      ],
    }),

    // Seller List – this is the important one for the notifications page
    getPhoneNumberAccessRequests: builder.query({
      query: ({ seller_id, page = 1, limit = 10 }) =>
        `/phone-number-access/seller/${seller_id}?page=${page}&limit=${limit}`,

      providesTags: (result) =>
        result?.data
          ? [
              ...result.data.map(({ _id }) => ({
                type: 'PhoneNumberAccess',
                id: _id,
              })),
              { type: 'PhoneNumberAccess', id: 'LIST' },
            ]
          : [{ type: 'PhoneNumberAccess', id: 'LIST' }],
    }),

    // Mark Read
    markNotificationAsRead: builder.mutation({
      query: (data) => ({
        url: '/phone-number-access/mark-read',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: (result, error, arg) => [
        { type: 'PhoneNumberAccess', id: arg.request_id },
      ],
    }),

    // Delete – merchant specific route
    deleteMerchantPhoneRequest: builder.mutation({
      query: (requestId) => ({
        url: `/phone-number-access/merchant-delete-request/${requestId}`,
        method: 'DELETE',
      }),
      invalidatesTags: (result, error, requestId) => [
        { type: 'PhoneNumberAccess', id: requestId },
        { type: 'PhoneNumberAccess', id: 'LIST' },
      ],
    }),

    // Request Detail
    getPhoneNumberAccessRequestDetails: builder.query({
      query: (id) =>
        `/phone-number-access/phone-number-request-detail/${id}`,

      providesTags: (result, error, id) => [
        { type: 'PhoneNumberAccess', id },
      ],
    }),

    // (optional) general delete
    deletePhoneNumberAccessRequest: builder.mutation({
      query: (requestId) => ({
        url: `/phone-number-access/requests/${requestId}`,
        method: 'DELETE',
      }),
      invalidatesTags: (result, error, requestId) => [
        { type: 'PhoneNumberAccess', id: requestId },
        { type: 'PhoneNumberAccess', id: 'LIST' },
      ],
    }),

  }),
});

export const {
  useRequestPhoneNumberAccessMutation,
  useGetPhoneNumberAccessRequestDetailsQuery,
  useApprovePhoneNumberAccessMutation,
  useRejectPhoneNumberAccessMutation,
  useGetPhoneNumberAccessRequestsQuery,
  useMarkNotificationAsReadMutation,
  useDeleteMerchantPhoneRequestMutation,
  useDeletePhoneNumberAccessRequestMutation,
} = PhoneNumberAccessApi;
