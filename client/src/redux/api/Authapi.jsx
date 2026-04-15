import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

export const Authapi = createApi({
  reducerPath: "authApi",
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
  tagTypes: ["User"],
  endpoints: (builder) => ({
    // 🔹 Auth Endpoints
    registerUser: builder.mutation({
      query: (userData) => ({
        url: "/users/register",
        method: "POST",
        body: userData,
      }),
    }),
    loginWithEmail: builder.mutation({
      query: (credentials) => ({
        url: "/users/login",
        method: "POST",
        body: credentials,
      }),
    }),

    // 🔹 OTP Endpoints
    sendOtp: builder.mutation({
      query: ({phone}) => ({
        url: "/users/send-number-otp",
        method: "POST",
        body: { phone },
      }),
    }),
    verifyOtp: builder.mutation({
      query: ({ mobile, otp }) => ({
        url: "/users/verify-otp",
        method: "POST",
        body: { mobile, otp },
      }),
    }),
    verifyEmailOtp: builder.mutation({
      query: ({ email, email_otp, phone }) => ({
        url: "/users/verify-otp", // ✅ Ensure backend can handle both email & mobile OTP
        method: "POST",
        body: { email, email_otp, phone },
      }),
    }),
    resendOtp: builder.mutation({
      query: (data) => ({
        url: "/users/resend-otp",
        method: "POST",
        body: data,
      }),
    }),

    // 🔹 User CRUD Operations
    getUserById: builder.query({
      query: (userId) => `/users/fetch-users-by-id/${userId}`,
      providesTags: ["User"],
    }),
    getUsers: builder.query({
      query: ({ name = "", page = 1, limit = 10 }) => {
        const query = new URLSearchParams();
        if (name) query.append("name", name);
        query.append("page", page);
        query.append("limit", limit);

        return `/users/fetch-all-users?${query.toString()}`;
      },
      transformResponse: (response) => response,
      providesTags: ["User"],
    }),

    addUser: builder.mutation({
      query: (newUser) => ({
        url: "/users/register",
        method: "POST",
        body: newUser,
      }),
      invalidatesTags: ["User"], // ✅ Ensure UI updates after adding a user
    }),
    updateUser: builder.mutation({
      query: ({ id, updatedUser }) => ({
        url: `/users/update-users-by-id/${id}`,
        method: "PUT",
        body: updatedUser,
      }),
      invalidatesTags: ["User"], // ✅ Ensure UI updates after updating a user
    }),
    deleteUser: builder.mutation({
      query: (id) => ({
        url: `/users/delete-users-by-id/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["User"], // ✅ Ensure UI updates after deleting a user
    }),

    // User Address

    getUserAddresses: builder.query({
      query: ({ user_id }) => `/address/fetch-address-by-id/${user_id}`,
      providesTags: (result, error, user_id) => [{ type: 'Address', id: user_id }],
    }),

    addUserAddress: builder.mutation({
      query: (data) => ({
        url: "/address/create-address",
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["User"], // ✅ Ensure UI updates after adding an address
    }),
    updateUserAddress: builder.mutation({
      query: ({ user_id, selectedAddressId, updatedAddress }) => ({
        url: `/address/update-address/${user_id}/${selectedAddressId}`,
        method: "PUT",
        body: updatedAddress,
      }),
      invalidatesTags: ["User"],
    }),

    DeleteUserAddress: builder.mutation({
      query: ({ user_id, addressId }) => ({
        url: `/address/delete-address-addressId-userId/${user_id}/${addressId}`,
        method: "DELETE",
        // body: { user_id, addressId }
      }),
      invalidatesTags: ["User"],
    }),
    getUserByIdForChat: builder.query({
      query: (id) => `/users/fetch-users-by-id-for-chat/${id}`,
    }),
    completeRegistration: builder.mutation({
      query: (data) => ({
        url: "/users/complete-registration",
        method: "POST",
        body: data,
      }),
    }),
  }),
});

export const {
  useRegisterUserMutation,
  useGetUserByIdForChatQuery,
  useLoginWithEmailMutation,
  useSendOtpMutation,
  useResendOtpMutation,
  useVerifyOtpMutation,
  useVerifyEmailOtpMutation,
  useGetUserByIdQuery,
  useLazyGetUserByIdQuery,
  useGetUsersQuery,
  useAddUserMutation,
  useUpdateUserMutation,
  useDeleteUserMutation,
  useGetUserAddressesQuery,
  useAddUserAddressMutation,
  useUpdateUserAddressMutation,
  useDeleteUserAddressMutation,
  useCompleteRegistrationMutation,
} = Authapi;
