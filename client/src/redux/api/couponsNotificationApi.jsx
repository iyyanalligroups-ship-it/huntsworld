import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

export const CouponsNotificationApi = createApi({
  reducerPath: 'couponsNotificationApi',
  baseQuery: fetchBaseQuery({ baseUrl: import.meta.env.VITE_API_URL }),
  tagTypes: ['Coupon', 'Notification', 'RedeemPoints', 'Merchant'],
  endpoints: (builder) => ({
    // ===== Coupons =====
    getCoupons: builder.query({
      query: () => '/coupons/fetch-all-coupons',
      providesTags: ['Coupon'],
    }),

    redeemPoints: builder.mutation({
      query: (body) => ({
        url: '/redeem-points/create-redeempoints-for-notification',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Merchant', 'RedeemPoints', 'Notification'],
    }),
    redeemUpdatePoints: builder.mutation({
      query: (id) => ({
        url: `/redeem-points/update-redeempoints-by-id/${id}`,
        method: 'PUT',
      }),
      invalidatesTags: ['Merchant', 'RedeemPoints', 'Notification'],
    }),

    // ===== Notifications =====
    getNotifications: builder.query({
      query: (userId) => `/coupons-notification/fetch-notifications-by-user/${userId}`,
      providesTags: ['Notification'],
    }),
    getAllRedeemRequests: builder.query({
      query: ({ userId, page = 1, limit = 5 }) => ({
        url: `/coupons-notification/fetch-notifications-by-user/${userId}`,
        params: { page, limit },
      }),
      providesTags: ['Notification'],
    }),
    markNotificationAsRead: builder.mutation({
      query: ({ notificationId, userId }) => ({
        url: '/coupons-notification/mark-as-read',
        method: 'POST',
        body: { notificationId, userId },
      }),
      invalidatesTags: ['Notification'],
    }),
    markNotificationAsUnread: builder.mutation({
      query: ({ notificationId, userId }) => ({
        url: '/coupons-notification/mark-as-unread',
        method: 'POST',
        body: { notificationId, userId },
      }),
      invalidatesTags: ['Notification'],
    }),
    sendRedeemAmount: builder.mutation({
      query: ({ notificationId, receiverId }) => ({
        url: '/coupons-notification/send-redeem-amount',
        method: 'POST',
        body: { notificationId, receiverId },
      }),
      invalidatesTags: ['Notification'],
    }),
    

    // ===== Image Upload =====
    uploadRedeemLetter: builder.mutation({
      query: ({ letter_image, username }) => {
        const formData = new FormData();
        formData.append('letter_image', letter_image);
        formData.append('username', username);

        return {
          url: `${import.meta.env.VITE_API_IMAGE_URL}/redeem-letter/upload-redeem-letter`,
          method: 'POST',
          body: formData,
          headers: {
            // Do not set Content-Type manually; let the browser handle it for multipart/form-data
          },
        };
      },
    }),
  }),
});

export const {
  // Coupon
  useGetCouponsQuery,
  useRedeemPointsMutation,
  useRedeemUpdatePointsMutation,

  // Notifications
  useGetNotificationsQuery,
  useGetAllRedeemRequestsQuery,
  useMarkNotificationAsUnreadMutation,
  useMarkNotificationAsReadMutation,
  useSendRedeemAmountMutation,

  // Image Upload
  useUploadRedeemLetterMutation,
} = CouponsNotificationApi;