// redux/api/MerchantImageApi.js
import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

export const MerchantImageApi = createApi({
  reducerPath: "merchantImageApi",
  baseQuery: fetchBaseQuery({
    baseUrl: `${import.meta.env.VITE_API_URL}/merchant-images`, // Add /merchant-images to the baseUrl
    prepareHeaders: (headers) => {
      const token = sessionStorage.getItem("token");
      if (token) {
        headers.set("Authorization", `Bearer ${token}`);
      }
      return headers;
    },
  }),
  tagTypes: ["MerchantImages"],
  endpoints: (builder) => ({
    // 🔹 Company Image Endpoints
    uploadCompanyImages: builder.mutation({
      query: ({ entity_type, company_name, user_id, files }) => {
        const formData = new FormData();
        files.forEach(file => formData.append("files", file));
        formData.append("entity_type", entity_type);
        formData.append("company_name", company_name);
        formData.append("user_id", user_id);

        return {
          url: "/upload-company-image",
          method: "POST",
          body: formData,
        };
      },
      invalidatesTags: ["MerchantImages"],
    }),

    updateCompanyImage: builder.mutation({
      query: ({ entity_type, company_name, user_id, old_filename, file }) => {
        const formData = new FormData();
        formData.append("files", file);
        formData.append("entity_type", entity_type);
        formData.append("company_name", company_name);
        formData.append("user_id", user_id);
        formData.append("old_filename", old_filename);

        return {
          url: "/update-company-image",
          method: "PUT",
          body: formData,
        };
      },
      invalidatesTags: ["MerchantImages"],
    }),

    deleteCompanyImage: builder.mutation({
      query: ({ entity_type, company_name, user_id, filename }) => ({
        url: "/delete-company-image",
        method: "DELETE",
        body: { entity_type, company_name, user_id, filename },
      }),
      invalidatesTags: ["MerchantImages"],
    }),

    getCompanyImage: builder.query({
      query: ({ entity_type, company_name, filename }) =>
        `/get-file/${entity_type}/${company_name}/${filename}`,
      providesTags: ["MerchantImages"],
    }),

    // 🔹 Company Logo Endpoints
    uploadCompanyLogo: builder.mutation({
      query: ({ company_name, user_id, logo }) => {
        const formData = new FormData();
        formData.append("logo", logo);
        formData.append("company_name", company_name);
        formData.append("user_id", user_id);

        return {
          url: "/upload-logo",
          method: "POST",
          body: formData,
        };
      },
      invalidatesTags: ["MerchantImages"],
    }),

    updateCompanyLogo: builder.mutation({
      query: ({ company_name, user_id, logo }) => {
        const formData = new FormData();
        formData.append("logo", logo);
        formData.append("company_name", company_name);
        formData.append("user_id", user_id);

        return {
          url: "/update-logo",
          method: "PUT",
          body: formData,
        };
      },
      invalidatesTags: ["MerchantImages"],
    }),

    deleteCompanyLogo: builder.mutation({
      query: ({ company_name, user_id }) => ({
        url: "/delete-logo",
        method: "DELETE",
        body: { company_name, user_id },
      }),
      invalidatesTags: ["MerchantImages"],
    }),

    getCompanyLogo: builder.query({
      query: (company_name) => `/logo/${company_name}`,
      providesTags: ["MerchantImages"],
    }),
  }),
});

export const {
  useUploadCompanyImagesMutation,
  useUpdateCompanyImageMutation,
  useDeleteCompanyImageMutation,
  useGetCompanyImageQuery,
  useUploadCompanyLogoMutation,
  useUpdateCompanyLogoMutation,
  useDeleteCompanyLogoMutation,
  useGetCompanyLogoQuery,
} = MerchantImageApi;