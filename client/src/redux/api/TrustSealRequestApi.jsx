import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

export const TrustSealRequestApi = createApi({
  reducerPath: 'TrustSealRequestApi',
  baseQuery: fetchBaseQuery({
    baseUrl: import.meta.env.VITE_API_URL,
    prepareHeaders: (headers) => {
      const token = sessionStorage.getItem('token');
      if (token) {
        headers.set('Authorization', `Bearer ${token}`);
      }
      return headers;
    },
  }),
  tagTypes: ['TrustSealRequests'],
  endpoints: (builder) => ({
    // 1. Create Request
    createTrustSealRequest: builder.mutation({
      query: ({ user_id, amount, subscription_id }) => ({
        url: '/trust-seal/create',
        method: 'POST',
        body: { user_id, amount, subscription_id },
      }),
    }),

    // 2. Verify Payment
    verifyTrustSealPayment: builder.mutation({
      query: (paymentData) => ({
        url: '/trust-seal/verify-payment',
        method: 'POST',
        body: paymentData,
      }),
    }),

    // 3. Get All Trust Seal Requests (Admin)
    getTrustSealRequests: builder.query({
      query: ({ page = 1, limit = 10, status = 'all', dateFilter = {}, requestId }) => {
        const params = new URLSearchParams({ page, limit, status });
        if (requestId) params.append('requestId', requestId);
        if (dateFilter.start && dateFilter.end) {
          params.append('dateFilter[start]', dateFilter.start);
          params.append('dateFilter[end]', dateFilter.end);
        }
        return `/trust-seal/requests?${params.toString()}`;
      },
      transformResponse: (response) => ({
        data: response.data,
        total: response.total,
        page: response.page,
        limit: response.limit,
      }),
      providesTags: ['TrustSealRequests'],
    }),

    // 4. Update Request Status
    updateTrustSealRequestStatus: builder.mutation({
      query: ({ request_id, status, notes }) => ({
        url: '/trust-seal/update-status',
        method: 'POST',
        body: { request_id, status, notes },
      }),
      invalidatesTags: ['TrustSealRequests'],
    }),

    // 5. Get Single User's Trust Seal Status
    getUserTrustSealStatus: builder.query({
      query: (user_id) => `/trust-seal/status/${user_id}`,
      providesTags: ['TrustSealRequests'],
    }),

    // 6. Mark Notification As Read
    markTrustSealNotificationAsRead: builder.mutation({
      query: ({ requestId }) => ({
        url: '/trust-seal/mark-read',
        method: 'POST',
        body: { request_id: requestId },
      }),
      invalidatesTags: ['TrustSealRequests'],
    }),

    // 7. Get Trust Seal Requests for Students
    getTrustSealRequestsForStudents: builder.query({
      query: (studentId) => `/trust-seal/fetch-student-requests/${studentId}`,
      transformResponse: (response) => response.data,
      providesTags: ['TrustSealRequests'],
    }),

    // 8. Pick Request by Student
    pickTrustSealRequest: builder.mutation({
      query: ({ requestId, studentId }) => ({
        url: `/trust-seal/pick/${requestId}`,
        method: 'POST',
        body: { student_id: studentId },
      }),
      invalidatesTags: ['TrustSealRequests'],
    }),

    // 9. Update Uploaded Images
    updateTrustSealImages: builder.mutation({
      query: ({ requestId, imageUrls }) => ({
        url: '/trust-seal/update-images',
        method: 'POST',
        body: { request_id: requestId, imageUrls },
      }),
      invalidatesTags: ['TrustSealRequests'],
    }),

    getAllActiveTrustSealUsers: builder.query({
      query: () => `/trust-seal/fetch-all-active-users`,
      providesTags: ['TrustSealRequests'],
    }),

    getTrustSealPrice: builder.query({
      query: () => `/trust-seal/fetch-trust-seal-price`,
      providesTags: ['TrustSealRequests'],
    }),

    getMerchantTrustSealDetails: builder.query({
      query: ({userId}) => `/trust-seal/fetch-trust-seal-certificate-detail/${userId}`,
      providesTags: ['TrustSealRequests'],
    }),

    // 10. Upload Images to Image Server
    uploadImagesToImageServer: builder.mutation({
      query: ({ companyName, images }) => {
        const formData = new FormData();
        formData.append('company_name', companyName);
        images.forEach((image) => {
          formData.append('images', image);
        });
        return {
          url: `${import.meta.env.VITE_API_IMAGE_URL}/trust-seal-images/upload-images`,
          method: 'POST',
          body: formData,
        };
      },
      transformResponse: (response) => response.imageUrls,
      invalidatesTags: ['TrustSealRequests'],
    }),

    // check trust seal exist
    checkTrustSeal: builder.query({
      query: (userId) => `/trust-seal/check-trust-seal-exist/${userId}`,
      providesTags: ['TrustSealRequests'],
    }),

    // 11. Get My Verified Companies (for the logged-in student)
    getMyVerifiedCompanies: builder.query({
      query: (studentId) => `/trust-seal/my-verified-companies/${studentId}`,
      transformResponse: (response) => response.data || [],
      providesTags: ['TrustSealRequests'],
    }),
    getStudentPaymentHistory: builder.query({
      query: ({ userId, page = 1, limit = 10 }) => `/payment-accounts/user-history/${userId}?page=${page}&limit=${limit}`,
      transformResponse: (response) => ({
        data: response.data || [],
        pagination: response.pagination || {}
      }),
      providesTags: ['TrustSealRequests'],
    }),
  }),
});

export const {
  useGetTrustSealPriceQuery,
  useCheckTrustSealQuery,
  useGetMerchantTrustSealDetailsQuery,
  useCreateTrustSealRequestMutation,
  useVerifyTrustSealPaymentMutation,
  useGetAllActiveTrustSealUsersQuery,
  useGetTrustSealRequestsQuery,
  useUpdateTrustSealRequestStatusMutation,
  useGetUserTrustSealStatusQuery,
  useMarkTrustSealNotificationAsReadMutation,
  useGetTrustSealRequestsForStudentsQuery,
  usePickTrustSealRequestMutation,
  useUpdateTrustSealImagesMutation,
  useUploadImagesToImageServerMutation,
  useGetMyVerifiedCompaniesQuery,
  useGetStudentPaymentHistoryQuery,
} = TrustSealRequestApi;
