// api/testimonialApi.js
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

export const TestimonialApi = createApi({
  reducerPath: 'testimonialApi',
  baseQuery: fetchBaseQuery({
    baseUrl: import.meta.env.VITE_API_URL, prepareHeaders: (headers) => {
      const token = sessionStorage.getItem("token");
      if (token) {
        headers.set("Authorization", `Bearer ${token}`);
      }
      return headers;
    }
  }),
  tagTypes: ['Testimonial'], // for automatic cache invalidation
  endpoints: (builder) => ({

    // ✅ Get all testimonials
    // In your RTK Query API file
    getTestimonials: builder.query({
      query: ({ filter, page }) => {
        return `/testimonials/fetch-all-testimonial?page=${page}&feedbackType=${filter}`;
      },
      providesTags: ['Testimonial'],
    }),


    // ✅ Get single testimonial by ID
    getTestimonialById: builder.query({
      query: (id) => `/testimonials/fetch-all-testimonial-by-id/${id}`,
      providesTags: (result, error, id) => [{ type: 'Testimonial', id }],
    }),

    // ✅ Create testimonial (text or video)
    submitTestimonial: builder.mutation({
      query: (formData) => ({
        url: '/testimonials/create-testimonial',
        method: 'POST',
        body: formData,
      }),
      invalidatesTags: ['Testimonial'],
    }),

    // ✅ Update testimonial
    updateTestimonial: builder.mutation({
      query: ({ id, data }) => ({
        url: `/testimonials/update-testimonial/${id}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: (result, error, { id }) => [{ type: 'Testimonial', id }],
    }),

    // ✅ Delete testimonial
    deleteTestimonial: builder.mutation({
      query: (id) => ({
        url: `/testimonials/delete-testimonial/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: (result, error, id) => [{ type: 'Testimonial', id }],
    }),
  }),
});

export const {
  useGetTestimonialsQuery,
  useGetTestimonialByIdQuery,
  useSubmitTestimonialMutation,
  useUpdateTestimonialMutation,
  useDeleteTestimonialMutation,
} = TestimonialApi;
