// import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

// export const BannerImageApi = createApi({
//   reducerPath: 'ImageApi',
//   baseQuery: fetchBaseQuery({
//     baseUrl: import.meta.env.VITE_API_IMAGE_URL,
//   }),
//   tagTypes: ['Images'],
//   endpoints: (builder) => ({
//     uploadBannerImage: builder.mutation({
//       query: ({ file, company_name }) => {
//         const formData = new FormData();
//         formData.append('banner_image', file);
//         formData.append('company_name', company_name);
//         return {
//           url: '/banner-image/upload',
//           method: 'POST',
//           body: formData,
//           formData: true,
//         };
//       },
//       invalidatesTags: ['Images'],
//     }),
//     uploadCircleLogo: builder.mutation({
//       query: ({ file, company_name }) => {
//         const formData = new FormData();
//         formData.append('circle_logo', file);
//         formData.append('company_name', company_name);
//         return {
//           url: '/banner-image/circle-logo/upload',
//           method: 'POST',
//           body: formData,
//           formData: true,
//         };
//       },
//       invalidatesTags: ['Images'],
//     }),
//     uploadRectangleLogo: builder.mutation({
//       query: ({ file, company_name }) => {
//         const formData = new FormData();
//         formData.append('rectangle_logo', file);
//         formData.append('company_name', company_name);
//         return {
//           url: '/banner-image/rectangle-logo/upload',
//           method: 'POST',
//           body: formData,
//           formData: true,
//         };
//       },
//       invalidatesTags: ['Images'],
//     }),
//     updateBannerImage: builder.mutation({
//       query: ({ file, company_name, old_image_url }) => {
//         const formData = new FormData();
//         formData.append('banner_image', file);
//         formData.append('company_name', company_name);
//         formData.append('old_image_url', old_image_url);
//         return {
//           url: '/banner-image/update',
//           method: 'PUT',
//           body: formData,
//           formData: true,
//         };
//       },
//       invalidatesTags: ['Images'],
//     }),
//     updateCircleLogo: builder.mutation({
//       query: ({ file, company_name, old_image_url }) => {
//         const formData = new FormData();
//         formData.append('circle_logo', file);
//         formData.append('company_name', company_name);
//         formData.append('old_image_url', old_image_url);
//         return {
//           url: '/banner-image/circle-logo/update',
//           method: 'PUT',
//           body: formData,
//           formData: true,
//         };
//       },
//       invalidatesTags: ['Images'],
//     }),
//     updateRectangleLogo: builder.mutation({
//       query: ({ file, company_name, old_image_url }) => {
//         const formData = new FormData();
//         formData.append('rectangle_logo', file);
//         formData.append('company_name', company_name);
//         formData.append('old_image_url', old_image_url);
//         return {
//           url: '/banner-image/rectangle-logo/update',
//           method: 'PUT',
//           body: formData,
//           formData: true,
//         };
//       },
//       invalidatesTags: ['Images'],
//     }),
//     deleteBannerImage: builder.mutation({
//       query: ({ company_name, image_url }) => ({
//         url: '/banner-image/delete',
//         method: 'DELETE',
//         body: { company_name, image_url },
//       }),
//       invalidatesTags: ['Images'],
//     }),
//     deleteCircleLogo: builder.mutation({
//       query: ({ company_name, image_url }) => ({
//         url: '/banner-image/circle-logo/delete',
//         method: 'DELETE',
//         body: { company_name, image_url },
//       }),
//       invalidatesTags: ['Images'],
//     }),
//     deleteRectangleLogo: builder.mutation({
//       query: ({ company_name, image_url }) => ({
//         url: '/banner-image/rectangle-logo/delete',
//         method: 'DELETE',
//         body: { company_name, image_url },
//       }),
//       invalidatesTags: ['Images'],
//     }),
//   }),
// });

// export const {
//   useUploadBannerImageMutation,
//   useUploadCircleLogoMutation,
//   useUploadRectangleLogoMutation,
//   useUpdateBannerImageMutation,
//   useUpdateCircleLogoMutation,
//   useUpdateRectangleLogoMutation,
//   useDeleteBannerImageMutation,
//   useDeleteCircleLogoMutation,
//   useDeleteRectangleLogoMutation,
// } = BannerImageApi;



import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

export const BannerImageApi = createApi({
  reducerPath: 'ImageApi',
  baseQuery: fetchBaseQuery({
    baseUrl: import.meta.env.VITE_API_IMAGE_URL,
  }),
  tagTypes: ['Images'],
  endpoints: (builder) => ({
    uploadBannerImage: builder.mutation({
      query: ({ file, company_name }) => {
        const formData = new FormData();
        formData.append('banner_image', file);
        formData.append('company_name', company_name);
        return {
          url: '/banner-image/upload',
          method: 'POST',
          body: formData,
          formData: true,
        };
      },
      invalidatesTags: ['Images'],
    }),
    uploadRectangleLogo: builder.mutation({
      query: ({ file, company_name }) => {
        const formData = new FormData();
        formData.append('rectangle_logo', file);
        formData.append('company_name', company_name);
        return {
          url: '/banner-image/rectangle-logo/upload',
          method: 'POST',
          body: formData,
          formData: true,
        };
      },
      invalidatesTags: ['Images'],
    }),
    updateBannerImage: builder.mutation({
      query: ({ file, company_name, old_image_url }) => {
        const formData = new FormData();
        formData.append('banner_image', file);
        formData.append('company_name', company_name);
        formData.append('old_image_url', old_image_url);
        return {
          url: '/banner-image/update',
          method: 'PUT',
          body: formData,
          formData: true,
        };
      },
      invalidatesTags: ['Images'],
    }),
    updateRectangleLogo: builder.mutation({
      query: ({ file, company_name, old_image_url }) => {
        const formData = new FormData();
        formData.append('rectangle_logo', file);
        formData.append('company_name', company_name);
        formData.append('old_image_url', old_image_url);
        return {
          url: '/banner-image/rectangle-logo/update',
          method: 'PUT',
          body: formData,
          formData: true,
        };
      },
      invalidatesTags: ['Images'],
    }),
    deleteBannerImage: builder.mutation({
      query: ({ company_name, image_url }) => ({
        url: '/banner-image/delete',
        method: 'DELETE',
        body: { company_name, image_url },
      }),
      invalidatesTags: ['Images'],
    }),
    deleteRectangleLogo: builder.mutation({
      query: ({ company_name, image_url }) => ({
        url: '/banner-image/rectangle-logo/delete',
        method: 'DELETE',
        body: { company_name, image_url },
      }),
      invalidatesTags: ['Images'],
    }),
  }),
});

export const {
  useUploadBannerImageMutation,
  useUploadRectangleLogoMutation,
  useUpdateBannerImageMutation,
  useUpdateRectangleLogoMutation,
  useDeleteBannerImageMutation,
  useDeleteRectangleLogoMutation,
} = BannerImageApi;
