import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

export const CouponApi = createApi({
  reducerPath: 'couponApi',
  baseQuery: fetchBaseQuery({baseUrl:import.meta.env.VITE_API_URL }),
  tagTypes: ['Coupons'],
  endpoints: (builder) => ({
    getCoupons: builder.query({
      query: () => '/coupons/fetch-all-coupons',
      providesTags: ['Coupons'],
    }),
    addCoupon: builder.mutation({
      query: (newCoupon) => ({
        url: '/coupons/create-coupons',
        method: 'POST',
        body: newCoupon,
      }),
      invalidatesTags: ['Coupons'],
    }),
    updateCoupon: builder.mutation({
      query: ({ id, ...updatedData }) => ({
        url: `/coupons/update-coupons/${id}`,
        method: 'PUT',
        body: updatedData,
      }),
      invalidatesTags: ['Coupons'],
    }),
    deleteCoupon: builder.mutation({
      query: (id) => ({
        url: `/coupons/delete-coupons/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Coupons'],
    }),
  }),
});

export const {
  useGetCouponsQuery,
  useAddCouponMutation,
  useUpdateCouponMutation,
  useDeleteCouponMutation,
} = CouponApi;
