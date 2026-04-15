import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

export const ComplaintFormImageApi = createApi({
  reducerPath: "complaintFormImageApi",
  baseQuery: fetchBaseQuery({
    baseUrl: import.meta.env.VITE_API_IMAGE_URL, // Separate server for image upload
    prepareHeaders: (headers) => {
      const token = sessionStorage.getItem("token");
      if (token) {
        headers.set("Authorization", `Bearer ${token}`);
      }
      return headers;
    },
  }),
  tagTypes: ["ComplaintFormImage"],
  endpoints: (builder) => ({
    // ✅ Upload image(s)
    uploadImages: builder.mutation({
      query: (formData) => ({
        url: `/complaint-forms/upload-complaint-image`,
        method: "POST",
        body: formData,
      }),
      invalidatesTags: ["ComplaintFormImage"],
    }),

    // ✅ Update image(s)
    updateImages: builder.mutation({
      query: (formData) => ({
        url: `/complaint-forms/update-complaint-image`,
        method: "PUT",
        body: formData,
      }),
      invalidatesTags: ["ComplaintFormImage"],
    }),

    // ✅ Delete image
    deleteImage: builder.mutation({
      query: (data) => ({
        url: `/complaint-forms/delete-complaint-image`,
        method: "DELETE",
        body: data,
      }),
      invalidatesTags: ["ComplaintFormImage"],
    }),
  }),
});

export const {
  useUploadImagesMutation,
  useUpdateImagesMutation,
  useDeleteImageMutation,
} = ComplaintFormImageApi;
