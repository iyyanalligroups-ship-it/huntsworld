import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

export const CompanyTypeApi = createApi({
  reducerPath: "companyTypeApi",
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
  tagTypes: ["CompanyType"],
  endpoints: (builder) => ({
    getCompanyTypeOptions: builder.query({
      query: () => "/company-types/options",
      providesTags: ["CompanyType"],
    }),
    getCompanyTypes: builder.query({
      query: ({ page = 1, limit = 5 } = {}) =>
        `/company-types?page=${page}&limit=${limit}`,
      providesTags: ["CompanyType"],
    }),
  }),
});

export const {
  useGetCompanyTypeOptionsQuery,
  useGetCompanyTypesQuery,
} = CompanyTypeApi;
