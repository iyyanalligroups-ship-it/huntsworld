import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

export const ComplaintFormApi = createApi({
  reducerPath: "complaintFormApi",
  baseQuery: fetchBaseQuery({
    baseUrl: import.meta.env.VITE_API_URL,
    prepareHeaders: (headers) => {
      const token = sessionStorage.getItem("token");
      if (token) {
        headers.set("Authorization", `Bearer ${token}`);
      }
      return headers;
    },
  }),
  tagTypes: ["ComplaintForm"],
  endpoints: (builder) => ({
    getComplaintForms: builder.query({
      query: ({ page = 1, limit = 10, type = "all", option = "all" }) => {
        const queryParams = new URLSearchParams({
          page: page.toString(),
          limit: limit.toString(),
        });
        if (type && type !== "all") queryParams.append("type", type);
        if (option && option !== "all") queryParams.append("option", option);
    
        return `/complaint-form/fetch-all-complaint?${queryParams.toString()}`;
      },
      transformResponse: (response) => ({
        complaints: Array.isArray(response.data) ? response.data : [],
        pagination: response.pagination || { total: 0, page: 1, limit: 10, totalPages: 1 },
      }),
      providesTags: ["ComplaintForm"],
      onError: (error) => {
        console.error("Error fetching complaints:", error);
      },
    }),
    

    createComplaintForm: builder.mutation({
      query: (data) => ({
        url: "/complaint-form/create-complaint",
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["ComplaintForm"],
    }),

    updateComplaintForm: builder.mutation({
      query: ({ id, ...data }) => ({
        url: `/complaint-form/update-complaint/${id}`,
        method: "PUT",
        body:data.body,
      }),
      invalidatesTags: ["ComplaintForm"],
    }),

    deleteComplaintForm: builder.mutation({
      query: (id) => ({
        url: `/complaint-form/delete-complaint/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["ComplaintForm"],
    }),
  }),
});

export const {
  useGetComplaintFormsQuery,
  useCreateComplaintFormMutation,
  useUpdateComplaintFormMutation,
  useDeleteComplaintFormMutation,
} = ComplaintFormApi;
