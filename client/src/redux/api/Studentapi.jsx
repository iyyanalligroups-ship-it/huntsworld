import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

export const StudentApi = createApi({
  reducerPath: "studentApi",
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
  tagTypes: ["Student"],
  endpoints: (builder) => ({
    getStudents: builder.query({
      query: () => "/students/fetch-students",
      providesTags: ["Student"],
    }),
    getStudentById: builder.query({
      query: (id) => `/students/fetch-students-by-id/${id}`,
      providesTags: ["Student"],
    }),
    addStudent: builder.mutation({
      query: (studentData) => ({
        url: "/students/create-students",
        method: "POST",
        body: studentData,
      }),
      invalidatesTags: ["Student"],
    }),
    updateStudent: builder.mutation({
      query: ({ id, ...updatedData }) => ({
        url: `/students/update-students-by-id/${id}`,
        method: "PATCH",
        body: updatedData,
      }),
      invalidatesTags: ["Student"],
    }),
    deleteStudent: builder.mutation({
      query: (id) => ({
        url: `/students/delete-students-by-id/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Student"],
    }),
  }),
});

export const {
  useGetStudentsQuery,
  useGetStudentByIdQuery,
  useAddStudentMutation,
  useUpdateStudentMutation,
  useDeleteStudentMutation,
} = StudentApi;