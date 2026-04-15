import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

export const SubDealerImageApi = createApi({
  reducerPath: 'subDealerImageApi',
  baseQuery: fetchBaseQuery({
    baseUrl: import.meta.env.VITE_API_IMAGE_URL,
    prepareHeaders: (headers) => {
      const token = sessionStorage.getItem('token');
      if (token) {
        headers.set('Authorization', `Bearer ${token}`);
      }
      return headers;
    },
  }),
  tagTypes: ['SubDealerImage'],
  endpoints: (builder) => ({
    uploadCompanyLogo: builder.mutation({
      query: (formData) => ({
        url: `/merchant-images/upload-logo`,
        method: 'POST',
        body: formData,
      }),
      invalidatesTags: ['SubDealerImage'],
    }),
    updateCompanyLogo: builder.mutation({
      query: ({ formData }) => ({
        url: `/merchant-images/update-logo`,
        method: 'PUT',
        body: formData,
      }),
      invalidatesTags: ['SubDealerImage'],
    }),
    deleteCompanyLogo: builder.mutation({
      query: ({ company_name }) => ({
        url: `/merchant-images/delete-logo`,
        method: 'DELETE',
        body: { company_name },
      }),
      invalidatesTags: ['SubDealerImage'],
    }),
    uploadCompanyImages: builder.mutation({
      query: ({formData}) => ({
        url: `/merchant-images/upload-company-image`,
        method: 'POST',
        body: formData,
      }),
      invalidatesTags: ['SubDealerImage'],
    }),
    updateCompanyImages: builder.mutation({
      query: ({ formData, entity_type, company_name, old_filename }) => ({
        url: `/merchant-images/update-company-image`,
        method: 'PUT',
        body: formData,
        params: { entity_type, company_name, old_filename },
      }),
      invalidatesTags: ['SubDealerImage'],
    }),
    deleteCompanyImage: builder.mutation({
      query: ({ entity_type, company_name, filename }) => ({
        url: `/merchant-images/delete-company-image`,
        method: 'DELETE',
        body: { entity_type, company_name, filename },
      }),
      invalidatesTags: ['SubDealerImage'],
    }),
  }),
});

export const {
  useUploadCompanyLogoMutation,
  useUpdateCompanyLogoMutation,
  useDeleteCompanyLogoMutation,
  useUploadCompanyImagesMutation,
  useUpdateCompanyImagesMutation,
  useDeleteCompanyImageMutation,
} = SubDealerImageApi;