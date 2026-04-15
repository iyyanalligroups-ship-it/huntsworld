import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

export const SubDealerApi = createApi({
  reducerPath: 'subDealerApi',
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
  tagTypes: ['SubDealer', 'Merchant', 'User'],

  endpoints: (builder) => ({
    // 1. GET all sub-dealers
  getAllSubDealers: builder.query({
      query: ({ search = '', dateFilter = '', merchant_id = '', page = 1, limit = 10 }) => ({
        url: `/sub-dealers/fetch-all-subdealers`,
        params: { search, dateFilter, merchant_id, page, limit },
      }),
      providesTags: ['SubDealer'],
    }),

    // 2. GET single sub-dealer by ID (optional)
    getSubDealerById: builder.query({
      query: (id) => `/sub-dealers/fetch-subdealers-by-id/${id}`,
      providesTags: ['SubDealer'],
    }),

    // 3. CREATE sub-dealer
    createSubDealer: builder.mutation({
      query: (body) => ({
        url: '/sub-dealers/create-subdealers',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['SubDealer'],
    }),

    // 4. UPDATE sub-dealer
    updateSubDealer: builder.mutation({
      query: ({ id, body }) => ({
        url: `/sub-dealers/update-subdealers-by-id/${id}`,
        method: 'PUT',
        body,
      }),
      invalidatesTags: ['SubDealer'],
    }),

    // 5. DELETE sub-dealer
    deleteSubDealer: builder.mutation({
      query: (id) => ({
        url: `/sub-dealers/delete-subdealers-by-id/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['SubDealer'],
    }),

    // 6. GET all merchants (for dropdown)
    getAllMerchants: builder.query({
      query: () => '/users/fetch-only-merchants',
      providesTags: ['Merchant'],
    }),

    // 7. GET all normal users (for dropdown)
    getAllUsers: builder.query({
      query: () => '/users/fetch-only-users',
      providesTags: ['User'],
    }),
    getUserById: builder.query({
      query: (id) => `/users/fetch-users-by-id-sub-dealer/${id}`,
      providesTags: ['User']
    }),
  }),
});

export const {
  useGetAllSubDealersQuery,
  useGetSubDealerByIdQuery,
  useGetUserByIdQuery,
  useCreateSubDealerMutation,
  useUpdateSubDealerMutation,
  useDeleteSubDealerMutation,
  useGetAllMerchantsQuery,
  useGetAllUsersQuery,
} = SubDealerApi;
