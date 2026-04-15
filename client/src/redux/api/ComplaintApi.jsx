// src/redux/api/ComplaintApi.js
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

export const complaintApi = createApi({
  reducerPath: 'complaintApi',
  baseQuery: fetchBaseQuery({
    baseUrl: import.meta.env.VITE_API_URL,
    credentials: 'include', // if you use cookies/auth
  }),
  tagTypes: ['Complaint'], // for cache invalidation
  endpoints: (builder) => ({
    getComplaints: builder.query({
      query: ({ userId, value }) => ({
        url: 'complaint-form/fetch-user-complaints',
        params: { user_id: userId, option: value || undefined },
      }),
      transformResponse: (response) => response.data || [],
      providesTags: ['Complaint'],
    }),

    deleteComplaint: builder.mutation({
      query: (complaintId) => ({
        url: `complaint-form/delete-complaint/${complaintId}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Complaint'], // refetch list after delete
    }),

    getComplaintsBySupplierNumberAndType: builder.query({
      query: ({ supplierNumber, type }) => ({
        url: 'complaint-form/fetch-complaints-by-supplier-and-type',
        params: { supplier_number: supplierNumber, type },
      }),
      transformResponse: (response) => response.data || [],
    }),

    getMerchantByUserId: builder.query({
      query: (userId) => ({
        url: 'merchants/fetch-merchant-by-user-id',
        params: { user_id: userId },
      }),
      transformResponse: (response) => response.data || null,
    }),
  }),
});

export const {
  useGetComplaintsQuery,
  useDeleteComplaintMutation, // exported
  useGetComplaintsBySupplierNumberAndTypeQuery,
  useGetMerchantByUserIdQuery,
} = complaintApi;
