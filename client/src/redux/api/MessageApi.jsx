import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

export const MessageApi = createApi({
  reducerPath: 'messageApi',
  baseQuery: fetchBaseQuery({
    baseUrl: import.meta.env.VITE_API_URL,
    prepareHeaders: (headers) => {
      const token = sessionStorage.getItem("token");
      if (token) {
        headers.set("Authorization", `Bearer ${token}`);
        headers.set("Content-Type", "application/json");
      }
      return headers;
    },
  }),
  tagTypes: ['Messages'],
  endpoints: (builder) => ({
    sendMessage: builder.mutation({
      query: (messageData) => ({
        url: '/chat/send-message',
        method: 'POST',
        body: messageData,
      }),
      invalidatesTags: ['Messages'],
    }),

    getMessages: builder.query({
      query: ({ userId, chatPartnerId, page, pageSize }) =>
        `/chat/recieve-message/${userId}/${chatPartnerId}?page=${page}&pageSize=${pageSize}`,
      providesTags: ['Messages'],
      transformResponse: (response) => response,
    }),

    markAsRead: builder.mutation({
      query: ({ userId, selectedUserId }) => ({
        url: `/chat/mark-as-read`,
        method: 'PATCH',
        body: { userId, selectedUserId },
      }),
      invalidatesTags: ['Messages'],
    }),

    // Update a message
    updateMessage: builder.mutation({
      query: ({ messageId, updatedData }) => ({
        url: `/chat/update-message/${messageId}`,
        method: 'PUT',
        body: updatedData,
      }),
      invalidatesTags: ['Messages'],
    }),

    deleteMessage: builder.mutation({
      query: ({ messageId }) => ({
        url: `/chat/delete-message/${messageId}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Messages'],
    }),

    getAllUsers: builder.query({
      query: ({ userId, page = 1, limit = 10 }) =>
        `/users/fetch-user-by-user-id/${userId}?page=${page}&limit=${limit}`,
      providesTags: ['Messages'],
    }),

    getLastMessageBetweenUsers: builder.query({
      query: ({ userId, contactId }) => `/chat/last-message?userId=${userId}&contactId=${contactId}`,
      providesTags: ['Messages'],
    }),
  }),
});

export const {
  useSendMessageMutation,
  useGetMessagesQuery,
  useGetAllUsersQuery,
  useLazyGetLastMessageBetweenUsersQuery,
  useGetLastMessageBetweenUsersQuery,
  useMarkAsReadMutation,
  useUpdateMessageMutation,
  useDeleteMessageMutation,
} = MessageApi;