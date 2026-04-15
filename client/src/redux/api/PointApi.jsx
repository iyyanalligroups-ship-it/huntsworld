// features/api/pointsApi.js
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

export const PointsApi = createApi({
  reducerPath: 'pointsApi',
  baseQuery: fetchBaseQuery({ baseUrl: import.meta.env.VITE_API_URL }),
  tagTypes: ['Points'],
  endpoints: (builder) => ({
    getPoints: builder.query({
      query: () => '/treanding-points/fetch-all-points',
      providesTags: ['Points'],
    }),
    addPoint: builder.mutation({
      query: (newPoint) => ({
        url: '/treanding-points/create-points',
        method: 'POST',
        body: newPoint,
      }),
      invalidatesTags: ['Points'],
    }),
    updatePoint: builder.mutation({
      query: ({ id, ...data }) => ({
        url: `/treanding-points/update-points/${id}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: ['Points'],
    }),
    deletePoint: builder.mutation({
      query: (id) => ({
        url: `/treanding-points/delete-points/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Points'],
    }),
    getViewPointConfig: builder.query({
      query: () => "/treanding-points/view-point",
      providesTags: ['Points'],
    }),

  }),
});

export const {
  useGetPointsQuery,
  useGetViewPointConfigQuery,
  useAddPointMutation,
  useUpdatePointMutation,
  useDeletePointMutation,


} = PointsApi;
